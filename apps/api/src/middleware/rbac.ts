import { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: ('hr' | 'candidate')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: requires one of [${roles.join(', ')}] role(s)`,
      });
    }

    return next();
  };
}
