import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  upsertOffer,
  OfferDraftInput,
  NoSalaryConfiguredError,
} from '../services/offer/offer.service';
import { prisma } from '@nextround/database';
import { deriveSalary, deriveEquity } from '../lib/offer-terms';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@nextround/database', () => ({
  prisma: {
    offer: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'mock-magic-token-123'),
}));

// ---------------------------------------------------------------------------
// deriveSalary unit tests
// ---------------------------------------------------------------------------

describe('Offer Terms — deriveSalary', () => {
  it('parses "15LPA" as 1500000', () => {
    expect(deriveSalary('15LPA')).toBe(1500000);
  });

  it('parses "1.5Cr" as 15000000', () => {
    expect(deriveSalary('1.5Cr')).toBe(15000000);
  });

  it('parses "1200000" as 1200000', () => {
    expect(deriveSalary('1200000')).toBe(1200000);
  });

  it('parses "$150,000" as 150000', () => {
    expect(deriveSalary('$150,000')).toBe(150000);
  });

  it('parses "25k" as 25000', () => {
    expect(deriveSalary('25k')).toBe(25000);
  });

  it('returns null for empty string', () => {
    expect(deriveSalary('')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(deriveSalary(undefined)).toBeNull();
  });

  it('returns null for null', () => {
    expect(deriveSalary(null)).toBeNull();
  });

  it('returns null for non-numeric string', () => {
    expect(deriveSalary('Negotiable')).toBeNull();
  });

  it('parses "10-15LPA" as 1500000 (max)', () => {
    expect(deriveSalary('10-15LPA')).toBe(1500000);
  });

  it('parses "20 LPA" with space', () => {
    expect(deriveSalary('20 LPA')).toBe(2000000);
  });

  it('parses "1.2 CR" with space', () => {
    expect(deriveSalary('1.2 CR')).toBe(12000000);
  });
});

// ---------------------------------------------------------------------------
// deriveEquity unit tests
// ---------------------------------------------------------------------------

describe('Offer Terms — deriveEquity', () => {
  it('returns equity from job thresholds when present', () => {
    expect(deriveEquity({ thresholds: { equity: '0.1% - 0.5% over 4 years' } })).toBe(
      '0.1% - 0.5% over 4 years'
    );
  });

  it('returns null when no equity in thresholds', () => {
    expect(deriveEquity({ thresholds: {} })).toBeNull();
  });

  it('returns null when thresholds is undefined', () => {
    expect(deriveEquity({} as any)).toBeNull();
  });

  it('returns null when thresholds is null', () => {
    expect(deriveEquity({ thresholds: null })).toBeNull();
  });

  it('returns null when equity is empty string', () => {
    expect(deriveEquity({ thresholds: { equity: '' } })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// upsertOffer unit tests
// ---------------------------------------------------------------------------

describe('Offer Service — upsertOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseInput: OfferDraftInput = {
    applicationId: 'app-offer-001',
    job: {
      title: 'Senior Software Engineer',
      salary: '20LPA',
      thresholds: { equity: '0.1%' },
    },
    roleTitle: 'Senior Software Engineer',
    salary: undefined,
    equity: undefined,
    startDate: '2026-11-01',
    offerLetterContent: 'Official Offer for Senior Software Engineer',
  };

  it('creates a new offer with derived salary and equity', async () => {
    (prisma.offer.upsert as vi.Mock).mockResolvedValue({
      id: 'offer-new-uuid',
      application_id: 'app-offer-001',
      role_title: 'Senior Software Engineer',
      salary: 2000000,
      equity: '0.1%',
      start_date: new Date('2026-11-01'),
      offer_letter_content: 'Official Offer for Senior Software Engineer',
      magic_link_token: 'mock-magic-token-123',
      status: 'pending',
      valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
    });

    const result = await upsertOffer(baseInput);

    expect(result.offer.role_title).toBe('Senior Software Engineer');
    expect(result.offer.salary).toBe(2000000);
    expect(result.offer.equity).toBe('0.1%');
    expect(result.offer.status).toBe('pending');
    expect(result.offer.magic_link_token).toBe('mock-magic-token-123');
    expect(result.isNew).toBe(true);
  });

  it('uses explicit salary when provided (overrides job salary)', async () => {
    const inputWithSalary: OfferDraftInput = {
      ...baseInput,
      salary: 1800000,
    };

    (prisma.offer.upsert as vi.Mock).mockResolvedValue({
      id: 'offer-salary-uid',
      application_id: 'app-offer-001',
      role_title: 'Senior Software Engineer',
      salary: 1800000,
      equity: '0.1%',
      status: 'pending',
      magic_link_token: 'mock-magic-token-123',
    });

    const result = await upsertOffer(inputWithSalary);

    expect(result.offer.salary).toBe(1800000);
  });

  it('uses explicit equity when provided (overrides job equity)', async () => {
    const inputWithEquity: OfferDraftInput = {
      ...baseInput,
      equity: '0.2% - 0.6% over 4 years',
    };

    (prisma.offer.upsert as vi.Mock).mockResolvedValue({
      id: 'offer-equity-uid',
      application_id: 'app-offer-001',
      role_title: 'Senior Software Engineer',
      salary: 2000000,
      equity: '0.2% - 0.6% over 4 years',
      status: 'pending',
      magic_link_token: 'mock-magic-token-123',
    });

    const result = await upsertOffer(inputWithEquity);

    expect(result.offer.equity).toBe('0.2% - 0.6% over 4 years');
  });

  it('creates offer without start_date when not provided', async () => {
    const inputNoStart: OfferDraftInput = {
      ...baseInput,
      startDate: undefined,
    };

    (prisma.offer.upsert as vi.Mock).mockResolvedValue({
      id: 'offer-nostart-uid',
      application_id: 'app-offer-001',
      role_title: 'Senior Software Engineer',
      salary: 2000000,
      equity: '0.1%',
      start_date: null,
      status: 'pending',
      magic_link_token: 'mock-magic-token-123',
    });

    const result = await upsertOffer(inputNoStart);

    expect(result.offer.start_date).toBeNull();
  });

  it('uses default offer letter content when not provided', async () => {
    const inputNoLetter: OfferDraftInput = {
      ...baseInput,
      offerLetterContent: undefined,
    };

    (prisma.offer.upsert as vi.Mock).mockResolvedValue({
      id: 'offer-noletter-uid',
      application_id: 'app-offer-001',
      role_title: 'Senior Software Engineer',
      salary: 2000000,
      equity: '0.1%',
      offer_letter_content: 'Official Offer for Senior Software Engineer',
      status: 'pending',
      magic_link_token: 'mock-magic-token-123',
    });

    const result = await upsertOffer(inputNoLetter);

    expect(result.offer.offer_letter_content).toBe('Official Offer for Senior Software Engineer');
  });

  it('uses job title as role title when roleTitle is empty', async () => {
    const inputNoRoleTitle: OfferDraftInput = {
      ...baseInput,
      roleTitle: '',
    };

    (prisma.offer.upsert as vi.Mock).mockResolvedValue({
      id: 'offer-default-role-uid',
      application_id: 'app-offer-001',
      role_title: 'Senior Software Engineer',
      salary: 2000000,
      equity: '0.1%',
      status: 'pending',
      magic_link_token: 'mock-magic-token-123',
    });

    const result = await upsertOffer(inputNoRoleTitle);

    expect(result.offer.role_title).toBe('Senior Software Engineer');
  });

  it('throws NoSalaryConfiguredError when job has no salary and no explicit salary', async () => {
    const inputNoSalary: OfferDraftInput = {
      ...baseInput,
      job: {
        ...baseInput.job,
        salary: undefined,
      },
      salary: undefined,
    };

    await expect(upsertOffer(inputNoSalary)).rejects.toBeInstanceOf(NoSalaryConfiguredError);
    await expect(upsertOffer(inputNoSalary)).rejects.toThrow(
      'Cannot generate an offer for "Senior Software Engineer": the job has no salary configured'
    );
  });

  it('throws NoSalaryConfiguredError when job salary is empty string', async () => {
    const inputEmptySalary: OfferDraftInput = {
      ...baseInput,
      job: {
        ...baseInput.job,
        salary: '',
      },
      salary: undefined,
    };

    await expect(upsertOffer(inputEmptySalary)).rejects.toBeInstanceOf(NoSalaryConfiguredError);
  });

  it('updates existing offer when upsert finds existing record', async () => {
    (prisma.offer.upsert as vi.Mock).mockResolvedValue({
      id: 'offer-existing-uid',
      application_id: 'app-offer-001',
      role_title: 'Updated Engineer',
      salary: 2200000,
      equity: '0.15%',
      start_date: new Date('2026-12-01'),
      offer_letter_content: 'Updated Offer',
      magic_link_token: 'mock-magic-token-456', // different token = update path
      status: 'pending',
      valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    const result = await upsertOffer({
      ...baseInput,
      roleTitle: 'Updated Engineer',
      salary: 2200000,
      equity: '0.15%',
      startDate: '2026-12-01',
      offerLetterContent: 'Updated Offer',
    });

    expect(result.isNew).toBe(false);
    expect(result.offer.role_title).toBe('Updated Engineer');
  });

  it('sets valid_until to 14 days from now', async () => {
    (prisma.offer.upsert as vi.Mock).mockResolvedValue({
      id: 'offer-valid-uid',
      application_id: 'app-offer-001',
      role_title: 'Engineer',
      salary: 1500000,
      equity: '0.1%',
      valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'pending',
      magic_link_token: 'mock-magic-token-123',
    });

    const result = await upsertOffer(baseInput);

    const expectedValidity = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const diffMs = Math.abs(result.offer.valid_until.getTime() - expectedValidity.getTime());
    expect(diffMs).toBeLessThan(1000); // within 1 second
  });

  it('generates unique magic token for new offers', async () => {
    (prisma.offer.upsert as vi.Mock).mockResolvedValue({
      id: 'offer-token-uid',
      application_id: 'app-offer-001',
      role_title: 'Engineer',
      salary: 1500000,
      equity: '0.1%',
      magic_link_token: 'mock-magic-token-123',
      status: 'pending',
      valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    const result = await upsertOffer(baseInput);

    expect(result.offer.magic_link_token).toBe('mock-magic-token-123');
    expect(result.isNew).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Offer acceptance / decline flows
// ---------------------------------------------------------------------------

import { acceptOffer, declineOffer, getOfferDetails } from '../services/offer/offer.service';
import { notFound, badRequest, conflict } from '../lib/http-errors';

describe('Offer Service — acceptOffer', () => {
  it('accepts offer and updates status to accepted', async () => {
    const offer = {
      id: 'offer-accept-uid',
      application_id: 'app-accept-001',
      status: 'pending',
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      signature_svg: null,
    };
    (prisma.offer.findUnique as vi.Mock).mockResolvedValue(offer);
    (prisma.offer.update as vi.Mock).mockResolvedValue({
      ...offer,
      status: 'accepted',
      signature_svg: '<svg>...</svg>',
    });

    const result = await acceptOffer('app-accept-001', '<svg>...</svg>', 'user-accept');

    expect(result.status).toBe('accepted');
    expect(result.signature_svg).toBe('<svg>...</svg>');
  });

  it('throws notFound when offer does not exist', async () => {
    (prisma.offer.findUnique as vi.Mock).mockResolvedValue(null);

    await expect(acceptOffer('ghost-offer', '<svg></svg>', 'user')).rejects.toThrow('Offer not found');
  });

  it('throws badRequest when offer is already accepted', async () => {
    const offer = {
      id: 'offer-already-accepted',
      status: 'accepted',
    };
    (prisma.offer.findUnique as vi.Mock).mockResolvedValue(offer);

    await expect(acceptOffer('offer-already-accepted', '<svg></svg>', 'user')).rejects.toThrow(
      'Offer already accepted'
    );
  });

  it('throws conflict when offer has expired', async () => {
    const offer = {
      id: 'offer-expired',
      status: 'pending',
      valid_until: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // expired 1 day ago
    };
    (prisma.offer.findUnique as vi.Mock).mockResolvedValue(offer);

    await expect(acceptOffer('offer-expired', '<svg></svg>', 'user')).rejects.toThrow(
      'Offer has expired'
    );
  });
});

describe('Offer Service — declineOffer', () => {
  it('declines offer with optional feedback', async () => {
    const offer = {
      id: 'offer-decline-uid',
      application_id: 'app-decline-001',
      status: 'pending',
    };
    (prisma.offer.findUnique as vi.Mock).mockResolvedValue(offer);
    (prisma.offer.update as vi.Mock).mockResolvedValue({
      ...offer,
      status: 'declined',
      decline_feedback: 'Accepted another offer',
    });

    const result = await declineOffer('app-decline-001', 'Accepted another offer', 'user-decline');

    expect(result.status).toBe('declined');
    expect(result.decline_feedback).toBe('Accepted another offer');
  });

  it('declines offer without feedback', async () => {
    const offer = {
      id: 'offer-decline-nofb',
      application_id: 'app-decline-002',
      status: 'pending',
    };
    (prisma.offer.findUnique as vi.Mock).mockResolvedValue(offer);
    (prisma.offer.update as vi.Mock).mockResolvedValue({
      ...offer,
      status: 'declined',
      decline_feedback: null,
    });

    const result = await declineOffer('app-decline-nofb', undefined, 'user-decline');

    expect(result.status).toBe('declined');
    expect(result.decline_feedback).toBeNull();
  });

  it('throws notFound when offer does not exist', async () => {
    (prisma.offer.findUnique as vi.Mock).mockResolvedValue(null);

    await expect(declineOffer('ghost-offer', 'fb', 'user')).rejects.toThrow('Offer not found');
  });
});

// ---------------------------------------------------------------------------
// Offer query
// ---------------------------------------------------------------------------

describe('Offer Service — getOfferDetails', () => {
  it('returns offer with application and job context', async () => {
    const offer = {
      id: 'offer-detail-uid',
      application_id: 'app-detail-001',
      role_title: 'Senior Engineer',
      salary: 2000000,
      equity: '0.1%',
      start_date: new Date('2026-11-01'),
      status: 'pending',
      valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      signature_svg: null,
      application: {
        id: 'app-detail-001',
        candidate: {
          user: { email: 'cand@test.com', name: 'Candidate User' },
        },
        job: {
          id: 'job-detail-001',
          title: 'Senior Software Engineer',
          org_id: 'org-detail-001',
        },
      },
    };
    (prisma.offer.findUnique as vi.Mock).mockResolvedValue(offer);

    const result = await getOfferDetails('app-detail-001', 'user-detail', 'candidate');

    expect(result.role_title).toBe('Senior Engineer');
    expect(result.salary).toBe(2000000);
    expect(result.application.job.title).toBe('Senior Software Engineer');
  });

  it('throws notFound when offer not found', async () => {
    (prisma.offer.findUnique as vi.Mock).mockResolvedValue(null);

    await expect(getOfferDetails('ghost-offer-detail', 'user', 'candidate')).rejects.toThrow(
      'Offer not found'
    );
  });

  it('enforces candidate ownership', async () => {
    const offer = {
      id: 'offer-protect-uid',
      application_id: 'app-protect-001',
      status: 'pending',
      application: {
        id: 'app-protect-001',
        candidate: { user_id: 'other-user-uid' },
      },
    };
    (prisma.offer.findUnique as vi.Mock).mockResolvedValue(offer);

    await expect(
      getOfferDetails('app-protect-001', 'imposter-uid', 'candidate')
    ).rejects.toThrow('Not authorized to view this offer');
  });

  it('allows HR access when org matches', async () => {
    const offer = {
      id: 'offer-hr-access-uid',
      application_id: 'app-hr-access-001',
      status: 'pending',
      application: {
        id: 'app-hr-access-001',
        job: { org_id: 'org-hr-001' },
      },
    };
    (prisma.offer.findUnique as vi.Mock).mockResolvedValue(offer);

    const result = await getOfferDetails('app-hr-access-001', 'hr-user', 'hr', 'org-hr-001');

    expect(result.role_title).toBeDefined();
  });
});
