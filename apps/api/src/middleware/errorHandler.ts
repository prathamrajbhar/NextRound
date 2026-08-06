import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[API Error]:', err);

  if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray((err as any)?.issues) || Array.isArray((err as any)?.errors)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: (err as any).issues || (err as any).errors,
    });
  }

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}
