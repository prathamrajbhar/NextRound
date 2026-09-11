import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';
import { logger } from './logger';

const endpoint = env('AWS_ENDPOINT_URL');
const region = process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';
const accessKeyId = env('AWS_ACCESS_KEY_ID');
const secretAccessKey = env('AWS_SECRET_ACCESS_KEY');
const bucket = env('AWS_S3_BUCKET');

const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

function normalizeKey(key: string): string {
  return key.replace(/\\/g, '/').replace(/^\/+/, '');
}

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType?: string
): Promise<string> {
  const normalizedKey = normalizeKey(key);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: normalizedKey,
      Body: body,
      ContentType: contentType,
    })
  );

  const cleanEndpoint = endpoint.replace(/\/+$/, '');
  return `${cleanEndpoint}/${bucket}/${normalizedKey}`;
}

export async function getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const normalizedKey = normalizeKey(key);
  if (normalizedKey.startsWith('http://') || normalizedKey.startsWith('https://')) {
    return normalizedKey;
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: normalizedKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function deleteFile(key: string): Promise<void> {
  const normalizedKey = normalizeKey(key);
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: normalizedKey,
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.child('Storage').error(`Failed to delete file "${key}" from S3:`, message);
  }
}

