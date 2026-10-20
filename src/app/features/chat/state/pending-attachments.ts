import { Injectable, computed, inject, signal } from '@angular/core';
import { AttachmentError, AttachmentRejectionReason } from '../attachments/attachment-error';
import { AttachmentReader } from '../attachments/attachment-reader';
import { ChatAttachment } from '../domain/chat';
import { ChatProviderSelection } from './chat-provider-selection';

export interface AttachmentRejection {
  readonly fileName: string;
  readonly reason: AttachmentRejectionReason;
}

@Injectable({ providedIn: 'root' })
export class PendingAttachments {
  private readonly reader = inject(AttachmentReader);
  private readonly providers = inject(ChatProviderSelection);
  private readonly attachmentsState = signal<readonly ChatAttachment[]>([]);
  private readonly rejectionsState = signal<readonly AttachmentRejection[]>([]);

  readonly attachments = this.attachmentsState.asReadonly();
  readonly rejections = this.rejectionsState.asReadonly();
  readonly accept = computed(() => this.reader.accept(this.providers.active().capabilities));

  async add(files: readonly File[]): Promise<void> {
    const capabilities = this.providers.active().capabilities;
    const results = await Promise.allSettled(
      files.map((file) => this.reader.read(file, capabilities)),
    );
    const accepted: ChatAttachment[] = [];
    const rejected: AttachmentRejection[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        accepted.push(result.value);
      } else {
        rejected.push(toRejection(result.reason, files[index]));
      }
    });
    this.attachmentsState.update((attachments) => [...attachments, ...accepted]);
    this.rejectionsState.set(rejected);
  }

  remove(attachment: ChatAttachment): void {
    this.attachmentsState.update((attachments) => attachments.filter((a) => a !== attachment));
  }

  take(): readonly ChatAttachment[] {
    const attachments = this.attachmentsState();
    this.attachmentsState.set([]);
    this.rejectionsState.set([]);
    return attachments;
  }
}

function toRejection(error: unknown, file: File): AttachmentRejection {
  if (error instanceof AttachmentError) {
    return { fileName: error.fileName, reason: error.reason };
  }
  return { fileName: file.name, reason: 'unreadable' };
}
