import jwt from 'jsonwebtoken';

const DEFAULT_JWT_SECRET = 'nextround_default_secret_key_change_in_production';
const DEFAULT_REFRESH_TOKEN_SECRET = 'nextround_default_refresh_secret_key_change_in_production';

const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || DEFAULT_REFRESH_TOKEN_SECRET;

// Fail fast in production when either signing secret is unset or still a known
// default — silently signing tokens with a shared, published secret would let
// anyone forge access/refresh tokens.
if (process.env.NODE_ENV === 'production') {
  const missingSecrets = [
    process.env.JWT_SECRET && process.env.JWT_SECRET !== DEFAULT_JWT_SECRET ? null : 'JWT_SECRET',
    process.env.REFRESH_TOKEN_SECRET && process.env.REFRESH_TOKEN_SECRET !== DEFAULT_REFRESH_TOKEN_SECRET ? null : 'REFRESH_TOKEN_SECRET',
  ].filter(Boolean);

  if (missingSecrets.length > 0) {
    throw new Error(
      `Refusing to start in production: ${missingSecrets.join(' and ')} ${missingSecrets.length > 1 ? 'are' : 'is'} missing or set to a known default value. Set strong, unique secrets in the environment.`
    );
  }
}

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
