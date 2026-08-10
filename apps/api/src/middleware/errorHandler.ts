import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

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

  // Structured log with request context so failures are traceable without
  // leaking internals to the client (details stay in logs only). Expected
  // client errors (4xx thrown as HttpError from services) are not server
  // failures, so they stay out of the error log.
  if (statusCode >= 500) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: err.message || 'Internal Server Error',
        name: err.name,
        stack: err.stack,
        path: req.path,
        method: req.method,
      })
    );
  }

  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

/** JSON 404 for unmatched routes — keeps the API's envelope contract instead of Express's HTML 404. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}
