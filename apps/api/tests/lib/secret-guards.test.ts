import { describe, it, expect, afterEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

/**
 * Batch 2 fail-fast guards (module-load time).
 *
 * src/lib/jwt.ts, src/middleware/internalSecret.ts and
 * src/routes/auth/auth.routes.ts all throw AT MODULE LOAD when
 * NODE_ENV === 'production' and the relevant secret/URL is unset or still a
 * known default value. Dev/test keeps a fallback and never throws.
 *
 * Jest runs under NODE_ENV=test (tests/setup.ts forces it) and caches each
 * module for the whole file, so the production path cannot be reached with a
 * plain `import`. To exercise it hermetically and without polluting other
 * tests, every load here is wrapped in jest.isolateModules(fn):
 *
 *   1. temporarily set process.env.NODE_ENV = 'production' (plus secret vars),
 *   2. require() the module inside jest.isolateModules — a fresh module
 *      registry that re-evaluates the file with the env at that instant,
 *   3. restore the env in afterEach so no other suite is affected.
 *
 * The setup.ts prisma mock is honoured inside isolateModules, so loading
 * auth.routes.ts never instantiates a real PrismaClient. Tests are fully
 * hermetic: dummy strong secret values only, never the real apps/api/.env
 * (dotenv.config runs only in src/index.ts, never under jest).
 */

const DEFAULT_JWT_SECRET = 'nextround_default_secret_key_change_in_production';
const DEFAULT_REFRESH_SECRET = 'nextround_default_refresh_secret_key_change_in_production';
const DEFAULT_INTERNAL_SECRET = 'internal_secret_key_change_in_production';

// Dummy strong secrets — deliberately NOT the known defaults.
const STRONG_JWT = 'test-secret-not-the-default-123';
const STRONG_REFRESH = 'test-refresh-not-the-default-456';
const STRONG_INTERNAL = 'test-internal-not-the-default-789';

// Snapshot of the env set by tests/setup.ts so each test can restore it.
const originalEnv: Record<string, string | undefined> = {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

/**
 * Load a module fresh inside an isolated module registry so load-time guards
 * re-evaluate with whatever env was set just before the call.
 */
function isolatedLoad<T>(modulePath: string): T {
  let mod: T | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require(modulePath) as T;
  });
  return mod as T;
}

describe('Production fail-fast secret guards (module load)', () => {
  describe('src/lib/jwt.ts', () => {
    it('throws at load in production when both signing secrets are unset', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      delete process.env.REFRESH_TOKEN_SECRET;

      expect(() => isolatedLoad('../../src/lib/jwt')).toThrow(
        /Refusing to start in production: JWT_SECRET and REFRESH_TOKEN_SECRET are missing or set to a known default value/
      );
    });

    it('throws at load in production when JWT_SECRET equals the known default', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = DEFAULT_JWT_SECRET;
      process.env.REFRESH_TOKEN_SECRET = STRONG_REFRESH;

      expect(() => isolatedLoad('../../src/lib/jwt')).toThrow(
        /Refusing to start in production: JWT_SECRET is missing or set to a known default value/
      );
    });

    it('throws at load in production when REFRESH_TOKEN_SECRET equals the known default', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = STRONG_JWT;
      process.env.REFRESH_TOKEN_SECRET = DEFAULT_REFRESH_SECRET;

      expect(() => isolatedLoad('../../src/lib/jwt')).toThrow(
        /Refusing to start in production: REFRESH_TOKEN_SECRET is missing or set to a known default value/
      );
    });

    it('throws at load in production when REFRESH_TOKEN_SECRET is unset (partial enforcement)', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = STRONG_JWT;
      delete process.env.REFRESH_TOKEN_SECRET;

      expect(() => isolatedLoad('../../src/lib/jwt')).toThrow(
        /Refusing to start in production: REFRESH_TOKEN_SECRET is missing or set to a known default value/
      );
    });

    it('throws at load in production when JWT_SECRET is unset but REFRESH_TOKEN_SECRET is strong (mirror of partial enforcement)', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      process.env.REFRESH_TOKEN_SECRET = STRONG_REFRESH;

      expect(() => isolatedLoad('../../src/lib/jwt')).toThrow(
        /Refusing to start in production: JWT_SECRET is missing or set to a known default value/
      );
    });

    it('loads fine in production when both secrets are strong, and tokens sign/verify', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = STRONG_JWT;
      process.env.REFRESH_TOKEN_SECRET = STRONG_REFRESH;

      const jwtLib = isolatedLoad<typeof import('../../src/lib/jwt')>('../../src/lib/jwt');
      const token = jwtLib.signAccessToken({ userId: 'u-1', email: 'a@b.c', role: 'candidate' });
      expect(token).toBeTruthy();
      expect(jwtLib.verifyAccessToken(token).userId).toBe('u-1');
    });

    it('loads fine with fallback secrets when NODE_ENV is not production (dev/test preserved)', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.JWT_SECRET;
      delete process.env.REFRESH_TOKEN_SECRET;

      const jwtLib = isolatedLoad<typeof import('../../src/lib/jwt')>('../../src/lib/jwt');
      const token = jwtLib.signAccessToken({ userId: 'u-1', email: 'a@b.c', role: 'candidate' });
      expect(token).toBeTruthy();
      expect(() => jwtLib.verifyAccessToken(token)).not.toThrow();
    });
  });

  describe('src/middleware/internalSecret.ts', () => {
    it('throws at load in production when INTERNAL_SERVICE_SECRET is unset', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.INTERNAL_SERVICE_SECRET;

      expect(() => isolatedLoad('../../src/middleware/internalSecret')).toThrow(
        /Refusing to start in production: INTERNAL_SERVICE_SECRET is missing or set to a known default value/
      );
    });

    it('throws at load in production when INTERNAL_SERVICE_SECRET equals the known default', () => {
      process.env.NODE_ENV = 'production';
      process.env.INTERNAL_SERVICE_SECRET = DEFAULT_INTERNAL_SECRET;

      expect(() => isolatedLoad('../../src/middleware/internalSecret')).toThrow(
        /Refusing to start in production: INTERNAL_SERVICE_SECRET is missing or set to a known default value/
      );
    });

    it('loads fine in production with a strong secret and enforces it on requests', () => {
      process.env.NODE_ENV = 'production';
      process.env.INTERNAL_SERVICE_SECRET = STRONG_INTERNAL;

      const { requireInternalSecret } = isolatedLoad<typeof import('../../src/middleware/internalSecret')>(
        '../../src/middleware/internalSecret'
      );

      const req = { headers: { 'x-internal-service-secret': STRONG_INTERNAL } } as Partial<Request>;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as Partial<Response>;
      const next = jest.fn() as NextFunction;
      requireInternalSecret(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();

      const badReq = { headers: { 'x-internal-service-secret': 'wrong-secret' } } as Partial<Request>;
      const badRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as Partial<Response>;
      const badNext = jest.fn() as NextFunction;
      requireInternalSecret(badReq as Request, badRes as Response, badNext);
      expect(badRes.status).toHaveBeenCalledWith(403);
      expect(badNext).not.toHaveBeenCalled();
    });

    it('loads fine with the fallback secret when NODE_ENV is not production (dev/test preserved)', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.INTERNAL_SERVICE_SECRET;

      const { requireInternalSecret } = isolatedLoad<typeof import('../../src/middleware/internalSecret')>(
        '../../src/middleware/internalSecret'
      );

      // Dev fallback means the DEFAULT secret is still accepted by the middleware.
      const req = { headers: { 'x-internal-service-secret': DEFAULT_INTERNAL_SECRET } } as Partial<Request>;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as Partial<Response>;
      const next = jest.fn() as NextFunction;
      requireInternalSecret(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('src/routes/auth/auth.routes.ts (NEXT_PUBLIC_APP_URL guard)', () => {
    it('throws at load in production when NEXT_PUBLIC_APP_URL is unset', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = STRONG_JWT;
      process.env.REFRESH_TOKEN_SECRET = STRONG_REFRESH;
      delete process.env.NEXT_PUBLIC_APP_URL;

      expect(() => isolatedLoad('../../src/routes/auth/auth.routes')).toThrow(
        /Refusing to start in production: NEXT_PUBLIC_APP_URL is required/
      );
    });

    it('loads fine in production when NEXT_PUBLIC_APP_URL is set', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = STRONG_JWT;
      process.env.REFRESH_TOKEN_SECRET = STRONG_REFRESH;
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.hireos.ai';

      expect(() => isolatedLoad('../../src/routes/auth/auth.routes')).not.toThrow();
    });

    it('loads fine without NEXT_PUBLIC_APP_URL when NODE_ENV is not production (dev/test preserved)', () => {
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = STRONG_JWT;
      process.env.REFRESH_TOKEN_SECRET = STRONG_REFRESH;
      delete process.env.NEXT_PUBLIC_APP_URL;

      expect(() => isolatedLoad('../../src/routes/auth/auth.routes')).not.toThrow();
    });
  });
});
