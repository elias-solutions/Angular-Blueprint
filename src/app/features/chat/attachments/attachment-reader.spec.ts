import { TestBed } from '@angular/core/testing';
import { ChatProviderCapabilities } from '../../../core/config/app-config';
import { AttachmentReader } from './attachment-reader';

const TEXT_ONLY: ChatProviderCapabilities = { images: false, pdf: false };
const MULTIMODAL: ChatProviderCapabilities = { images: true, pdf: true };

const file = (content: string, name: string, type = '') => new File([content], name, { type });

describe('AttachmentReader', () => {
  let reader: AttachmentReader;

  beforeEach(() => (reader = TestBed.inject(AttachmentReader)));

  it('reads text files as their content', async () => {
    const attachment = await reader.read(file('a;b\n1;2', 'liste.csv'), TEXT_ONLY);

    expect(attachment).toEqual({ name: 'liste.csv', kind: 'text', content: 'a;b\n1;2' });
  });

  it('recognises text by its MIME type', async () => {
    const attachment = await reader.read(file('{}', 'daten', 'application/json'), TEXT_ONLY);

    expect(attachment.kind).toBe('text');
  });

  it('reads images and PDFs as data URLs', async () => {
    const image = await reader.read(file('png', 'foto.png', 'image/png'), MULTIMODAL);
    const pdf = await reader.read(file('pdf', 'vertrag.pdf', 'application/pdf'), MULTIMODAL);

    expect(image).toEqual({
      name: 'foto.png',
      kind: 'image',
      content: expect.stringMatching(/^data:image\/png;base64,/),
    });
    expect(pdf.kind).toBe('pdf');
    expect(pdf.content).toMatch(/^data:application\/pdf;base64,/);
  });

  it('rejects files the model cannot read', async () => {
    await expect(
      reader.read(file('png', 'foto.png', 'image/png'), TEXT_ONLY),
    ).rejects.toMatchObject({ reason: 'unsupportedByModel', fileName: 'foto.png' });
  });

  it('rejects unknown file types', async () => {
    await expect(
      reader.read(file('x', 'setup.exe', 'application/octet-stream'), MULTIMODAL),
    ).rejects.toMatchObject({ reason: 'unsupportedType' });
  });

  it('rejects files above the size limit of their format', async () => {
    const large = file('x'.repeat(200 * 1024 + 1), 'gross.txt', 'text/plain');

    await expect(reader.read(large, TEXT_ONLY)).rejects.toMatchObject({ reason: 'tooLarge' });
  });

  it('accepts only the formats the model supports', () => {
    expect(reader.accept(TEXT_ONLY)).not.toContain('image/png');
    expect(reader.accept(TEXT_ONLY)).toContain('.csv');
    expect(reader.accept(MULTIMODAL)).toContain('image/png');
    expect(reader.accept(MULTIMODAL)).toContain('.pdf');
  });
});
