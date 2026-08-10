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

/**
 * Reject any client attempt to smuggle an org id in the body or query.
 * Org scoping is always derived from the authenticated JWT, never from client
 * input. Applied router-wide so no individual handler can forget the check.
 */
export function rejectOrgIdParam(req: Request, res: Response, next: NextFunction) {
  const polluted =
    Boolean(req.body && (req.body.org_id || req.body.orgId)) ||
    Boolean(req.query && (req.query.org_id || req.query.orgId));

  if (polluted) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: org_id cannot be supplied in body or query. Org scoping is derived from the auth token.',
    });
  }
  return next();
}
