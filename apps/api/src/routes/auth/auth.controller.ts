import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { RegisterSchema, LoginSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { verifyRefreshToken, JwtPayload } from '../../lib/jwt';
import { emailService } from '../../services/email/email.service';
import { logger } from '../../lib/logger';
import { setAuthCookies, clearAuthCookies, serializeAuthUser } from './auth-cookies.helper';

export async function register(req: Request, res: Response, next: NextFunction) {
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
        data: { name: validated.orgName },
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
        data: { user_id: user.id },
      });
    }

    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role === 'hr' ? 'hr' : 'candidate',
      orgId: user.org_id,
    };

    setAuthCookies(res, jwtPayload);

    const displayName = user.email.split('@')[0];
    if (user.role === 'hr') {
      emailService
        .sendWelcomeHR(user.email, displayName, validated.orgName)
        .catch((emailErr) => logger.child('Auth').error(`Failed to dispatch HR welcome email to ${user.email}:`, emailErr));
    }

    return res.status(201).json({
      success: true,
      data: { user: serializeAuthUser(user) },
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
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
      data: { user: serializeAuthUser(user) },
    });
  } catch (error) {
    return next(error);
  }
}


export async function refresh(req: Request, res: Response, next: NextFunction) {
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
      data: { user: serializeAuthUser(user) },
    });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token',
    });
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
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
        profile: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const profileObj = (user.profile && typeof user.profile === 'object') ? (user.profile as Record<string, unknown>) : {};

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          org_id: user.org_id,
          created_at: user.created_at.toISOString(),
          must_change_password: !!profileObj.must_change_password,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}
