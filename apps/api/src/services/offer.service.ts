import crypto from 'crypto';
import { prisma } from '@nextround/database';
import { deriveSalary, deriveEquity } from '../lib/offer-terms';

export interface OfferDraftInput {
  applicationId: string;
  /** The Job the offer is for; salary/equity are derived from it when no explicit override is given. */
  job: { title: string; salary: string | null | undefined; thresholds?: unknown };
  /** Explicit overrides, honored as real caller inputs when provided. */
  roleTitle?: string | null;
  salary?: number | null;
  equity?: string | null;
  startDate?: string | null;
  offerLetterContent?: string | null;
}

export interface OfferDraftResult {
  offer: Awaited<ReturnType<typeof prisma.offer.upsert>>;
  /** True only when a brand-new offer was created (fresh magic-link token minted). */
  isNew: boolean;
}

export class NoSalaryConfiguredError extends Error {
  statusCode = 422;
}

/**
 * Idempotent offer creation: derive offer terms from the Job record (never
 * fabricating fallbacks), refuse when the Job genuinely has no salary, and
 * upsert on `application_id` so a retried decision updates the existing offer
 * (keeping its magic-link token) instead of crashing on the unique constraint.
 *
 * Returns the offer plus whether it was freshly created. Throws
 * `NoSalaryConfiguredError` (422) when no salary can be derived and none was
 * provided explicitly.
 */
export async function upsertOffer(input: OfferDraftInput): Promise<OfferDraftResult> {
  const { applicationId, job } = input;

  const salary = typeof input.salary === 'number' ? input.salary : deriveSalary(job.salary);
  if (salary === null) {
    throw new NoSalaryConfiguredError(
      `Cannot generate an offer for "${job.title}": the job has no salary configured. Add a salary to the job before generating an offer.`
    );
  }

  const roleTitle = (input.roleTitle && input.roleTitle.trim()) || job.title;
  const equity = input.equity || deriveEquity(job);
  const offerLetterContent = input.offerLetterContent || `Official Offer for ${job.title}`;
  const startDate = input.startDate ? new Date(input.startDate) : null;
  const magicToken = crypto.randomUUID();
  const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const offer = await prisma.offer.upsert({
    where: { application_id: applicationId },
    create: {
      application_id: applicationId,
      role_title: roleTitle,
      salary,
      equity,
      ...(startDate ? { start_date: startDate } : {}),
      offer_letter_content: offerLetterContent,
      magic_link_token: magicToken,
      status: 'pending',
      valid_until: validUntil,
    },
    update: {
      role_title: roleTitle,
      salary,
      equity,
      ...(startDate ? { start_date: startDate } : {}),
      offer_letter_content: offerLetterContent,
      status: 'pending',
      valid_until: validUntil,
    },
  });

  return { offer, isNew: offer.magic_link_token === magicToken };
}
