import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray((err as any)?.issues) || Array.isArray((err as any)?.errors)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: (err as any).issues || (err as any).errors,
    });
  }

  const statusCode = (err as any).statusCode || 500;

  if (statusCode >= 500) {
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err, {
      name: err.name,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn(`Request failed with ${statusCode} on ${req.method} ${req.originalUrl}`, err.message);
  }

  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}
