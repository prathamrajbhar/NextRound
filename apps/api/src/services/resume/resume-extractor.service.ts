import { logger } from '../../lib/logger';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');

export function normalizeResumeText(text: string): string {
  let cleaned = text.replace(/P\s+R\s+O\s+F\s+E\s+S\s+S\s+I\s+O\s+N\s+A\s+L\s+S\s+U\s+M\s+M\s+A\s+R\s+Y/gi, 'PROFESSIONAL SUMMARY');
  cleaned = cleaned.replace(/E\s+X\s+P\s+E\s+R\s+I\s+E\s+N\s+C\s+E/gi, 'EXPERIENCE');
  cleaned = cleaned.replace(/E\s+D\s+U\s+C\s+A\s+T\s+I\s+O\s+N/gi, 'EDUCATION');
  cleaned = cleaned.replace(/P\s+R\s+O\s+J\s+E\s+C\s+T\s+S/gi, 'PROJECTS');
  cleaned = cleaned.replace(/S\s+K\s+I\s+L\s+L\s+S/gi, 'SKILLS');
  return cleaned;
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const isPdf = mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      if (data && typeof data.text === 'string' && data.text.trim().length > 0) {
        return normalizeResumeText(data.text.trim());
      }
    } catch (error) {
      logger.child('ResumeParser').error(`Failed to extract text using PDFParse for ${filename}:`, error);
    }
  }

  const rawText = buffer.toString('utf-8');
  const cleaned = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
  return normalizeResumeText(cleaned);
}
