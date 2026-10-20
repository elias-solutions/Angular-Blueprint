import { ChatProviderCapabilities } from '../../../core/config/app-config';
import { AttachmentKind, ChatAttachment } from '../domain/chat';
import { OpenAiContentPart } from './openai-chat.dto';

type PartBuilder = (
  attachment: ChatAttachment,
  capabilities: ChatProviderCapabilities,
) => OpenAiContentPart;

const PART_BUILDERS: Readonly<Record<AttachmentKind, PartBuilder>> = {
  text: (attachment) => textPart(`Attached file "${attachment.name}":\n${attachment.content}`),
  image: (attachment, capabilities) =>
    capabilities.images
      ? { type: 'image_url', image_url: { url: attachment.content } }
      : unreadablePart(attachment),
  pdf: (attachment, capabilities) =>
    capabilities.pdf
      ? { type: 'file', file: { filename: attachment.name, file_data: attachment.content } }
      : unreadablePart(attachment),
};

export function toUserContent(
  text: string,
  attachments: readonly ChatAttachment[],
  capabilities: ChatProviderCapabilities,
): string | OpenAiContentPart[] {
  if (attachments.length === 0) {
    return text;
  }
  return [
    ...(text ? [textPart(text)] : []),
    ...attachments.map((attachment) => PART_BUILDERS[attachment.kind](attachment, capabilities)),
  ];
}

function textPart(text: string): OpenAiContentPart {
  return { type: 'text', text };
}

function unreadablePart(attachment: ChatAttachment): OpenAiContentPart {
  return textPart(`Attached file "${attachment.name}" cannot be read by the current model.`);
}
