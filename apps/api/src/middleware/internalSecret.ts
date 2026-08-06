import { Request, Response, NextFunction } from 'express';

export function requireInternalSecret(req: Request, res: Response, next: NextFunction) {
  const secretHeader = req.headers['x-internal-service-secret'];
  const expectedSecret = process.env.INTERNAL_SERVICE_SECRET || 'internal_secret_key_change_in_production';

  if (!secretHeader || secretHeader !== expectedSecret) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid internal service secret',
    });
  }

  return next();
}
