import { Request, Response, NextFunction } from 'express';

const DEFAULT_INTERNAL_SERVICE_SECRET = 'internal_secret_key_change_in_production';

// Fail fast in production when the internal callback secret is still a known
// default — silently running with a shared, published secret would let any
// caller impersonate the AI worker to the Express internal webhooks.
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
  const expectedSecret = process.env.INTERNAL_SERVICE_SECRET || DEFAULT_INTERNAL_SERVICE_SECRET;

  if (!secretHeader || secretHeader !== expectedSecret) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid internal service secret',
    });
  }

  return next();
}
