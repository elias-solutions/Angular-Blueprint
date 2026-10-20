import { Injectable } from '@angular/core';
import { ChatProviderCapabilities } from '../../../core/config/app-config';
import { ChatAttachment } from '../domain/chat';
import { AttachmentError } from './attachment-error';
import { ATTACHMENT_FORMATS } from './attachment-format';

@Injectable({ providedIn: 'root' })
export class AttachmentReader {
  async read(file: File, capabilities: ChatProviderCapabilities): Promise<ChatAttachment> {
    const format = ATTACHMENT_FORMATS.find((candidate) => candidate.matches(file));
    if (!format) {
      throw new AttachmentError('unsupportedType', file.name);
    }
    if (!format.supportedBy(capabilities)) {
      throw new AttachmentError('unsupportedByModel', file.name);
    }
    if (file.size > format.maxBytes) {
      throw new AttachmentError('tooLarge', file.name);
    }
    return { name: file.name, kind: format.kind, content: await format.read(file) };
  }

  accept(capabilities: ChatProviderCapabilities): string {
    return ATTACHMENT_FORMATS.filter((format) => format.supportedBy(capabilities))
      .flatMap((format) => format.accept)
      .join(',');
  }
}
