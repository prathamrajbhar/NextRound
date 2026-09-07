import https from 'https';
import { env, envNumber } from '../lib/env';
import type { SocialSyncStatus } from '@nextround/shared';

export interface SyncedSocialData {
  github?: {
    username: string;
    name?: string;
    avatarUrl?: string;
    bio?: string;
    company?: string;
    location?: string;
    publicRepos: number;
    followers: number;
    totalStars: number;
    topLanguages: string[];
    repositories: Array<{
      name: string;
      description?: string;
      language?: string;
      stars: number;
      forks: number;
      url: string;
      topics?: string[];
    }>;
    profileUrl: string;
  };
  linkedin?: {
    username: string;
    profileUrl: string;
    status: string;
    synced?: boolean;
    reason?: string;
    name?: string;
    headline?: string;
    location?: string;
    about?: string;
    avatarUrl?: string;
    skills?: string[];
    experiences?: unknown[];
    education?: unknown[];
  };
  extractedSkills: string[];
  syncedAt: string;
  syncs: SocialSyncOutcome[];
}

export type SocialSyncPlatform = 'github' | 'linkedin';

export interface SocialSyncOutcome {
  source: SocialSyncPlatform;
  username: string;
  status: SocialSyncStatus;
  synced: boolean;
  reason?: string;
  normalized?: Record<string, unknown>;
  raw?: Record<string, unknown>;
}

export const PROFILE_SCRAPER_TIMEOUT_MS = envNumber('PROFILE_SCRAPER_TIMEOUT_MS');

const TLS_VERIFY_ERROR_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'CERT_HAS_EXPIRED',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'CERT_SIGNATURE_FAILURE',
]);

export function isTlsVerificationError(error: unknown): boolean {
  const cause = (error as { cause?: unknown })?.cause as { code?: string } | undefined;
  return Boolean(cause?.code && TLS_VERIFY_ERROR_CODES.has(cause.code));
}

export function httpsRequestText(
  url: string,
  options: https.RequestOptions
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () =>
        resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') })
      );
    });
    req.on('error', reject);
    req.setTimeout(PROFILE_SCRAPER_TIMEOUT_MS, () =>
      req.destroy(new Error(`Scraper request timed out after ${PROFILE_SCRAPER_TIMEOUT_MS}ms`))
    );
    req.end();
  });
}

export function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function toNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function normalizeUsername(
  input: string | undefined | null,
  platform: SocialSyncPlatform
): { ok: true; username: string } | { ok: false; reason: string } {
  const raw = (input || '').trim();
  if (!raw) return { ok: false, reason: `A ${platform} username or profile URL is required.` };

  let candidate = raw;

  const urlPattern =
    platform === 'linkedin' ? /linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i : /github\.com\/([a-zA-Z0-9_-]+)/i;
  const urlMatch = raw.match(urlPattern);
  if (urlMatch) {
    candidate = urlMatch[1];
  }

  candidate = candidate.replace(/^@/, '').replace(/\/+$/, '').split('/').pop() || '';

  const valid =
    platform === 'linkedin'
      ? /^[a-zA-Z0-9_-]{3,100}$/.test(candidate)
      : /^[a-zA-Z0-9](?:-?[a-zA-Z0-9]){0,38}$/.test(candidate);

  if (!valid) {
    return {
      ok: false,
      reason: `Invalid ${platform} username: "${raw}". Provide a valid username or profile URL.`,
    };
  }
  return { ok: true, username: candidate };
}

export async function fetchScraperProfile(
  platform: SocialSyncPlatform,
  username: string
): Promise<{ status: number; body: string; timedOut: boolean }> {
  const base = env('PROFILE_SCRAPER_BASE_URL');
  const url = `${base}/${platform}/${encodeURIComponent(username)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROFILE_SCRAPER_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    return { status: response.status, body: await response.text(), timedOut: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unexpected error';
    const timedOut = (error instanceof Error && error.name === 'AbortError') || /timed out/i.test(message);
    if (!isTlsVerificationError(error)) {
      return { status: 0, body: '', timedOut };
    }
    try {
      const { status, body } = await httpsRequestText(url, {
        headers: { accept: 'application/json' },
        rejectUnauthorized: false,
      });
      return { status, body, timedOut: false };
    } catch (httpsError) {
      const httpsMsg = httpsError instanceof Error ? httpsError.message : 'unexpected error';
      return { status: 0, body: '', timedOut: /timed out/i.test(httpsMsg) };
    }
  } finally {
    clearTimeout(timeout);
  }
}

export function parseJsonBody(body: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(body);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function scrapeOutcome(
  platform: SocialSyncPlatform,
  username: string,
  reason: string,
  status: SocialSyncStatus = 'failed',
  synced = false
): SocialSyncOutcome {
  return { source: platform, username, status, synced, reason };
}
