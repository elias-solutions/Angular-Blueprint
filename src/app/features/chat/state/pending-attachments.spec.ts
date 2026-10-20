import { TestBed } from '@angular/core/testing';
import { ChatConfig } from '../../../core/config/app-config';
import { AppConfigStore } from '../../../core/config/app-config-store';
import { ChatProviderSelection } from './chat-provider-selection';
import { PendingAttachments } from './pending-attachments';

const CHAT: ChatConfig = {
  defaultProviderId: 'local',
  providers: [
    {
      id: 'local',
      label: 'Lokal',
      baseUrl: '/llm/v1',
      model: 'qwen3:8b',
      capabilities: { images: false, pdf: false },
    },
    {
      id: 'openai',
      label: 'OpenAI',
      baseUrl: '/openai/v1',
      model: 'gpt-5-mini',
      capabilities: { images: true, pdf: true },
    },
  ],
};

const csv = new File(['a;b'], 'liste.csv', { type: 'text/csv' });
const photo = new File(['png'], 'foto.png', { type: 'image/png' });

describe('PendingAttachments', () => {
  let pending: PendingAttachments;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: AppConfigStore, useValue: { config: () => ({ chat: CHAT }) } }],
    });
    pending = TestBed.inject(PendingAttachments);
  });

  it('collects readable files and reports the ones the active model cannot read', async () => {
    await pending.add([csv, photo]);

    expect(pending.attachments()).toEqual([{ name: 'liste.csv', kind: 'text', content: 'a;b' }]);
    expect(pending.rejections()).toEqual([{ fileName: 'foto.png', reason: 'unsupportedByModel' }]);
  });

  it('accepts images once a multimodal model is selected', async () => {
    TestBed.inject(ChatProviderSelection).select('openai');

    await pending.add([photo]);

    expect(pending.attachments().map((a) => a.kind)).toEqual(['image']);
    expect(pending.accept()).toContain('image/png');
  });

  it('adds to earlier attachments and removes single ones', async () => {
    await pending.add([csv]);
    await pending.add([new File(['x'], 'notiz.txt', { type: 'text/plain' })]);

    pending.remove(pending.attachments()[0]);

    expect(pending.attachments().map((a) => a.name)).toEqual(['notiz.txt']);
  });

  it('hands the attachments over once and starts empty again', async () => {
    await pending.add([csv, photo]);

    const taken = pending.take();

    expect(taken.map((a) => a.name)).toEqual(['liste.csv']);
    expect(pending.attachments()).toEqual([]);
    expect(pending.rejections()).toEqual([]);
  });
});
