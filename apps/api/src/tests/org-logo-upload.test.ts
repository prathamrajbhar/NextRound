import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { uploadOrgLogo } from '../routes/organization/organization-profile.controller';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    organization: {
      update: vi.fn().mockResolvedValue({ id: 'org-test-1', logo_url: 'https://s3.example.com/logo.png' }),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    organization: {
      update: vi.fn().mockResolvedValue({ id: 'org-test-1', logo_url: 'https://s3.example.com/logo.png' }),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../lib/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue('https://s3.example.com/bucket/org-logos/logo.png'),
}));

describe('Organization Logo Upload Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads logo file to S3 and returns logoUrl', async () => {
    const req = {
      file: {
        originalname: 'company_logo.png',
        buffer: Buffer.from('fake image content'),
        mimetype: 'image/png',
      },
      user: {
        userId: 'usr-1',
        orgId: 'org-1',
        role: 'hr',
      },
    } as unknown as Request;

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as unknown as NextFunction;

    await uploadOrgLogo(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        logoUrl: 'https://s3.example.com/bucket/org-logos/logo.png',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('passes error to next middleware when no file is present', async () => {
    const req = {
      user: {
        userId: 'usr-1',
        orgId: 'org-1',
        role: 'hr',
      },
    } as unknown as Request;

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as unknown as NextFunction;

    await uploadOrgLogo(req, res, next);

    expect(next).toHaveBeenCalled();
    const errorPassed = next.mock.calls[0][0];
    expect(errorPassed.message).toMatch(/No logo image file provided/);
  });
});
