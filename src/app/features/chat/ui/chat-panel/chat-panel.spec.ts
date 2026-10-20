import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppConfigStore } from '../../../../core/config/app-config-store';
import { ChatConfig } from '../../../../core/config/app-config';
import { translocoTesting } from '../../../../i18n/testing/transloco-testing';
import { ChatEntry } from '../../domain/chat';
import { ChatPanelState } from '../../state/chat-panel-state';
import { ChatSession } from '../../state/chat-session';
import { PendingAttachments } from '../../state/pending-attachments';
import { ChatPanel } from './chat-panel';

const CHAT: ChatConfig = {
  defaultProviderId: 'local',
  providers: [
    {
      id: 'local',
      label: 'Lokal – Qwen3 8B',
      baseUrl: '/llm/v1',
      model: 'qwen3:8b',
      capabilities: { images: false, pdf: false },
    },
  ],
};

describe('ChatPanel', () => {
  let entries: ReturnType<typeof signal<readonly ChatEntry[]>>;
  let busy: ReturnType<typeof signal<boolean>>;
  let send: jest.Mock;
  let clear: jest.Mock;

  beforeEach(() => {
    entries = signal<readonly ChatEntry[]>([]);
    busy = signal(false);
    send = jest.fn().mockResolvedValue(undefined);
    clear = jest.fn();
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [translocoTesting()],
      providers: [
        { provide: ChatSession, useValue: { entries, busy, send, clear } },
        { provide: AppConfigStore, useValue: { config: () => ({ chat: CHAT }) } },
      ],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(ChatPanel);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('introduces itself while the conversation is empty', async () => {
    const { element } = await render();

    expect(element.textContent).toContain('so viel tun, wie deine Rolle erlaubt');
  });

  it('shows messages and the actions the assistant took', async () => {
    entries.set([
      { kind: 'user', text: 'Lösche Anna', attachments: ['liste.csv'] },
      { kind: 'tool', toolName: 'delete_person', succeeded: false },
      { kind: 'assistant', text: 'Das darf ich nicht.' },
    ]);

    const { element } = await render();

    const text = element.textContent ?? '';
    expect(text).toContain('Lösche Anna');
    expect(text).toContain('liste.csv');
    expect(text).toContain('Person gelöscht');
    expect(text).toContain('fehlgeschlagen');
    expect(text).toContain('Das darf ich nicht.');
  });

  it('sends the typed message on Enter and clears the input', async () => {
    const { fixture, element } = await render();
    const input = element.querySelector('textarea')!;

    input.value = 'Wer wohnt in Basel?';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();

    expect(send).toHaveBeenCalledWith('Wer wohnt in Basel?', []);
    expect(input.value).toBe('');
  });

  it('keeps Shift+Enter for a new line', async () => {
    const { element } = await render();
    const input = element.querySelector('textarea')!;

    input.value = 'Zeile';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));

    expect(send).not.toHaveBeenCalled();
  });

  it('disables sending while the assistant works', async () => {
    busy.set(true);

    const { element } = await render();

    expect(element.textContent).toContain('Der Assistent arbeitet');
    expect(element.querySelector<HTMLButtonElement>('button.send')!.disabled).toBe(true);
  });

  it('clears the conversation and closes the panel', async () => {
    const panel = TestBed.inject(ChatPanelState);
    panel.toggle();
    const { element } = await render();

    element.querySelector<HTMLButtonElement>('button.clear')!.click();
    element.querySelector<HTMLButtonElement>('button.close')!.click();

    expect(clear).toHaveBeenCalled();
    expect(panel.open()).toBe(false);
  });

  it('shows the selected model', async () => {
    const { element } = await render();

    expect(element.textContent).toContain('Lokal – Qwen3 8B');
  });

  it('sends pending attachments with the message and lists them until then', async () => {
    await TestBed.inject(PendingAttachments).add([
      new File(['Lisa;Meier'], 'liste.csv', { type: 'text/csv' }),
    ]);
    const { fixture, element } = await render();
    expect(element.querySelector('mat-chip')!.textContent).toContain('liste.csv');

    element.querySelector<HTMLButtonElement>('button.send')!.click();
    await fixture.whenStable();

    expect(send).toHaveBeenCalledWith('', [
      { name: 'liste.csv', kind: 'text', content: 'Lisa;Meier' },
    ]);
    expect(element.querySelector('mat-chip')).toBeNull();
  });

  it('explains why a file was not attached', async () => {
    await TestBed.inject(PendingAttachments).add([
      new File(['png'], 'foto.png', { type: 'image/png' }),
    ]);

    const { element } = await render();

    expect(element.textContent).toContain(
      'foto.png: Das gewählte Modell kann diesen Dateityp nicht lesen.',
    );
  });
});
