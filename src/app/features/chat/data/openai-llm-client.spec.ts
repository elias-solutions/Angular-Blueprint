import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AppConfig, ChatProviderConfig } from '../../../core/config/app-config';
import { AppConfigStore } from '../../../core/config/app-config-store';
import { ToolDefinition } from '../domain/chat';
import { ChatProviderSelection } from '../state/chat-provider-selection';
import { LlmClient } from './llm-client';
import { OpenAiLlmClient } from './openai-llm-client';

const URL = '/llm/v1/chat/completions';

const SEARCH: ToolDefinition = {
  name: 'search_persons',
  description: 'Lists persons.',
  parameters: { type: 'object', properties: { query: { type: 'string' } } },
};

const LOCAL: ChatProviderConfig = {
  id: 'local',
  label: 'Lokal',
  baseUrl: '/llm/v1',
  model: 'qwen3:8b',
  reasoningEffort: 'none',
  capabilities: { images: false, pdf: false },
};

const OPENAI: ChatProviderConfig = {
  id: 'openai',
  label: 'OpenAI',
  baseUrl: '/openai/v1',
  model: 'gpt-5-mini',
  capabilities: { images: true, pdf: true },
};

function configure(local: ChatProviderConfig): LlmClient {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  TestBed.inject(AppConfigStore).use({
    chat: { defaultProviderId: 'local', providers: [local, OPENAI] },
  } as unknown as AppConfig);
  return TestBed.inject(OpenAiLlmClient);
}

describe('OpenAiLlmClient', () => {
  let client: LlmClient;
  let http: HttpTestingController;

  beforeEach(() => {
    client = configure(LOCAL);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the conversation and tools in the OpenAI format', () => {
    void firstValueFrom(
      client.complete(
        [
          { role: 'system', content: 'sys' },
          { role: 'user', content: 'Wer wohnt in Basel?' },
          {
            role: 'assistant',
            content: null,
            toolCalls: [{ id: 'c1', name: 'search_persons', arguments: '{"query":"Basel"}' }],
          },
          { role: 'tool', toolCallId: 'c1', content: '{"count":0}' },
        ],
        [SEARCH],
      ),
    );

    const req = http.expectOne(URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      model: 'qwen3:8b',
      stream: false,
      reasoning_effort: 'none',
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'Wer wohnt in Basel?' },
        {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'c1',
              type: 'function',
              function: { name: 'search_persons', arguments: '{"query":"Basel"}' },
            },
          ],
        },
        { role: 'tool', tool_call_id: 'c1', content: '{"count":0}' },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'search_persons',
            description: 'Lists persons.',
            parameters: { type: 'object', properties: { query: { type: 'string' } } },
          },
        },
      ],
    });
    req.flush({ choices: [{ message: { role: 'assistant', content: 'ok' } }] });
  });

  it('omits tools and reasoning effort when there are none', () => {
    TestBed.resetTestingModule();
    client = configure({ ...LOCAL, reasoningEffort: undefined });
    http = TestBed.inject(HttpTestingController);

    void firstValueFrom(client.complete([{ role: 'user', content: 'Hallo' }], []));

    const body = http.expectOne(URL).request.body;
    expect(body).not.toHaveProperty('tools');
    expect(body).not.toHaveProperty('reasoning_effort');
    http.expectNone(URL);
  });

  it('reads tool calls from the reply', async () => {
    const reply = firstValueFrom(client.complete([{ role: 'user', content: 'x' }], [SEARCH]));

    http.expectOne(URL).flush({
      choices: [
        {
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [
              {
                id: 'call_1',
                type: 'function',
                function: { name: 'search_persons', arguments: '{"query":"Basel"}' },
              },
            ],
          },
        },
      ],
    });

    expect(await reply).toEqual({
      content: null,
      toolCalls: [{ id: 'call_1', name: 'search_persons', arguments: '{"query":"Basel"}' }],
    });
  });

  it('drops inline thinking from the answer text', async () => {
    const reply = firstValueFrom(client.complete([{ role: 'user', content: 'x' }], []));

    http.expectOne(URL).flush({
      choices: [{ message: { role: 'assistant', content: '<think>\nhmm\n</think>\n\nAntwort' } }],
    });

    expect(await reply).toEqual({ content: 'Antwort', toolCalls: [] });
  });

  it('fails on a reply without choices', async () => {
    const reply = firstValueFrom(client.complete([{ role: 'user', content: 'x' }], []));

    http.expectOne(URL).flush({ choices: [] });

    await expect(reply).rejects.toThrow('The language model returned no answer.');
  });

  it('talks to the provider selected at the time of the request', () => {
    TestBed.inject(ChatProviderSelection).select('openai');

    void firstValueFrom(client.complete([{ role: 'user', content: 'Hallo' }], []));

    const body = http.expectOne('/openai/v1/chat/completions').request.body;
    expect(body.model).toBe('gpt-5-mini');
    expect(body).not.toHaveProperty('reasoning_effort');
  });

  it('sends attachments as content parts the model understands', () => {
    TestBed.inject(ChatProviderSelection).select('openai');

    void firstValueFrom(
      client.complete(
        [
          {
            role: 'user',
            content: 'Fasse zusammen',
            attachments: [
              { name: 'liste.csv', kind: 'text', content: 'a;b' },
              { name: 'foto.png', kind: 'image', content: 'data:image/png;base64,AA' },
              { name: 'vertrag.pdf', kind: 'pdf', content: 'data:application/pdf;base64,BB' },
            ],
          },
        ],
        [],
      ),
    );

    expect(http.expectOne('/openai/v1/chat/completions').request.body.messages).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Fasse zusammen' },
          { type: 'text', text: 'Attached file "liste.csv":\na;b' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,AA' } },
          {
            type: 'file',
            file: { filename: 'vertrag.pdf', file_data: 'data:application/pdf;base64,BB' },
          },
        ],
      },
    ]);
  });

  it('tells a text-only model about attachments it cannot read', () => {
    void firstValueFrom(
      client.complete(
        [
          {
            role: 'user',
            content: '',
            attachments: [{ name: 'foto.png', kind: 'image', content: 'data:image/png;base64,AA' }],
          },
        ],
        [],
      ),
    );

    expect(http.expectOne(URL).request.body.messages[0].content).toEqual([
      { type: 'text', text: 'Attached file "foto.png" cannot be read by the current model.' },
    ]);
  });
});
