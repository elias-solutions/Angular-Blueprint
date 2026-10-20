import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { ApiErrorMapper } from '../../../core/http/api-error-mapper';
import { LlmClient } from '../data/llm-client';
import { ChatAttachment, ChatEntry, LlmMessage, LlmReply } from '../domain/chat';
import { ChatToolRegistry } from '../tools/chat-tool-registry';
import { ChatSystemPrompt } from './chat-system-prompt';

type ChatErrorKey = 'noAnswer' | 'tooManySteps' | 'llmUnreachable' | 'llmUnauthorized';

const MAX_ROUNDS = 6;
const LLM_ERROR_KEYS: Readonly<Record<number, ChatErrorKey>> = {
  0: 'llmUnreachable',
  401: 'llmUnauthorized',
  403: 'llmUnauthorized',
  502: 'llmUnreachable',
  503: 'llmUnreachable',
  504: 'llmUnreachable',
};

@Injectable({ providedIn: 'root' })
export class ChatSession {
  private readonly llm = inject(LlmClient);
  private readonly tools = inject(ChatToolRegistry);
  private readonly systemPrompt = inject(ChatSystemPrompt);
  private readonly errors = inject(ApiErrorMapper);
  private readonly transloco = inject(TranslocoService);

  private readonly entriesState = signal<readonly ChatEntry[]>([]);
  private readonly busyState = signal(false);
  private history: LlmMessage[] = [];

  readonly entries = this.entriesState.asReadonly();
  readonly busy = this.busyState.asReadonly();

  async send(text: string, attachments: readonly ChatAttachment[] = []): Promise<void> {
    const message = text.trim();
    if ((!message && attachments.length === 0) || this.busyState()) {
      return;
    }
    this.busyState.set(true);
    this.history.push({ role: 'user', content: message, attachments });
    this.show({
      kind: 'user',
      text: message,
      attachments: attachments.map((attachment) => attachment.name),
    });
    try {
      await this.converse();
    } catch (error) {
      this.show({ kind: 'error', text: this.describe(error) });
    } finally {
      this.busyState.set(false);
    }
  }

  clear(): void {
    this.history = [];
    this.entriesState.set([]);
  }

  private async converse(): Promise<void> {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const reply = await this.ask();
      this.history.push({ role: 'assistant', content: reply.content, toolCalls: reply.toolCalls });
      if (reply.toolCalls.length === 0) {
        this.show({ kind: 'assistant', text: reply.content ?? this.translate('noAnswer') });
        return;
      }
      await this.runTools(reply);
    }
    this.show({ kind: 'error', text: this.translate('tooManySteps') });
  }

  private ask(): Promise<LlmReply> {
    const messages: LlmMessage[] = [
      { role: 'system', content: this.systemPrompt.build() },
      ...this.history,
    ];
    return firstValueFrom(this.llm.complete(messages, this.tools.definitions()));
  }

  private async runTools(reply: LlmReply): Promise<void> {
    for (const call of reply.toolCalls) {
      const outcome = await this.tools.execute(call);
      this.history.push({ role: 'tool', toolCallId: call.id, content: outcome.content });
      this.show({ kind: 'tool', toolName: call.name, succeeded: outcome.succeeded });
    }
  }

  private show(entry: ChatEntry): void {
    this.entriesState.update((entries) => [...entries, entry]);
  }

  private describe(error: unknown): string {
    const key = error instanceof HttpErrorResponse ? LLM_ERROR_KEYS[error.status] : undefined;
    if (key) {
      return this.translate(key);
    }
    return this.errors.toMessage(error);
  }

  private translate(key: ChatErrorKey): string {
    return this.transloco.translate(`chat.errors.${key}`);
  }
}
