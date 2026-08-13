import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  throw new Error(
    'JWT_SECRET is missing or too short. Set a strong, unique secret in the environment.'
  );
}
if (!REFRESH_TOKEN_SECRET || REFRESH_TOKEN_SECRET.length < 16) {
  throw new Error(
    'REFRESH_TOKEN_SECRET is missing or too short. Set a strong, unique secret in the environment.'
  );
}

const signingSecret: string = JWT_SECRET;
const refreshSecret: string = REFRESH_TOKEN_SECRET;

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'hr' | 'candidate';
  orgId?: string | null;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, signingSecret, { expiresIn: '1h' });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, refreshSecret, { expiresIn: '7d' });
}

function verifyToken(token: string, secret: string): JwtPayload {
  return jwt.verify(token, secret) as unknown as JwtPayload;
}

export function verifyAccessToken(token: string): JwtPayload {
  return verifyToken(token, signingSecret);
}

export function verifyRefreshToken(token: string): JwtPayload {
  return verifyToken(token, refreshSecret);
}
