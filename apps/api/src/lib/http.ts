import { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import type { ApiEnvelope } from '@nextround/shared';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function ok<T>(res: Response, data: T, status = 200): Response {
  const body: ApiEnvelope<T> = { success: true, data };
  return res.status(status).json(body);
}

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
