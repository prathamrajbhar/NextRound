import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  UpdateEmailSchema,
  FirstLoginPasswordSchema,
} from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { JwtPayload } from '../../lib/jwt';
import { emailService } from '../../services/email/email.service';
import { logger } from '../../lib/logger';
import { env } from '../../lib/env';
import { setAuthCookies, clearAuthCookies, serializeAuthUser } from './auth-cookies.helper';

export function logout(_req: Request, res: Response) {
  clearAuthCookies(res);
  return res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = ForgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          reset_token_hash: resetTokenHash,
          reset_token_expiry: resetExpires,
        },
      });

      const appBaseUrl = env('APP_URL');
      const resetUrl = `${appBaseUrl}/reset-password/${resetToken}`;

      try {
        await emailService.sendPasswordReset(user.email, resetUrl);
      } catch (emailErr) {
        logger.child('Auth').error('Failed to send password reset email:', emailErr);
      }
    }

    return res.json({
      success: true,
      data: {
        message: 'If an account exists with that email, a password reset link has been sent.',
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = ResetPasswordSchema.parse(req.body);
    const resetTokenHash = crypto.createHash('sha256').update(validated.token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        reset_token_hash: resetTokenHash,
        reset_token_expiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired password reset token.',
      });
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        reset_token_hash: null,
        reset_token_expiry: null,
      },
    });

    return res.json({
      success: true,
      data: { message: 'Password has been reset successfully.' },
    });
  } catch (error) {
    return next(error);
  }
}

export async function completeFirstLoginPassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const validated = FirstLoginPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const currentProfile = (user.profile && typeof user.profile === 'object')
      ? (user.profile as Record<string, unknown>)
      : {};

    const newHash = await bcrypt.hash(validated.newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: newHash,
        profile: {
          ...currentProfile,
          must_change_password: false,
          password_changed_at: new Date().toISOString(),
        },
      },
    });

    return res.json({
      success: true,
      data: {
        message: 'Password updated successfully',
        user: serializeAuthUser(updatedUser),
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const validated = ChangePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(validated.currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const currentProfile = (user.profile && typeof user.profile === 'object')
      ? (user.profile as Record<string, unknown>)
      : {};

    const newHash = await bcrypt.hash(validated.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: newHash,
        profile: {
          ...currentProfile,
          must_change_password: false,
        },
      },
    });

    return res.json({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateEmail(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const validated = UpdateEmailSchema.parse(req.body);
    const newEmail = validated.email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existing && existing.id !== req.user.userId) {
      return res.status(409).json({ success: false, error: 'That email address is already in use' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { email: newEmail },
    });

    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role === 'hr' ? 'hr' : 'candidate',
      orgId: user.org_id,
    };

    setAuthCookies(res, jwtPayload);

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          org_id: user.org_id,
          created_at: user.created_at.toISOString(),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}
