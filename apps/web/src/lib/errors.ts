export type AppErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'SERVER'
  | 'UNKNOWN';

export interface AppErrorOptions {
  code?: AppErrorCode;
  status?: number;
  title?: string;
  detail?: string;
  retryable?: boolean;
  cause?: unknown;
}

const STATUS_TO_CODE: Record<number, AppErrorCode> = {
  400: 'VALIDATION',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION',
  429: 'RATE_LIMITED',
  500: 'SERVER',
  502: 'SERVER',
  503: 'SERVER',
  504: 'TIMEOUT',
};

const CODE_TITLE: Record<AppErrorCode, string> = {
  NOT_FOUND: 'Not found',
  UNAUTHORIZED: 'Session expired',
  FORBIDDEN: 'Access denied',
  VALIDATION: 'Invalid input',
  NETWORK: 'Connection lost',
  TIMEOUT: 'Request timed out',
  RATE_LIMITED: 'Too many requests',
  CONFLICT: 'Something changed',
  SERVER: 'Server error',
  UNKNOWN: 'Unexpected error',
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status?: number;
  readonly title: string;
  readonly detail?: string;
  readonly retryable: boolean;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.code = options.code ?? (options.status ? STATUS_TO_CODE[options.status] ?? 'SERVER' : 'UNKNOWN');
    this.status = options.status;
    this.title = options.title ?? CODE_TITLE[this.code];
    this.detail = options.detail;
    this.retryable = options.retryable ?? isRetryableStatus(options.status) ?? this.code !== 'VALIDATION';
  }
}

function isRetryableStatus(status?: number): boolean | undefined {
  if (status === undefined) return undefined;
  if (status === 401 || status === 403 || status === 404 || status === 422) return false;
  if (status >= 500 || status === 408 || status === 429) return true;
  return undefined;
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(error.message || 'An unexpected error occurred', {
      code: error.name === 'TypeError' ? 'NETWORK' : 'UNKNOWN',
      title: error.name === 'TypeError' ? 'Connection lost' : 'Something went wrong',
      cause: error,
      retryable: error.name === 'TypeError',
    });
  }
  if (typeof error === 'string') {
    return new AppError(error || 'An unexpected error occurred', { code: 'UNKNOWN' });
  }
  return new AppError('An unexpected error occurred', { code: 'UNKNOWN', cause: error });
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function errorTitle(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AppError) return error.title;
  return fallback;
}
