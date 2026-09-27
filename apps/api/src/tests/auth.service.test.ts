import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, login, refresh, getMe } from '../routes/auth/auth.controller';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    candidateProfile: {
      create: vi.fn(),
    },
    organization: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@nextround/database', () => ({
  prisma: mockPrisma,
}));

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../lib/jwt', () => ({
  signAccessToken: vi.fn(() => 'mock-access-token'),
  signRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyAccessToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

vi.mock('../services/email/email.service', () => ({
  emailService: {
    sendWelcomeHR: vi.fn().mockResolvedValue(undefined),
  },
}));

const createMockReq = (overrides: Partial<Request> = {}): Request =>
  ({ body: {}, cookies: {}, user: undefined, ...overrides } as unknown as Request);

const createMockRes = () => {
  const res: Response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

interface MockUser {
  id: string;
  email: string;
  password_hash: string;
  role: 'hr' | 'candidate';
  org_id: string | null;
  created_at: Date;
}

function seedUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-uuid-001',
    email: 'test@example.com',
    password_hash: bcrypt.hashSync('Password123!', 10),
    role: 'candidate',
    org_id: null,
    created_at: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('creates a candidate user with profile on valid signup', async () => {
      const req = createMockReq({
        body: {
          email: 'cand@test.com',
          password: 'Str0ng!pass',
          role: 'candidate',
        },
      });
      const res = createMockRes();
      const next = vi.fn();

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u-1',
        email: 'cand@test.com',
        role: 'candidate',
        org_id: null,
        created_at: new Date(),
      });
      mockPrisma.candidateProfile.create.mockResolvedValue({
        id: 'cp-1',
        user_id: 'u-1',
      });

      await register(req, res, next);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'cand@test.com' },
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'cand@test.com',
            role: 'candidate',
          }),
        })
      );
      expect(mockPrisma.candidateProfile.create).toHaveBeenCalledWith({
        data: { user_id: 'u-1', full_name: null },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Object) })
      );
    });

    it('rejects duplicate email signup', async () => {
      const req = createMockReq({
        body: {
          email: 'dup@test.com',
          password: 'Str0ng!pass',
          role: 'candidate',
        },
      });
      const res = createMockRes();
      const next = vi.fn();

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-uuid',
        email: 'dup@test.com',
      });

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User with this email already exists',
      });
    });
  });

  describe('login', () => {
    it('authenticates valid credentials and sets JWT cookies', async () => {
      const user = seedUser({ email: 'login@test.com' });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const compareSpy = vi.spyOn(bcrypt, 'compare');

      const req = createMockReq({
        body: { email: 'login@test.com', password: 'Password123!' },
      });
      const res = createMockRes();
      const next = vi.fn();

      await login(req, res, next);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'login@test.com' },
        include: {
          candidate_profile: { select: { full_name: true } },
          organization: { select: { name: true } },
        },
      });
      expect(compareSpy).toHaveBeenCalledWith('Password123!', user.password_hash);
      expect(res.cookie).toHaveBeenCalled();
    });

    it('returns 401 for non-existent email', async () => {
      const req = createMockReq({
        body: { email: 'ghost@test.com', password: 'Password123!' },
      });
      const res = createMockRes();
      const next = vi.fn();

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid email or password',
      });
    });
  });

  describe('refresh', () => {
    it('returns 401 when refresh token missing', async () => {
      const req = createMockReq({ cookies: {}, body: {} });
      const res = createMockRes();
      const next = vi.fn();

      await refresh(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Refresh token required',
      });
    });
  });

  describe('getMe', () => {
    it('returns 401 when no user attached to request', async () => {
      const req = createMockReq({ user: undefined });
      const res = createMockRes();
      const next = vi.fn();

      await getMe(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
      });
    });
  });
});
