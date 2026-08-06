import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nextround_default_secret_key_change_in_production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'nextround_default_refresh_secret_key_change_in_production';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'hr' | 'candidate';
  orgId?: string | null;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;
}

// Backwards compatibility wrappers
export const signToken = signAccessToken;
export const verifyToken = verifyAccessToken;
