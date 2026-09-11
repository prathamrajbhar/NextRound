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

export function serializeAuthUser(user: { id: string; email: string; role: string; org_id: string | null; created_at: Date }) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    org_id: user.org_id,
    created_at: user.created_at.toISOString(),
  };
}
