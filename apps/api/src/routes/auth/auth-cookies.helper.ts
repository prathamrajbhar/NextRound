import { Response } from 'express';
import {
  signAccessToken,
  signRefreshToken,
  JwtPayload,
} from '../../lib/jwt';

const isProduction = process.env.NODE_ENV === 'production';

export function setAuthCookies(res: Response, payload: JwtPayload) {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('user_role', payload.role, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
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

export function serializeAuthUser(
  user: {
    id: string;
    email: string;
    role: string;
    org_id: string | null;
    created_at: Date;
    profile?: unknown;
    candidate_profile?: { full_name?: string | null } | null;
    organization?: { name?: string | null } | null;
  },
  extra?: { name?: string | null; orgName?: string | null }
) {
  const profileObj = (user.profile && typeof user.profile === 'object') ? (user.profile as Record<string, unknown>) : {};
  const name =
    extra?.name ??
    (typeof profileObj.name === 'string' ? profileObj.name : undefined) ??
    user.candidate_profile?.full_name ??
    null;
  const orgName = extra?.orgName ?? user.organization?.name ?? null;

  return {
    id: user.id,
    email: user.email,
    name,
    role: user.role,
    org_id: user.org_id,
    orgName,
    created_at: user.created_at.toISOString(),
    must_change_password: !!profileObj.must_change_password,
  };
}
