import crypto from 'crypto';
import path from 'path';

export interface ValidatedFile {
  safeFilename: string;
  safePath: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
}

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.txt']);




export function validateFileMagicBytes(buffer: Buffer): { isValid: boolean; detectedMime: string } {
  if (!buffer || buffer.length < 4) {
    return { isValid: false, detectedMime: 'unknown' };
  }

  
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { isValid: true, detectedMime: 'application/pdf' };
  }

  
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return { isValid: true, detectedMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  }

  
  const isAsciiText = buffer.slice(0, 100).every((byte) => byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126));
  if (isAsciiText) {
    return { isValid: true, detectedMime: 'text/plain' };
  }

  return { isValid: false, detectedMime: 'application/octet-stream' };
}




export function generateSafeStoragePath(originalFilename: string, uploadDir: string): ValidatedFile {
  const rawExt = path.extname(originalFilename || '').toLowerCase();
  const extension = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.pdf';

  const safeFilename = `${crypto.randomUUID()}${extension}`;
  const targetPath = path.join(uploadDir, safeFilename);

  const resolvedUploadDir = path.resolve(uploadDir);
  const resolvedTargetPath = path.resolve(targetPath);

  
  if (!resolvedTargetPath.startsWith(resolvedUploadDir)) {
    throw new Error('Security Violation: Invalid file path traversal detected.');
  }

  return {
    safeFilename,
    safePath: resolvedTargetPath,
    extension,
    mimeType: extension === '.pdf' ? 'application/pdf' : 'application/octet-stream',
    sizeBytes: 0,
  };
}
