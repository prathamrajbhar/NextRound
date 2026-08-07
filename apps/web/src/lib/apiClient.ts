import { fetchApi } from './api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const result = await fetchApi<T>(endpoint, options);

  if (!result.success) {
    const errorMsg =
      typeof result.error === 'string'
        ? result.error
        : (result.error as { message?: string })?.message || 'API request failed';
    throw new Error(errorMsg);
  }

  return result.data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...options }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...options }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, ...options }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'DELETE', ...options }),
};
