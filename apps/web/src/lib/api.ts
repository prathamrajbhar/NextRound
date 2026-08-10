import { ApiEnvelope } from '@nextround/shared';
import { API_BASE_URL } from './config';

let refreshPromise: Promise<boolean> | null = null;

interface CacheEntry {
  data: ApiEnvelope<unknown>;
  timestamp: number;
}

const apiCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20000; // 20 seconds TTL

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
): Promise<ApiEnvelope<T>> {
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = `${method}:${endpoint}`;

  // Invalidate cached GETs for the mutated resource only. A blanket clear would
  // defeat the cache under frequent mutations (e.g. the 8s proctoring heartbeat).
  if (method !== 'GET') {
    const resource = endpoint.replace(/^\//, '').split('/')[0];
    if (resource) clearApiCache(resource);
  }

  // Serve GET requests instantly from cache if valid
  if (method === 'GET' && !isRetry) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      // Background revalidation
      fetchNetworkApi<T>(endpoint, options, isRetry).then((freshData) => {
        if (freshData.success) {
          apiCache.set(cacheKey, { data: freshData, timestamp: Date.now() });
        }
      }).catch(() => {});

      return cached.data as ApiEnvelope<T>;
    }
  }

  const result = await fetchNetworkApi<T>(endpoint, options, isRetry);

  if (method === 'GET' && result.success) {
    apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }

  return result;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshRes = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const refreshData = refreshRes.headers.get('content-type')?.includes('application/json')
      ? await refreshRes.json()
      : {};
    if (refreshData.success && refreshData.data?.accessToken) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', refreshData.data.accessToken);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function fetchNetworkApi<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<ApiEnvelope<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  // Don't force a Content-Type on multipart bodies — the browser must set the
  // boundary itself or the server can't parse the upload.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (res.status === 401 && !isRetry && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
      // Queue concurrent 401s onto a single in-flight refresh so they retry with
      // the fresh token instead of failing through while isRefreshing was true.
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
      // A non-2xx response is always a failure, even if the body happens to carry
      // a success:true envelope. Preserve the server's error message when present.
      if (!res.ok) {
        return {
          success: false,
          error: typeof data.error === 'string' ? data.error : (data.error as { message?: string })?.message || `HTTP ${res.status}: ${res.statusText}`,
        };
      }
      return data;
    } else {
      return {
        success: false,
        error: `HTTP ${res.status} (${res.statusText || 'Server Error'}): Non-JSON response received`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
