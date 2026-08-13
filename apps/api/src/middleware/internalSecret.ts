import { Request, Response, NextFunction } from 'express';
import { env } from '../lib/env';

const DEFAULT_INTERNAL_SERVICE_SECRET = 'internal_secret_key_change_in_production';




if (process.env.NODE_ENV === 'production') {
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!secret || secret === DEFAULT_INTERNAL_SERVICE_SECRET) {
    throw new Error(
      'Refusing to start in production: INTERNAL_SERVICE_SECRET is missing or set to a known default value. Set a strong, unique secret in the environment.'
    );
  }
}

export function requireInternalSecret(req: Request, res: Response, next: NextFunction) {
  const secretHeader = req.headers['x-internal-service-secret'];
  const expectedSecret = env('INTERNAL_SERVICE_SECRET');

  if (!secretHeader || secretHeader !== expectedSecret) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid internal service secret',
    });
  }

  return next();
}
