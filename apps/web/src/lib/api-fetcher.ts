import { ApiEnvelope } from '@nextround/shared';
import { API_BASE_URL } from './config';

let refreshPromise: Promise<boolean> | null = null;

export interface ApiFailureMeta {
  status?: number;
  errorCode?: string;
}

export type ApiResult<T> = ApiEnvelope<T> & ApiFailureMeta;

interface CacheEntry {
  data: ApiResult<unknown>;
  timestamp: number;
}

const apiCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20000;

function stripLeadingSlash(s: string): string {
  return s.startsWith('/') ? s.slice(1) : s;
}

function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

export function clearApiCache(endpointPattern?: string) {
  if (!endpointPattern) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(endpointPattern)) {
      apiCache.delete(key);
    }
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<ApiResult<T>> {
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = `${method}:${endpoint}`;
  const FETCH_TIMEOUT_MS = 25000;

  if (method !== 'GET') {
    const resource = stripLeadingSlash(endpoint).split('/')[0];
    if (resource) clearApiCache(resource);
  }

  if (method === 'GET' && !isRetry) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {

      fetchNetworkApi<T>(endpoint, options, isRetry).then((freshData) => {
        if (freshData.success) {
          apiCache.set(cacheKey, { data: freshData, timestamp: Date.now() });
        }
      }).catch((err) => {
        console.error('Failed to refresh stale cache entry:', err);
      });

      return cached.data as ApiEnvelope<T>;
    }
  }

  const result = await fetchNetworkApi<T>(endpoint, options, isRetry, FETCH_TIMEOUT_MS);

  if (method === 'GET' && result.success) {
    apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }

  return result;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const base = stripTrailingSlash(API_BASE_URL);
    const refreshRes = await fetch(base + '/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const refreshData = refreshRes.headers.get('content-type')?.includes('application/json')
      ? await refreshRes.json()
      : {};
    return refreshData.success === true;
  } catch {
    return false;
  }
}

async function fetchNetworkApi<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
  timeoutMs?: number
): Promise<ApiResult<T>> {

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };

  const url = stripTrailingSlash(API_BASE_URL) + '/' + stripLeadingSlash(endpoint);

  try {
    const fetchOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    let res: Response;
    if (timeoutMs && timeoutMs > 0) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      fetchOptions.signal = controller.signal;
      res = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
    } else {
      res = await fetch(url, fetchOptions);
    }

    if (res.status === 401 && !isRetry && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const refreshed = await refreshPromise;
      if (refreshed) {
        return fetchNetworkApi<T>(endpoint, options, true);
      }
    }

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data: ApiEnvelope<T> = await res.json();

      if (!res.ok) {
        const apiError = typeof data.error === 'string' ? null : data.error;
        return {
          success: false,
          error: apiError?.message || (typeof data.error === 'string' ? data.error : undefined) || `HTTP ${res.status}: ${res.statusText}`,
          status: res.status,
          errorCode: apiError?.code,
        };
      }
      return data;
    } else {
      return {
        success: false,
        error: `HTTP ${res.status} (${res.statusText || 'Server Error'}): Non-JSON response received`,
        status: res.status,
        errorCode: 'SERVER',
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out after ' + timeoutMs + 'ms',
        errorCode: 'TIMEOUT',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      errorCode: 'NETWORK',
    };
  }
}
