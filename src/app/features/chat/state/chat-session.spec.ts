import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { AuthSession } from '../../../core/auth/auth-session';
import { translocoTesting } from '../../../i18n/testing/transloco-testing';
import { LanguageService } from '../../../i18n/language.service';
import { Person, PersonDraft } from '../../persons/domain/person';
import { PersonApi } from '../../persons/data/person-api';
import { PersonApiResolver } from '../../persons/data/person-api-resolver';
import { PersonChanges } from '../../persons/state/person-changes';
import { LlmClient } from '../data/llm-client';
import { LlmMessage, LlmReply, ToolDefinition } from '../domain/chat';
import { provideChat } from '../provide-chat';
import { ChatSession } from './chat-session';

const ANNA: Person = {
  id: 'p1',
  firstName: 'Anna',
  lastName: 'Muster',
  birthday: null,
  gender: null,
  description: null,
  email: null,
  phone: null,
  type: null,
  addresses: [],
  createdId: 'u',
  createdDate: '2026-01-01T00:00:00Z',
  modifiedId: null,
  modifiedDate: null,
  version: 'v',
};

class FakePersonApi implements PersonApi {
  readonly capabilities = { write: true };
  getAll = jest.fn(() => of([ANNA]));
  getById = jest.fn((_id: string) => of(ANNA));
  create = jest.fn((_draft: PersonDraft) => of('new-id'));
  update = jest.fn(() => of(undefined));
  delete = jest.fn((_id: string) => of(undefined));
}

class ScriptedLlm extends LlmClient {
  readonly requests: { messages: readonly LlmMessage[]; tools: readonly ToolDefinition[] }[] = [];
  private readonly script: (LlmReply | HttpErrorResponse)[] = [];

  reply(...replies: (LlmReply | HttpErrorResponse)[]): void {
    this.script.push(...replies);
  }

  complete(
    messages: readonly LlmMessage[],
    tools: readonly ToolDefinition[],
  ): Observable<LlmReply> {
    this.requests.push({ messages: [...messages], tools });
    const next = this.script.shift() ?? { content: 'fertig', toolCalls: [] };
    return next instanceof HttpErrorResponse ? throwError(() => next) : of(next);
  }
}

const answer = (content: string): LlmReply => ({ content, toolCalls: [] });
const callTool = (name: string, args: object, id = `call-${name}`): LlmReply => ({
  content: null,
  toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
});

describe('ChatSession', () => {
  let llm: ScriptedLlm;
  let api: FakePersonApi;
  let canWrite: ReturnType<typeof signal<boolean>>;
  let canDelete: ReturnType<typeof signal<boolean>>;
  let session: ChatSession;

  beforeEach(() => {
    llm = new ScriptedLlm();
    api = new FakePersonApi();
    canWrite = signal(false);
    canDelete = signal(false);
    TestBed.configureTestingModule({
      imports: [translocoTesting()],
      providers: [
        provideChat(),
        { provide: LlmClient, useValue: llm },
        { provide: PersonApiResolver, useValue: { api: signal(api) } },
        { provide: AuthSession, useValue: { userName: signal('reader'), canWrite, canDelete } },
        { provide: LanguageService, useValue: { active: signal('de') } },
      ],
    });
    session = TestBed.inject(ChatSession);
  });

  const toolNames = (request: number) => llm.requests[request].tools.map((tool) => tool.name);

  it('answers directly when the model needs no tool', async () => {
    llm.reply(answer('Hallo! Wie kann ich helfen?'));

    await session.send('Hallo');

    expect(session.entries()).toEqual([
      { kind: 'user', text: 'Hallo', attachments: [] },
      { kind: 'assistant', text: 'Hallo! Wie kann ich helfen?' },
    ]);
    expect(session.busy()).toBe(false);
  });

  it('runs tool calls, feeds the results back and shows the final answer', async () => {
    llm.reply(
      callTool('search_persons', { query: 'Muster' }),
      answer('Ich habe Anna Muster gefunden.'),
    );

    await session.send('Gibt es eine Frau Muster?');

    expect(api.getAll).toHaveBeenCalled();
    expect(llm.requests[1].messages.slice(-2)).toEqual([
      {
        role: 'assistant',
        content: null,
        toolCalls: [
          { id: 'call-search_persons', name: 'search_persons', arguments: '{"query":"Muster"}' },
        ],
      },
      {
        role: 'tool',
        toolCallId: 'call-search_persons',
        content: expect.stringContaining('"Anna Muster"'),
      },
    ]);
    expect(session.entries()).toEqual([
      { kind: 'user', text: 'Gibt es eine Frau Muster?', attachments: [] },
      { kind: 'tool', toolName: 'search_persons', succeeded: true },
      { kind: 'assistant', text: 'Ich habe Anna Muster gefunden.' },
    ]);
  });

  it('starts every request with a system prompt naming the user, language and rights', async () => {
    await session.send('Hallo');

    const system = llm.requests[0].messages[0];
    expect(system.role).toBe('system');
    const content = (system as { content: string }).content;
    expect(content).toContain('reader');
    expect(content).toContain('German');
    expect(content).toContain('read only');
  });

  it('keeps the conversation across messages', async () => {
    await session.send('Erste Frage');
    await session.send('Zweite Frage');

    const roles = llm.requests[1].messages.map((message) => message.role);
    expect(roles).toEqual(['system', 'user', 'assistant', 'user']);
  });

  describe('respects the rights of the signed-in user', () => {
    it('offers a reader only read tools and refuses writes', async () => {
      llm.reply(
        callTool('create_person', { firstName: 'Lisa', lastName: 'Meier' }),
        answer('Nicht erlaubt.'),
      );

      await session.send('Lege Lisa Meier an');

      expect(toolNames(0)).toEqual(['search_persons', 'get_person']);
      expect(api.create).not.toHaveBeenCalled();
      expect(session.entries()[1]).toEqual({
        kind: 'tool',
        toolName: 'create_person',
        succeeded: false,
      });
    });

    it('lets a writer create but not delete', async () => {
      canWrite.set(true);
      llm.reply(
        callTool('create_person', { firstName: 'Lisa', lastName: 'Meier' }),
        callTool('delete_person', { id: 'p1' }),
        answer('Erstellt; löschen darf ich nicht.'),
      );

      await session.send('Lege Lisa Meier an und lösche Anna Muster');

      expect(toolNames(0)).not.toContain('delete_person');
      expect(api.create).toHaveBeenCalled();
      expect(api.delete).not.toHaveBeenCalled();
    });

    it('lets an admin delete and tells the person views to reload', async () => {
      canWrite.set(true);
      canDelete.set(true);
      llm.reply(callTool('delete_person', { id: 'p1' }), answer('Anna Muster wurde gelöscht.'));

      await session.send('Lösche Anna Muster');

      expect(toolNames(0)).toContain('delete_person');
      expect(api.delete).toHaveBeenCalledWith('p1');
      expect(TestBed.inject(PersonChanges).revision()).toBe(1);
    });
  });

  it('reports backend errors to the model so it can explain them', async () => {
    api.getAll.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    llm.reply(callTool('search_persons', {}), answer('Das Backend ist nicht erreichbar.'));

    await session.send('Liste alle');

    const toolMessage = llm.requests[1].messages.at(-1) as { content: string };
    expect(toolMessage.content).toContain('Backend nicht erreichbar.');
    expect(session.entries().at(-1)).toEqual({
      kind: 'assistant',
      text: 'Das Backend ist nicht erreichbar.',
    });
  });

  it('shows an error when the language model is unreachable', async () => {
    llm.reply(new HttpErrorResponse({ status: 504 }));

    await session.send('Hallo');

    expect(session.entries().at(-1)).toEqual({
      kind: 'error',
      text: 'Das Sprachmodell ist nicht erreichbar. Laufen das KI-Gateway und Ollama?',
    });
    expect(session.busy()).toBe(false);
  });

  it('stops a runaway tool loop', async () => {
    llm.reply(...Array.from({ length: 10 }, (_, i) => callTool('search_persons', {}, `c${i}`)));

    await session.send('Endlos');

    expect(llm.requests).toHaveLength(6);
    expect(session.entries().at(-1)).toEqual({
      kind: 'error',
      text: 'Die Anfrage brauchte zu viele Schritte und wurde abgebrochen.',
    });
  });

  it('ignores blank messages and messages while busy', async () => {
    await session.send('   ');
    const first = session.send('Eins');
    await session.send('Zwei');
    await first;

    expect(llm.requests).toHaveLength(1);
  });

  it('clears the conversation', async () => {
    await session.send('Hallo');

    session.clear();

    expect(session.entries()).toEqual([]);
    await session.send('Neu');
    expect(llm.requests[1].messages.map((m) => m.role)).toEqual(['system', 'user']);
  });

  it('sends attachments with the message and shows their names', async () => {
    const csv = { name: 'liste.csv', kind: 'text' as const, content: 'Lisa;Meier' };

    await session.send('Lege diese Personen an', [csv]);

    expect(llm.requests[0].messages[1]).toEqual({
      role: 'user',
      content: 'Lege diese Personen an',
      attachments: [csv],
    });
    expect(session.entries()[0]).toEqual({
      kind: 'user',
      text: 'Lege diese Personen an',
      attachments: ['liste.csv'],
    });
  });

  it('accepts a message that only consists of attachments', async () => {
    await session.send('  ', [{ name: 'notiz.txt', kind: 'text', content: 'x' }]);

    expect(llm.requests).toHaveLength(1);
  });

  it('points to a missing API key when the model provider refuses access', async () => {
    llm.reply(new HttpErrorResponse({ status: 401 }));

    await session.send('Hallo');

    expect(session.entries().at(-1)).toEqual({
      kind: 'error',
      text: expect.stringContaining('OPENAI_API_KEY'),
    });
  });
});
