import { Request, Response, NextFunction } from 'express';
import { OrganizationSettingsSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@nextround/database';
import { enforceOrgMatch } from './organization.helpers';

export async function getOrgSettings(req: Request, res: Response, next: NextFunction) {
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
  } catch (error) {
    return next(error);
  }
}

export async function updateOrgSettings(req: Request, res: Response, next: NextFunction) {
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
      data: { settings: updatedSettings as Prisma.InputJsonValue },
    });

    return res.json({
      success: true,
      data: { settings: updatedOrg.settings },
    });
  } catch (error) {
    return next(error);
  }
}
