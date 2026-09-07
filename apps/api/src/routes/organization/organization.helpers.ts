import { Request, Response } from 'express';

export function enforceOrgMatch(req: Request, res: Response, targetOrgId: string): boolean {
  if (req.user?.orgId !== targetOrgId) {
    res.status(403).json({ success: false, error: 'Forbidden: Access denied to other organization resources' });
    return false;
  }
  return true;
}
