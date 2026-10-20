import { ChatProviderCapabilities } from '../../../core/config/app-config';
import { AttachmentKind } from '../domain/chat';

const KILOBYTE = 1024;
const MEGABYTE = 1024 * KILOBYTE;

const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.tsv', '.json', '.xml', '.yaml', '.yml', '.log'];
const TEXT_MIME_TYPE = /^(text\/.+|application\/(json|xml|x-yaml|yaml))$/;
const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const PDF_MIME_TYPE = 'application/pdf';

export interface AttachmentFormat {
  readonly kind: AttachmentKind;
  readonly maxBytes: number;
  readonly accept: readonly string[];
  matches(file: File): boolean;
  supportedBy(capabilities: ChatProviderCapabilities): boolean;
  read(file: File): Promise<string>;
}

export const TEXT_FORMAT: AttachmentFormat = {
  kind: 'text',
  maxBytes: 200 * KILOBYTE,
  accept: TEXT_EXTENSIONS,
  matches: (file) => TEXT_MIME_TYPE.test(file.type) || hasExtension(file, TEXT_EXTENSIONS),
  supportedBy: () => true,
  read: readAsText,
};

export const IMAGE_FORMAT: AttachmentFormat = {
  kind: 'image',
  maxBytes: 10 * MEGABYTE,
  accept: IMAGE_MIME_TYPES,
  matches: (file) => IMAGE_MIME_TYPES.includes(file.type),
  supportedBy: (capabilities) => capabilities.images,
  read: readAsDataUrl,
};

export const PDF_FORMAT: AttachmentFormat = {
  kind: 'pdf',
  maxBytes: 20 * MEGABYTE,
  accept: ['.pdf'],
  matches: (file) => file.type === PDF_MIME_TYPE || hasExtension(file, ['.pdf']),
  supportedBy: (capabilities) => capabilities.pdf,
  read: readAsDataUrl,
};

export const ATTACHMENT_FORMATS: readonly AttachmentFormat[] = [
  IMAGE_FORMAT,
  PDF_FORMAT,
  TEXT_FORMAT,
];

function hasExtension(file: File, extensions: readonly string[]): boolean {
  const name = file.name.toLowerCase();
  return extensions.some((extension) => name.endsWith(extension));
}

function readAsText(file: File): Promise<string> {
  return read(file, (reader) => reader.readAsText(file));
}

function readAsDataUrl(file: File): Promise<string> {
  return read(file, (reader) => reader.readAsDataURL(file));
}

function read(file: File, start: (reader: FileReader) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error(`Could not read '${file.name}'.`));
    start(reader);
  });
}
