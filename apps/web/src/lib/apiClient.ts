import { fetchApi, clearApiCache } from './api-fetcher';
import { AppError, type AppErrorCode } from './errors';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    const result = await fetchApi<T>(endpoint, options);

    if (result.success) {
      return result.data as T;
    }

    const errorMsg =
      typeof result.error === 'string'
        ? result.error
        : (result.error as { message?: string })?.message || 'API request failed';

    const isTimeoutOr500 = result.status === undefined || result.status >= 500 || errorMsg.includes('timeout');

    if (isTimeoutOr500 && attempts < maxAttempts) {
      await new Promise((res) => setTimeout(res, 1200));
      continue;
    }

    throw new AppError(errorMsg, {
      status: result.status,
      code: (result.errorCode as AppErrorCode) ?? undefined,
      retryable: isTimeoutOr500,
    });
  }

  throw new AppError('API request failed after retries');
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
