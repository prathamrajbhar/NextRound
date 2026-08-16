import { createClient } from '@supabase/supabase-js';
import { env } from './env';

const supabaseUrl = env('SUPABASE_URL');
const supabaseServiceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');
const bucket = env('SUPABASE_STORAGE_BUCKET');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export const UPLOAD_ROOT_DIR = '/tmp/nextround-uploads';
export const SUB_DIRECTORIES = ['resumes', 'audio', 'video', 'offers', 'misc'];

export function ensureUploadDirsExist(): void {
  // Cloud storage doesn't need local directories created
  return;
}

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType?: string
): Promise<string> {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');

  const { error } = await supabase.storage
    .from(bucket)
    .upload(normalizedKey, body, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(normalizedKey);

  return publicUrlData.publicUrl;
}

export async function getPresignedUrl(key: string): Promise<string> {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalizedKey.startsWith('http://') || normalizedKey.startsWith('https://')) {
    return normalizedKey;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedKey);
  return data.publicUrl;
}

export async function deleteFile(key: string): Promise<void> {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  const { error } = await supabase.storage.from(bucket).remove([normalizedKey]);
  if (error) {
    console.error(`Failed to delete file from Supabase Storage: ${error.message}`);
  }
}
