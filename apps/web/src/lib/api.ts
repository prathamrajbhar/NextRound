import { ApiEnvelope } from '@nextround/shared';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1';

let isRefreshing = false;

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<ApiEnvelope<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          const refreshData = refreshRes.headers.get('content-type')?.includes('application/json')
            ? await refreshRes.json()
            : {};
          isRefreshing = false;

          if (refreshData.success && refreshData.data?.accessToken) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', refreshData.data.accessToken);
            }
            return fetchApi<T>(endpoint, options, true);
          }
        } catch (e) {
          isRefreshing = false;
        }
      }
    }

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data: ApiEnvelope<T> = await res.json();
      if (!res.ok && data.success !== false) {
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

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
};
