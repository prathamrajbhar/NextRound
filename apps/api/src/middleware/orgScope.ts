import { Request, Response, NextFunction } from 'express';

export function requireOrgScope(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role === 'hr' && !req.user.orgId) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: HR user must belong to an organization',
    });
  }

  return next();
}
