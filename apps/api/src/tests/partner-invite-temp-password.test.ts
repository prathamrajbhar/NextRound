import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';

const { mockPrisma, mockEmailService } = vi.hoisted(() => ({
  mockPrisma: {
    organization: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  mockEmailService: {
    sendMemberInvite: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../lib/jwt', () => ({
  signAccessToken: vi.fn(() => 'mock-access-token'),
  signRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyAccessToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

vi.mock('../../lib/jwt', () => ({
  signAccessToken: vi.fn(() => 'mock-access-token'),
  signRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyAccessToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../services/email/email.service', () => ({
  emailService: mockEmailService,
}));

vi.mock('../../services/email/email.service', () => ({
  emailService: mockEmailService,
}));

import { inviteOrgMember } from '../routes/organization/organization-members.controller';
import { completeFirstLoginPassword } from '../routes/auth/auth-password.controller';

const createMockReq = (overrides: Partial<Request> = {}): Request =>
  ({
    body: {},
    params: {},
    cookies: {},
    user: { userId: 'user-admin-1', email: 'admin@acme.com', role: 'hr', orgId: 'org-1' },
    ...overrides,
  } as unknown as Request);

const createMockRes = () => {
  const res: Response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('Partner Invite with Temporary Password & Forced First-Login Reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a temporary password, hashes it, creates user with must_change_password=true, and sends invite email', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-1', name: 'Acme Corp' });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'new-partner-id',
        email: data.email,
        role: data.role,
        created_at: new Date('2026-03-01'),
      })
    );

    const req = createMockReq({
      params: { id: 'org-1' },
      body: { email: 'partner@acme.com', partnerRole: 'Recruiter' },
    });
    const res = createMockRes();
    const next = vi.fn();

    await inviteOrgMember(req, res, next);

    expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    const createdArgs = mockPrisma.user.create.mock.calls[0][0];
    expect(createdArgs.data.email).toBe('partner@acme.com');
    expect(createdArgs.data.org_id).toBe('org-1');
    expect(createdArgs.data.role).toBe('hr');
    expect(createdArgs.data.profile.must_change_password).toBe(true);
    expect(createdArgs.data.profile.invite_role).toBe('Recruiter');

    expect(mockEmailService.sendMemberInvite).toHaveBeenCalledWith(
      'partner@acme.com',
      'org-1',
      'admin@acme.com',
      'Acme Corp',
      expect.stringMatching(/^Nr-/)
    );

    expect(res.status).toHaveBeenCalledWith(201);
    const responseJson = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(responseJson.success).toBe(true);
    expect(responseJson.data.temporaryPassword).toMatch(/^Nr-/);
    expect(responseJson.data.invitedEmail).toBe('partner@acme.com');
  });

  it('allows invited partner to complete first-login and resets must_change_password to false', async () => {
    const tempPass = 'Nr-test-1234!';
    const passwordHash = await bcrypt.hash(tempPass, 10);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'partner-id-1',
      email: 'partner@acme.com',
      password_hash: passwordHash,
      role: 'hr',
      org_id: 'org-1',
      profile: { must_change_password: true },
      created_at: new Date('2026-03-01'),
    });

    mockPrisma.user.update.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'partner-id-1',
        email: 'partner@acme.com',
        role: 'hr',
        org_id: 'org-1',
        profile: data.profile,
        created_at: new Date('2026-03-01'),
      })
    );

    const req = createMockReq({
      user: { userId: 'partner-id-1', email: 'partner@acme.com', role: 'hr', orgId: 'org-1' },
      body: {
        newPassword: 'MyNewPermanentPassword123!',
        confirmPassword: 'MyNewPermanentPassword123!',
      },
    });
    const res = createMockRes();
    const next = vi.fn();

    await completeFirstLoginPassword(req, res, next);

    expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
    const updateArgs = mockPrisma.user.update.mock.calls[0][0];
    expect(updateArgs.data.profile.must_change_password).toBe(false);
    expect(updateArgs.data.password_hash).not.toBe(passwordHash);

    const responseJson = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(responseJson.success).toBe(true);
    expect(responseJson.data.user.must_change_password).toBe(false);
  });

  it('rejects complete-first-login when passwords do not match', async () => {
    const req = createMockReq({
      user: { userId: 'partner-id-1', email: 'partner@acme.com', role: 'hr', orgId: 'org-1' },
      body: {
        newPassword: 'MyNewPermanentPassword123!',
        confirmPassword: 'MismatchPassword123!',
      },
    });
    const res = createMockRes();
    const next = vi.fn();

    await completeFirstLoginPassword(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
