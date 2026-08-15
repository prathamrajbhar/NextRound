import { fetchApi, clearApiCache } from './api-fetcher';
import { AppError, type AppErrorCode } from './errors';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const result = await fetchApi<T>(endpoint, options);

  if (!result.success) {
    const errorMsg =
      typeof result.error === 'string'
        ? result.error
        : (result.error as { message?: string })?.message || 'API request failed';
    throw new AppError(errorMsg, {
      status: result.status,
      code: (result.errorCode as AppErrorCode) ?? undefined,
      retryable: result.status === undefined || result.status >= 500,
    });
  }

  return result.data as T;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return body;
  return JSON.stringify(body);
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, { method: 'POST', body: serializeBody(body), ...options }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, { method: 'PUT', body: serializeBody(body), ...options }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, { method: 'PATCH', body: serializeBody(body), ...options }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'DELETE', ...options }),
  clearCache: clearApiCache,
};
