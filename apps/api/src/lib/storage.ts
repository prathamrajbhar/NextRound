import fs from 'fs';
import path from 'path';

const uploadDirName = process.env.UPLOAD_DIR || 'uploads';
export const UPLOAD_ROOT_DIR = path.isAbsolute(uploadDirName)
  ? uploadDirName
  : path.resolve(process.cwd(), uploadDirName);

export const SUB_DIRECTORIES = ['resumes', 'audio', 'video', 'offers', 'misc'];

/**
 * Ensures root upload directory and all subdirectories exist on disk.
 */
export function ensureUploadDirsExist(): void {
  if (!fs.existsSync(UPLOAD_ROOT_DIR)) {
    fs.mkdirSync(UPLOAD_ROOT_DIR, { recursive: true });
  }

  for (const subDir of SUB_DIRECTORIES) {
    const fullPath = path.join(UPLOAD_ROOT_DIR, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

/**
 * Uploads (saves) a buffer directly to local disk.
 * @param key Relative key/path within uploads directory (e.g. "resumes/user123/12345-resume.pdf")
 * @param body File Buffer
 * @param _contentType Optional MIME type (unused for local disk)
 * @returns Relative static URL path (e.g. "/uploads/resumes/user123/12345-resume.pdf")
 */
export async function uploadFile(
  key: string,
  body: Buffer,
  _contentType?: string
): Promise<string> {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  const filePath = path.join(UPLOAD_ROOT_DIR, normalizedKey);

  // Ensure parent directory exists
  const parentDir = path.dirname(filePath);
  if (!fs.existsSync(parentDir)) {
    await fs.promises.mkdir(parentDir, { recursive: true });
  }

  await fs.promises.writeFile(filePath, body);
  return `/uploads/${normalizedKey}`;
}

/**
 * Returns accessible URL for local disk file.
 */
export async function getPresignedUrl(key: string): Promise<string> {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalizedKey.startsWith('uploads/')) {
    return `/${normalizedKey}`;
  }
  return `/uploads/${normalizedKey}`;
}

/**
 * Deletes a file from the local uploads directory.
 */
export async function deleteFile(key: string): Promise<void> {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  const filePath = path.join(UPLOAD_ROOT_DIR, normalizedKey);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
}
