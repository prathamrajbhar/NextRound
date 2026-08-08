import { Router, Request, Response, NextFunction } from 'express';
import { HRProfileUpdateSchema, CandidateSettingsSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { serializeApplicationList, serializeJobList } from '../../lib/serializers';

export const userRouter = Router();

// Flatten the user row + stored profile JSON into the camelCase/snake_case
// shape the HR profile page expects (name, email, role, company, linkedin_url,
// avatar, timezone, title, specialties).
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

// GET /api/v1/hr/profile - Get current HR profile info
userRouter.get(
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

// PATCH /api/v1/hr/profile - Update HR user profile info
userRouter.patch(
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

      // Only update fields the client actually sent, so partial updates
      // (e.g. just changing the avatar) never wipe other profile data.
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

// GET /api/v1/candidate/dashboard - Candidate dashboard KPIs and next interview
userRouter.get(
  '/candidate/dashboard',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await prisma.candidateProfile.findUnique({
        where: { user_id: req.user!.userId },
      });

      if (!profile) {
        return res.json({
          success: true,
          data: {
            activeApplications: [],
            upcomingInterviews: [],
            recentMockSessions: [],
            recommendedJobs: [],
          },
        });
      }

      const applications = await prisma.application.findMany({
        where: { candidate_id: profile.id },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
              organization: { select: { name: true, logo_url: true } },
            },
          },
          candidate: {
            select: {
              id: true,
              user: { select: { email: true } },
              resume_url: true,
              skills: true,
              target_roles: true,
            },
          },
          evaluations: true,
          interview: true,
          offer: true,
        },
        orderBy: { applied_at: 'desc' },
      });

      const upcomingInterviews = applications
        .filter((app) => app.interview && app.interview.status === 'scheduled')
        .map((app) => ({
          id: app.interview!.id,
          jobTitle: app.job.title,
          date: app.interview!.scheduled_at ? app.interview!.scheduled_at.toISOString() : app.applied_at.toISOString(),
          type: 'Voice Interview',
        }));

      // Recommended jobs: published jobs matching candidate target roles, excluding already-applied
      const appliedJobIds = applications.map((a) => a.job_id);
      const recommendedJobs = await prisma.job.findMany({
        where: {
          status: { in: ['published', 'active'] },
          id: { notIn: appliedJobIds.length ? appliedJobIds : ['__none__'] },
        },
        include: {
          organization: { select: { id: true, name: true, logo_url: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 6,
      });

      // Recent mock sessions for the candidate
      const mockSessions = await prisma.mockSession.findMany({
        where: { candidate_id: profile.id },
        orderBy: { created_at: 'desc' },
        take: 5,
      });

      return res.json({
        success: true,
        data: {
          activeApplications: serializeApplicationList(applications),
          upcomingInterviews,
          recentMockSessions: mockSessions.map((m) => ({
            id: m.id,
            targetCompany: m.target_company,
            targetRole: m.target_role,
            difficulty: m.difficulty || 'mid',
            score: typeof m.score === 'number' ? m.score : 0,
            date: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : '',
            status: m.status || 'completed',
          })),
          recommendedJobs: serializeJobList(recommendedJobs),
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/candidate/settings - Candidate notification and privacy settings
userRouter.get(
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

// PATCH /api/v1/candidate/settings - Update candidate settings
userRouter.patch(
  '/candidate/settings',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CandidateSettingsSchema.parse(req.body);

      // Flatten a nested `{ settings: {...} }` payload (sent by the privacy tab)
      // into the top-level key set so every tab reads/writes the same flat blob.
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

      // Merge with previously stored settings so saving one tab never wipes
      // the values saved by another tab.
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
