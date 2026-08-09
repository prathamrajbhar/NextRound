import { Router, Request, Response, NextFunction } from 'express';
import {
  OrganizationSchema,
  OrganizationUpdateSchema,
  OrganizationSettingsSchema,
  MemberInviteSchema,
} from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope } from '../../middleware/orgScope';
import { emailService } from '../../services/email.service';

export const organizationRouter = Router();

// Helper to check parameter pollution / spoofing attempt
function enforceOrgMatch(req: Request, res: Response, targetOrgId: string): boolean {
  if (req.body && (req.body.org_id || req.body.orgId)) {
    res.status(403).json({ success: false, error: 'Forbidden: org_id cannot be supplied in body' });
    return false;
  }
  if (req.query && (req.query.org_id || req.query.orgId)) {
    res.status(403).json({ success: false, error: 'Forbidden: org_id cannot be supplied in query' });
    return false;
  }
  if (req.user?.orgId !== targetOrgId) {
    res.status(403).json({ success: false, error: 'Forbidden: Access denied to other organization resources' });
    return false;
  }
  return true;
}

// POST /api/v1/organizations - Create or update current HR user's organization
organizationRouter.post(
  '/',
  authenticate,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && (req.body.org_id || req.body.orgId)) {
        return res.status(403).json({ success: false, error: 'Forbidden: org_id parameter pollution' });
      }

      const validated = OrganizationSchema.parse(req.body);

      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      let orgId = req.user.orgId;

      if (!orgId) {
        // Create new organization and link to HR user
        const newOrg = await prisma.organization.create({
          data: {
            name: validated.name,
            logo_url: validated.logoUrl,
            industry: validated.industry,
            size: validated.size,
            settings: (validated.settings as any) || {},
          },
        });
        orgId = newOrg.id;

        await prisma.user.update({
          where: { id: req.user.userId },
          data: { org_id: orgId },
        });

        return res.status(201).json({
          success: true,
          data: { organization: newOrg },
        });
      }

      // Update existing organization
      const updatedOrg = await prisma.organization.update({
        where: { id: orgId },
        data: {
          name: validated.name,
          logo_url: validated.logoUrl,
          industry: validated.industry,
          size: validated.size,
          settings: validated.settings ? (validated.settings as any) : undefined,
        },
      });

      return res.json({
        success: true,
        data: { organization: updatedOrg },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/organizations/me - Fetch current HR user's organization
organizationRouter.get(
  '/me',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: req.user!.orgId! },
      });

      if (!org) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      return res.json({
        success: true,
        data: { organization: org },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/organizations/:id - Fetch organization details by ID (HR scoped)
organizationRouter.get(
  '/:id',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!enforceOrgMatch(req, res, id)) return;

      const org = await prisma.organization.findUnique({
        where: { id },
      });

      if (!org) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      return res.json({
        success: true,
        data: { organization: org },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/v1/organizations/:id - Partial update organization
organizationRouter.patch(
  '/:id',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!enforceOrgMatch(req, res, id)) return;

      const validated = OrganizationUpdateSchema.parse(req.body);

      const existingOrg = await prisma.organization.findUnique({
        where: { id },
      });

      if (!existingOrg) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const mergedSettings = validated.settings || validated.availabilityHours
        ? {
            ...(existingOrg.settings as Record<string, unknown>),
            ...(validated.settings || {}),
            ...(validated.availabilityHours ? { availabilityHours: validated.availabilityHours } : {}),
          }
        : undefined;

      const updatedOrg = await prisma.organization.update({
        where: { id },
        data: {
          ...(validated.name && { name: validated.name }),
          ...(validated.logoUrl !== undefined && { logo_url: validated.logoUrl }),
          ...(validated.industry !== undefined && { industry: validated.industry }),
          ...(validated.size !== undefined && { size: validated.size }),
          ...(mergedSettings && { settings: mergedSettings as any }),
        },
      });

      return res.json({
        success: true,
        data: { organization: updatedOrg },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/organizations/:id/settings - Fetch settings
organizationRouter.get(
  '/:id/settings',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!enforceOrgMatch(req, res, id)) return;

      const org = await prisma.organization.findUnique({
        where: { id },
        select: { id: true, name: true, settings: true },
      });

      if (!org) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      return res.json({
        success: true,
        data: { settings: org.settings },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/v1/organizations/:id/settings - Update settings
organizationRouter.patch(
  '/:id/settings',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!enforceOrgMatch(req, res, id)) return;

      const validated = OrganizationSettingsSchema.parse(req.body);

      const existingOrg = await prisma.organization.findUnique({
        where: { id },
      });

      if (!existingOrg) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const updatedSettings = {
        ...(existingOrg.settings as Record<string, unknown>),
        ...validated,
      };

      const updatedOrg = await prisma.organization.update({
        where: { id },
        data: { settings: updatedSettings as any },
      });

      return res.json({
        success: true,
        data: { settings: updatedOrg.settings },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/organizations/:id/members - List members
organizationRouter.get(
  '/:id/members',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!enforceOrgMatch(req, res, id)) return;

      const members = await prisma.user.findMany({
        where: { org_id: id },
        select: {
          id: true,
          email: true,
          role: true,
          created_at: true,
        },
      });

      return res.json({
        success: true,
        data: { members },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/organizations/:id/members/invite - Invite member
organizationRouter.post(
  '/:id/members/invite',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!enforceOrgMatch(req, res, id)) return;

      const validated = MemberInviteSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (existingUser) {
        if (existingUser.org_id === id) {
          return res.status(400).json({ success: false, error: 'User is already a member of this organization' });
        }
        // Associate user with org if currently unassociated
        if (!existingUser.org_id) {
          const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: { org_id: id },
            select: { id: true, email: true, role: true, created_at: true },
          });
          return res.json({
            success: true,
            data: { member: updatedUser, message: 'Existing user added to organization' },
          });
        }
        return res.status(400).json({ success: false, error: 'User belongs to another organization' });
      }

      // Create pending invited user or return invitation confirmation. There is no
      // BullMQ mail queue in this repo (see QUEUE_NAMES in lib/bullmq.ts), so the
      // invitation is sent directly through the email service. Only report success
      // when the transporter actually accepted it — never claim "queued" without
      // delivering the email.
      const invited = await emailService.sendMemberInvite(
        validated.email,
        id,
        req.user?.email
      );

      if (!invited) {
        return res.status(502).json({
          success: false,
          error: `Invitation email could not be sent to ${validated.email}. The email service is not configured (check SMTP_* env vars).`,
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          invitedEmail: validated.email,
          message: `Invitation email sent to ${validated.email}`,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// DELETE /api/v1/organizations/:id/members/:userId - Remove member
organizationRouter.delete(
  '/:id/members/:userId',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.params.userId as string;
      if (!enforceOrgMatch(req, res, id)) return;

      if (userId === req.user!.userId) {
        return res.status(400).json({ success: false, error: 'Cannot remove yourself from organization' });
      }

      const member = await prisma.user.findFirst({
        where: { id: userId, org_id: id },
      });

      if (!member) {
        return res.status(404).json({ success: false, error: 'Member not found in organization' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { org_id: null },
      });

      return res.json({
        success: true,
        data: { message: 'Member removed from organization successfully' },
      });
    } catch (err) {
      return next(err);
    }
  }
);
