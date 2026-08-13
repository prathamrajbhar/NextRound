import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  JwtPayload,
} from '../../lib/jwt';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter, forgotPasswordRateLimiter } from '../../middleware/rateLimit';
import { emailService } from '../../services/email.service';

export const authRouter = Router();

const isProduction = process.env.NODE_ENV === 'production';

// Fail fast in production when the public app URL is unset — password reset and
// verification links would otherwise point at the local dev origin.
if (isProduction && !process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error(
    'Refusing to start in production: NEXT_PUBLIC_APP_URL is required for generating password reset and verification links. Set it in the environment.'
  );
}

function setAuthCookies(res: Response, payload: JwtPayload) {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie('user_role', payload.role, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
  });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
  });
  res.clearCookie('user_role', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
  });
}

// POST /api/v1/auth/register
authRouter.post('/register', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RegisterSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    let orgId: string | undefined = undefined;

    if (validated.role === 'hr' && validated.orgName) {
      const org = await prisma.organization.create({
        data: {
          name: validated.orgName,
        },
      });
      orgId = org.id;
    }

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password_hash: passwordHash,
        role: validated.role === 'hr' ? 'hr' : 'candidate',
        org_id: orgId,
      },
    });

    if (user.role === 'candidate') {
      await prisma.candidateProfile.create({
        data: {
          user_id: user.id,
        },
      });
    }

    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role === 'hr' ? 'hr' : 'candidate',
      orgId: user.org_id,
    };

    setAuthCookies(res, jwtPayload);

    return res.status(201).json({
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
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/auth/login
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const passwordValid = await bcrypt.compare(validated.password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

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
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  clearAuthCookies(res);
  return res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

// POST /api/v1/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
      });
    }

    const payload = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: 'User no longer exists',
      });
    }

    const newJwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role === 'hr' ? 'hr' : 'candidate',
      orgId: user.org_id,
    };

    setAuthCookies(res, newJwtPayload);

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
  } catch (err) {
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token',
    });
  }
});

// GET /api/v1/auth/me
authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        role: true,
        org_id: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        user: {
          ...user,
          created_at: user.created_at.toISOString(),
        },
      },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/auth/forgot-password
authRouter.post('/forgot-password', forgotPasswordRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = ForgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          reset_token_hash: resetTokenHash,
          reset_token_expiry: resetExpires,
        },
      });

      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resetUrl = `${appBaseUrl}/reset-password/${resetToken}`;

      try {
        await emailService.sendEmail({
          to: user.email,
          subject: 'Reset your NextRound password',
          html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
          text: `Reset your password at: ${resetUrl}`,
        });
      } catch (emailErr) {
        console.error('[ForgotPassword] Failed to send reset email:', emailErr);
      }
    }

    return res.json({
      success: true,
      data: {
        message: 'If an account exists with that email, a password reset link has been sent.',
      },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/auth/reset-password
authRouter.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
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
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/v1/auth/change-password
authRouter.patch('/change-password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
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

    const newHash = await bcrypt.hash(validated.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newHash },
    });

    return res.json({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  } catch (err) {
    return next(err);
  }
});
