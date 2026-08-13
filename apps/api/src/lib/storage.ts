import fs from 'fs';
import path from 'path';
import { env } from './env';

const uploadDirName = env('UPLOAD_DIR');
let resolvedDir = path.isAbsolute(uploadDirName)
  ? uploadDirName
  : path.resolve(process.cwd(), uploadDirName);


if (!path.isAbsolute(uploadDirName) && process.cwd().endsWith('apps/api')) {
  const rootUploads = path.resolve(process.cwd(), '../..', uploadDirName);
  if (fs.existsSync(rootUploads) || fs.existsSync(path.resolve(process.cwd(), '../..', 'package.json'))) {
    resolvedDir = rootUploads;
  }
}

export const UPLOAD_ROOT_DIR = resolvedDir;

export const SUB_DIRECTORIES = ['resumes', 'audio', 'video', 'offers', 'misc'];




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








export async function uploadFile(
  key: string,
  body: Buffer,
  _contentType?: string
): Promise<string> {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  const filePath = path.join(UPLOAD_ROOT_DIR, normalizedKey);

  
  const parentDir = path.dirname(filePath);
  if (!fs.existsSync(parentDir)) {
    await fs.promises.mkdir(parentDir, { recursive: true });
  }

  await fs.promises.writeFile(filePath, body);
  return `/uploads/${normalizedKey}`;
}




export async function getPresignedUrl(key: string): Promise<string> {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalizedKey.startsWith('uploads/')) {
    return `/${normalizedKey}`;
  }
  return `/uploads/${normalizedKey}`;
}




export async function deleteFile(key: string): Promise<void> {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  const filePath = path.join(UPLOAD_ROOT_DIR, normalizedKey);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
}
