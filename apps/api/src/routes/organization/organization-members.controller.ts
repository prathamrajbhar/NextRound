import { Request, Response, NextFunction } from 'express';
import { MemberInviteSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { emailService } from '../../services/email/email.service';
import { enforceOrgMatch } from './organization.helpers';

export async function getOrgMembers(req: Request, res: Response, next: NextFunction) {
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
  } catch (error) {
    return next(error);
  }
}

export async function inviteOrgMember(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    if (!enforceOrgMatch(req, res, id)) return;

    const validated = MemberInviteSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      if (existingUser.org_id === id) {
        return res.status(400).json({ success: false, error: 'User is already a member of this organization' });
      }

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
  } catch (error) {
    return next(error);
  }
}

export async function removeOrgMember(req: Request, res: Response, next: NextFunction) {
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
  } catch (error) {
    return next(error);
  }
}
