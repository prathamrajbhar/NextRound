export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string | { message: string; code?: string; details?: unknown } | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
