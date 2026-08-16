import path from 'path';
import { config } from 'dotenv';
// Load API .env first before dynamic imports are evaluated
config({ path: path.resolve(__dirname, '../../../.env') });

import { describe, expect, it } from 'vitest';

describe('Supabase Storage Integration Test', () => {
  it('should successfully upload, get public URL, and delete a file from Supabase Storage', async () => {
    const { uploadFile, deleteFile } = await import('../src/lib/storage');

    const testFileKey = `misc/test-${Date.now()}.txt`;
    const testContent = Buffer.from('Hello Supabase Storage Integration Test!');
    const mimeType = 'text/plain';

    // 1. Upload file
    const publicUrl = await uploadFile(testFileKey, testContent, mimeType);
    expect(publicUrl).toBeDefined();
    expect(publicUrl.startsWith('http')).toBe(true);
    expect(publicUrl).toContain(testFileKey);
    console.log('Uploaded File URL:', publicUrl);

    // 2. Fetch/Check file exists via HTTP fetch
    const response = await fetch(publicUrl);
    expect(response.status).toBe(200);
    const bodyText = await response.text();
    expect(bodyText).toBe('Hello Supabase Storage Integration Test!');

    // 3. Delete file
    await deleteFile(testFileKey);

    // 4. Verify deleted
    const postDeleteResponse = await fetch(publicUrl);
    expect(postDeleteResponse.status).not.toBe(200);
  });
});
