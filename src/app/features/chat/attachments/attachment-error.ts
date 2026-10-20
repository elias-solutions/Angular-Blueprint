export type AttachmentRejectionReason =
  'unsupportedType' | 'unsupportedByModel' | 'tooLarge' | 'unreadable';

export class AttachmentError extends Error {
  constructor(
    readonly reason: AttachmentRejectionReason,
    readonly fileName: string,
  ) {
    super(`Attachment '${fileName}' rejected: ${reason}.`);
  }
}
