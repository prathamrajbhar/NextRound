import { Router, Request, Response, NextFunction } from 'express';
import { HRProfileUpdateSchema, CandidateSettingsSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

export const accountRouter = Router();




function serializeHrProfile(user: {
  id: string;
  email: string;
  role: string;
  org_id: string | null;
  organization?: { name: string | null } | null;
  profile?: unknown;
}) {
  const stored = (user.profile as Record<string, unknown>) || {};
  const displayName = (stored.name as string) || user.email.split('@')[0];

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    org_id: user.org_id,
    name: displayName,
    full_name: displayName,
    avatar: stored.avatarUrl ?? null,
    avatar_url: stored.avatarUrl ?? null,
    timezone: stored.timezone ?? null,
    linkedin_url: stored.linkedinUrl ?? null,
    title: stored.title ?? null,
    specialties: Array.isArray(stored.specialties) ? stored.specialties : [],
    company: user.organization?.name ?? null,
    org_name: user.organization?.name ?? null,
  };
}


accountRouter.get(
  '/hr/profile',
  authenticate,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: {
          organization: { select: { name: true, logo_url: true } },
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.json({
        success: true,
        data: { profile: serializeHrProfile(user) },
      });
    } catch (err) {
      return next(err);
    }
  }
);


accountRouter.patch(
  '/hr/profile',
  authenticate,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = HRProfileUpdateSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const stored = (user.profile as Record<string, unknown>) || {};

      
      
      const updates: Record<string, unknown> = {};
      const bodyHas = (key: string) => Object.prototype.hasOwnProperty.call(validated, key);
      if (bodyHas('name')) updates.name = validated.name;
      if (bodyHas('avatarUrl')) updates.avatarUrl = validated.avatarUrl;
      if (bodyHas('timezone')) updates.timezone = validated.timezone;
      if (bodyHas('linkedinUrl')) updates.linkedinUrl = validated.linkedinUrl;
      if (bodyHas('title')) updates.title = validated.title;
      if (bodyHas('specialties')) updates.specialties = validated.specialties;

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { profile: { ...stored, ...updates } as any },
        include: { organization: { select: { name: true, logo_url: true } } },
      });

      return res.json({
        success: true,
        data: { profile: serializeHrProfile(updatedUser) },
      });
    } catch (err) {
      return next(err);
    }
  }
);


accountRouter.get(
  '/candidate/settings',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await prisma.candidateProfile.findUnique({
        where: { user_id: req.user!.userId },
        select: { settings: true },
      });

      const stored = (profile?.settings as Record<string, unknown>) || {};

      return res.json({
        success: true,
        data: {
          settings: {
            emailNotifications: true,
            privacyMode: false,
            timezone: 'UTC',
            ...stored,
          },
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);


accountRouter.patch(
  '/candidate/settings',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CandidateSettingsSchema.parse(req.body);

      
      
      const incoming: Record<string, unknown> = { ...validated };
      const nested = incoming.settings;
      if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        Object.assign(incoming, nested as Record<string, unknown>);
      }
      delete incoming.settings;

      const existing = await prisma.candidateProfile.findUnique({
        where: { user_id: req.user!.userId },
        select: { id: true, settings: true },
      });

      
      
      const merged = {
        ...((existing?.settings as Record<string, unknown>) || {}),
        ...incoming,
      };

      const profile = await prisma.candidateProfile.upsert({
        where: { user_id: req.user!.userId },
        create: { user_id: req.user!.userId, settings: merged as any },
        update: { settings: merged as any },
      });

      return res.json({
        success: true,
        data: {
          settings: profile.settings,
          message: 'Settings saved successfully',
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);
