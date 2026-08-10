import { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import type { ApiEnvelope } from '@nextround/shared';

/**
 * Standard response toolkit.
 *
 * The API contract is a uniform `{ success, data, error }` envelope (see
 * `packages/shared/src/types`). These helpers are the single way handlers
 * build that envelope — no more inline `res.json({ success: true, data })`
 * literals, and a consistent error shape with a stable machine-readable code.
 */

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wraps an async handler so rejections reach the central error middleware. */
export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Success envelope: `{ success: true, data }`. */
export function ok<T>(res: Response, data: T, status = 200): Response {
  const body: ApiEnvelope<T> = { success: true, data };
  return res.status(status).json(body);
}

/** Failure envelope: `{ success: false, error: { code, message, details } }`. */
export function fail(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response {
  const body: ApiEnvelope<never> = { success: false, error: { code, message, details } };
  return res.status(status).json(body);
}

/**
 * Validates a request source against a Zod schema and replaces it with the
 * parsed (typed, unknown-key-stripped) value. On failure, returns a 400
 * envelope without reaching the handler.
 */
export function validate<S extends ZodTypeAny>(
  schema: S,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      return fail(res, 400, 'VALIDATION_ERROR', 'Validation failed', parsed.error.issues);
    }
    req[source] = parsed.data;
    return next();
  };
}
