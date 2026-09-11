import { Request, Response, NextFunction } from 'express';
import {
  OrganizationSchema,
  OrganizationUpdateSchema,
} from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@nextround/database';
import { enforceOrgMatch } from './organization.helpers';

export async function createOrUpdateOrg(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = OrganizationSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    let orgId = req.user.orgId;

    if (!orgId) {
      const newOrg = await prisma.organization.create({
        data: {
          name: validated.name,
          logo_url: validated.logoUrl,
          industry: validated.industry,
          size: validated.size,
          settings: (validated.settings as Prisma.InputJsonValue) || {},
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

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: validated.name,
        logo_url: validated.logoUrl,
        industry: validated.industry,
        size: validated.size,
        settings: validated.settings ? (validated.settings as Prisma.InputJsonValue) : undefined,
      },
    });

    return res.json({
      success: true,
      data: { organization: updatedOrg },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMyOrg(req: Request, res: Response, next: NextFunction) {
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
  } catch (error) {
    return next(error);
  }
}

export async function getOrgById(req: Request, res: Response, next: NextFunction) {
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
  } catch (error) {
    return next(error);
  }
}

export async function updateOrg(req: Request, res: Response, next: NextFunction) {
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
        ...(mergedSettings && { settings: mergedSettings as Prisma.InputJsonValue }),
      },
    });

    return res.json({
      success: true,
      data: { organization: updatedOrg },
    });
  } catch (error) {
    return next(error);
  }
}
