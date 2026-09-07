import { siteConfig } from '@/lib/config';
import { ConnectionResult } from './types';

export async function queryPerm(name: string): Promise<PermissionState | null> {
  try {
    if (!navigator?.permissions?.query) return null;
    const r = await navigator.permissions.query({ name } as PermissionDescriptor);
    return r.state;
  } catch {
    return null;
  }
}

export function apiOrigin(): string {
  return siteConfig.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
}

export async function measureLatency(origin: string): Promise<number> {
  const samples: number[] = [];
  for (let i = 0; i < 3; i++) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 4000);
    const t0 = Date.now();
    try {
      await fetch(`${origin}/api/v1/ping`, { cache: 'no-store', signal: ctrl.signal });
      samples.push(Date.now() - t0);
    } catch {
      // Ignored
    } finally {
      clearTimeout(tid);
    }
    if (i < 2) await new Promise((r) => setTimeout(r, 60));
  }
  if (samples.length === 0) return 9999;
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}

export async function measureDownload(origin: string): Promise<number> {
  const bytes = 1024 * 1024;
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 20000);
  try {
    const t0 = Date.now();
    const r = await fetch(`${origin}/api/v1/speedtest`, { cache: 'no-store', signal: ctrl.signal });
    await r.arrayBuffer();
    clearTimeout(tid);
    const secs = (Date.now() - t0) / 1000;
    if (secs < 0.005) return 0;
    return parseFloat(((bytes / 1024 / 1024) * 8 / secs).toFixed(1));
  } catch {
    clearTimeout(tid);
    return 0;
  }
}

export function deriveConnectionQuality(downloadMbps: number, latencyMs: number): ConnectionResult['quality'] {
  if (downloadMbps >= 10 && latencyMs < 80) return 'Excellent';
  if (downloadMbps >= 4 && latencyMs < 150) return 'Good';
  if (downloadMbps >= 1 && latencyMs < 300) return 'Fair';
  return 'Poor';
}
