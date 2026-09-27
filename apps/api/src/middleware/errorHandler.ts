import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

interface StructuredError extends Error {
  statusCode?: number;
  status?: number;
  issues?: unknown[];
  errors?: unknown[];
}

export function errorHandler(
  err: StructuredError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues) || Array.isArray(err?.errors)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.issues || err.errors,
    });
  }

  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : typeof err.status === 'number' ? err.status : 500;

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
