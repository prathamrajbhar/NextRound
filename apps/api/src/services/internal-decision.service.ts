import { prisma } from '@nextround/database';
import type { EvaluationDecision } from '@nextround/database';
import { emailService } from './email.service';
import { upsertOffer } from './offer.service';
import { notFound, badRequest } from '../lib/http-errors';

export async function recordFinalEvaluation(body: Record<string, unknown>) {
  const { application_id, composite_score, confidence, reasoning } = body;

  const existing = application_id
    ? await prisma.evaluation.findFirst({ where: { application_id: application_id as string } })
    : null;

  const evaluation = existing
    ? await prisma.evaluation.update({
        where: { id: existing.id },
        data: {
          composite_score: typeof composite_score === 'number' ? composite_score : undefined,
          confidence: typeof confidence === 'number' ? confidence : undefined,
          stage: 'final_evaluation',
          reasoning: (reasoning as string) || undefined,
        },
      })
    : await prisma.evaluation.create({
        data: {
          application_id: application_id as string,
          composite_score: typeof composite_score === 'number' ? composite_score : null,
          confidence: typeof confidence === 'number' ? confidence : 1.0,
          stage: 'final_evaluation',
          reasoning: (reasoning as string) || 'Evaluation completed by Evaluator Agent',
        },
      });

  const conf = typeof confidence === 'number' ? confidence : 1.0;
  if (conf < 0.7) {
    const app = await prisma.application.findUnique({
      where: { id: application_id as string },
      include: {
        job: { include: { organization: { include: { users: true } } } },
        candidate: { include: { user: true } },
      },
    });

    if (app) {
      const hrEmails = app.job.organization.users
        .filter((user) => user.role === 'hr')
        .map((user) => user.email);
      const candidateName = app.candidate.user.email.split('@')[0];
      if (hrEmails.length > 0) {
        await emailService.sendHRHoldAlert(hrEmails, candidateName, application_id as string, conf);
      }
    }
  }

  return { evaluation, status: 'hr_round', queuedDecision: false };
}

export async function applyDecision(evaluationId: string, body: Record<string, unknown>) {
  const id = evaluationId;
  const {
    application_id,
    decision,
    decision_rationale,
    offer_letter_content,
    rejection_email_content,
  } = body;

  const decisionVal: EvaluationDecision = decision === 'hire' ? 'hire' : decision === 'reject' ? 'reject' : 'hold_for_review';
  const decisionData = { decision: decisionVal, reasoning: (decision_rationale as string) || undefined };

  let evaluation = await prisma.evaluation.findUnique({ where: { id } });
  if (evaluation) {
    evaluation = await prisma.evaluation.update({ where: { id }, data: decisionData });
  } else if (application_id) {
    const existingAppEval = await prisma.evaluation.findFirst({ where: { application_id: application_id as string } });
    if (existingAppEval) {
      evaluation = await prisma.evaluation.update({ where: { id: existingAppEval.id }, data: decisionData });
    } else {
      evaluation = await prisma.evaluation.create({
        data: { application_id: application_id as string, stage: 'final_review', ...decisionData },
      });
    }
  }

  const app = await prisma.application.findUnique({
    where: { id: application_id as string },
    include: { job: true, candidate: { include: { user: true } } },
  });

  if (!app) throw notFound('Application not found');

  if (decision === 'hire') {
    const { offer, isNew } = await upsertOffer({
      applicationId: app.id,
      job: app.job,
      offerLetterContent: offer_letter_content as string | null,
    });

    await prisma.application.update({ where: { id: app.id }, data: { status: 'offered' } });

    if (isNew) {
      const candidateName = app.candidate.user.email.split('@')[0];
      await emailService.sendOfferEmail(app.candidate.user.email, candidateName, app.job.title, {
        salary: offer.salary,
        equity: offer.equity ?? undefined,
        magicLinkToken: offer.magic_link_token!,
      });
    }

    return { evaluation, offer, status: 'offered' };
  } else if (decision === 'reject') {
    await prisma.application.update({ where: { id: app.id }, data: { status: 'rejected' } });

    const candidateName = app.candidate.user.email.split('@')[0];
    await emailService.sendConstructiveRejection(
      app.candidate.user.email,
      candidateName,
      app.job.title,
      ['System Architecture', 'Algorithmic Optimization'],
      (rejection_email_content as string) ||
        'Thank you for interviewing with us. Based on our evaluation criteria, we are unable to extend an offer at this time.'
    );

    return { evaluation, status: 'rejected' };
  } else {
    await prisma.application.update({ where: { id: app.id }, data: { status: 'evaluation' } });
    return { evaluation, status: 'hold_for_review' };
  }
}

export async function createInternalOffer(body: Record<string, unknown>) {
  const {
    application_id,
    role_title,
    salary,
    equity,
    start_date,
    offer_letter_content,
  } = body;

  if (!application_id) throw badRequest('application_id is required');

  const app = await prisma.application.findUnique({
    where: { id: application_id as string },
    include: { job: true },
  });

  if (!app) throw notFound('Application not found');

  const { offer } = await upsertOffer({
    applicationId: application_id as string,
    job: app.job,
    roleTitle: role_title as string | null,
    salary: typeof salary === 'number' ? salary : null,
    equity: (equity as string) || null,
    startDate: (start_date as string) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    offerLetterContent: offer_letter_content as string | null,
  });

  return offer;
}
