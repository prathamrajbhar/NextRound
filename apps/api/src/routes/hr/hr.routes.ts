import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope } from '../../middleware/orgScope';
import { serializeApplicationList } from '../../lib/serializers';
import { deriveSalary, deriveEquity } from '../../lib/offer-terms';
import { emailService } from '../../services/email.service';

export const hrRouter = Router();

// Helper to check parameter pollution / spoofing attempt
function checkOrgParamPollution(req: Request, res: Response): boolean {
  if (req.body && (req.body.org_id || req.body.orgId)) {
    res.status(403).json({ success: false, error: 'Forbidden: org_id cannot be supplied in body' });
    return true;
  }
  if (req.query && (req.query.org_id || req.query.orgId)) {
    res.status(403).json({ success: false, error: 'Forbidden: org_id cannot be supplied in query' });
    return true;
  }
  return false;
}

// GET /api/v1/hr/dashboard - Aggregated HR KPI metrics & active job pipeline status
hrRouter.get(
  '/dashboard',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const orgId = req.user!.orgId!;

      // Active jobs count
      const activeJobsCount = await prisma.job.count({
        where: {
          org_id: orgId,
          status: { in: ['published', 'active'] },
        },
      });

      // Total applicants for org's jobs
      const totalApplicantsCount = await prisma.application.count({
        where: {
          job: { org_id: orgId },
        },
      });

      // Pending interviews count
      const pendingInterviewsCount = await prisma.interview.count({
        where: {
          status: 'scheduled',
          application: {
            job: { org_id: orgId },
          },
        },
      });

      // Compute stage distribution across org jobs
      const applications = await prisma.application.findMany({
        where: {
          job: { org_id: orgId },
        },
        select: { status: true },
      });

      const stageDistribution: Record<string, number> = {
        applied: 0,
        screening: 0,
        screening_completed: 0,
        assessment: 0,
        interview_scheduled: 0,
        interviewed: 0,
        evaluation: 0,
        hr_round: 0,
        decided: 0,
        offered: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0,
      };

      applications.forEach((app) => {
        const stageKey = app.status as string;
        stageDistribution[stageKey] = (stageDistribution[stageKey] || 0) + 1;
      });

      // Fetch recent agent activities for org
      const agentLogs = await prisma.agentLog.findMany({
        where: { org_id: orgId },
        orderBy: { created_at: 'desc' },
        take: 5,
      });

      const recentActivity = agentLogs.map((log) => ({
        id: log.id,
        type: log.agent_name,
        description: `${log.action}: ${log.status}`,
        timestamp: log.created_at.toISOString(),
      }));

      // Compute avg time-to-hire in days
      const hrCompletedApps = await prisma.application.findMany({
        where: {
          job: { org_id: orgId },
          hr_round_completed_at: { not: null },
        },
        select: { applied_at: true, hr_round_completed_at: true },
      });

      const hireTimes = hrCompletedApps
        .map((a) => a.hr_round_completed_at!.getTime() - a.applied_at.getTime())
        .filter((t) => t > 0);

      const avgTimeToHireDays =
        hireTimes.length > 0
          ? Math.round(hireTimes.reduce((acc, val) => acc + val, 0) / hireTimes.length / (1000 * 60 * 60 * 24))
          : 0;

      // Decision counts (hire/hold/reject) by evaluation decision
      const decidedEvals = await prisma.evaluation.findMany({
        where: {
          application: { job: { org_id: orgId } },
          decision: { in: ['hire', 'hold_for_review', 'reject'] },
        },
        select: { decision: true },
      });

      const decisionsCount = {
        hire: decidedEvals.filter((e) => e.decision === 'hire').length,
        hold: decidedEvals.filter((e) => e.decision === 'hold_for_review').length,
        reject: decidedEvals.filter((e) => e.decision === 'reject').length,
      };

      // Recent applications with relations for candidate/job context
      const recentApps = await prisma.application.findMany({
        where: { job: { org_id: orgId } },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
              organization: { select: { id: true, name: true, logo_url: true } },
            },
          },
          candidate: {
            select: {
              id: true,
              user: { select: { email: true } },
              skills: true,
              target_roles: true,
              resume_url: true,
            },
          },
          evaluations: true,
          interview: true,
          offer: true,
        },
        orderBy: { applied_at: 'desc' },
        take: 10,
      });

      const pipelineSummary = Object.entries(stageDistribution)
        .map(([stage, count]) => ({ stage, count }))
        .slice(0, 8);

      return res.json({
        success: true,
        data: {
          kpis: {
            activeJobs: activeJobsCount,
            totalApplicants: totalApplicantsCount,
            avgTimeToHireDays,
            pendingInterviews: pendingInterviewsCount,
          },
          stageDistribution,
          recentActivity,
          activeJobsCount,
          totalApplicationsCount: totalApplicantsCount,
          decisionsCount,
          recentApplications: serializeApplicationList(recentApps),
          pipelineSummary,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/hr/hold-queue - Fetch applications on hold for manual HR review
hrRouter.get(
  '/hold-queue',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const orgId = req.user!.orgId!;

      const items = await prisma.application.findMany({
        where: {
          job: { org_id: orgId },
          evaluations: {
            some: {
              decision: 'hold_for_review',
            },
          },
        },
        include: {
          job: { select: { id: true, title: true } },
          candidate: {
            include: {
              user: { select: { id: true, email: true } },
            },
          },
          evaluations: true,
        },
        orderBy: { applied_at: 'desc' },
      });

      return res.json({
        success: true,
        data: { holdQueue: items },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/v1/hr/evaluations/:id/hr-override - HR manual decision override
hrRouter.patch(
  '/evaluations/:id/hr-override',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const orgId = req.user!.orgId!;
      const evalId = req.params.id as string;
      const { decision, notes } = req.body; // 'hire' | 'reject'

      if (!decision || !['hire', 'reject'].includes(decision)) {
        return res.status(400).json({ success: false, error: 'decision must be hire or reject' });
      }

      const evaluation = await prisma.evaluation.findUnique({
        where: { id: evalId },
        include: {
          application: {
            include: {
              job: true,
              candidate: { include: { user: true } },
            },
          },
        },
      });

      if (!evaluation) {
        return res.status(404).json({ success: false, error: 'Evaluation not found' });
      }

      if (evaluation.application.job.org_id !== orgId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }

      // Update evaluation with HR override
      const updatedEvaluation = await prisma.evaluation.update({
        where: { id: evalId },
        data: {
          decision: decision === 'hire' ? 'hire' : 'reject',
          reasoning: notes ? `HR Override: ${notes}` : `HR Override applied: ${decision}`,
        },
      });

      const appId = evaluation.application_id;
      const nextStatus = decision === 'hire' ? 'offered' : 'rejected';

      // Derive offer terms from the Job BEFORE mutating state so a job with no
      // salary never leaves an 'offered' application without an honest offer.
      const job = evaluation.application.job;
      const offerSalary = decision === 'hire' ? deriveSalary(job.salary) : null;
      const offerEquity = decision === 'hire' ? deriveEquity(job) : null;

      if (decision === 'hire' && offerSalary === null) {
        return res.status(422).json({
          success: false,
          error: `Cannot generate an offer for "${job.title}": the job has no salary configured. Add a salary to the job before hiring.`,
        });
      }

      await prisma.application.update({
        where: { id: appId },
        data: { status: nextStatus },
      });

      if (decision === 'hire') {
        // Idempotent offer creation: application_id is unique, so an existing offer
        // (e.g. from a retried decision) is updated in place, keeping its magic link token.
        const magicToken = crypto.randomUUID();
        const offer = await prisma.offer.upsert({
          where: { application_id: appId },
          create: {
            application_id: appId,
            role_title: job.title,
            salary: offerSalary as number,
            equity: offerEquity,
            magic_link_token: magicToken,
            offer_letter_content: `Official Job Offer for ${job.title} (Approved by HR Override)`,
            status: 'pending',
            valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          update: {
            role_title: job.title,
            salary: offerSalary as number,
            equity: offerEquity,
            offer_letter_content: `Official Job Offer for ${job.title} (Approved by HR Override)`,
            status: 'pending',
            valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });

        // Only email the candidate when a brand-new offer was created (token freshly generated)
        const isNewOffer = offer.magic_link_token === magicToken;
        if (isNewOffer) {
          const candidateName = evaluation.application.candidate.user.email.split('@')[0];
          await emailService.sendOfferEmail(
            evaluation.application.candidate.user.email,
            candidateName,
            job.title,
            { salary: offerSalary as number, equity: offerEquity ?? undefined, magicLinkToken: magicToken }
          );
        }

        return res.json({
          success: true,
          data: { evaluation: updatedEvaluation, offer, status: 'offered' },
        });
      } else {
        const candidateName = evaluation.application.candidate.user.email.split('@')[0];
        await emailService.sendConstructiveRejection(
          evaluation.application.candidate.user.email,
          candidateName,
          evaluation.application.job.title,
          ['System Design', 'Algorithmic Efficiency'],
          notes || 'Thank you for interviewing with us. Following our HR review, we are unable to proceed at this time.'
        );

        return res.json({
          success: true,
          data: { evaluation: updatedEvaluation, status: 'rejected' },
        });
      }
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/hr/evaluations/:id/bias-report - Fetch bias audit report for an evaluation
hrRouter.get(
  '/evaluations/:id/bias-report',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const orgId = req.user!.orgId!;
      const evalId = req.params.id as string;

      const evaluation = await prisma.evaluation.findUnique({
        where: { id: evalId },
        include: {
          application: {
            include: { job: true },
          },
        },
      });

      if (!evaluation) {
        return res.status(404).json({ success: false, error: 'Evaluation not found' });
      }

      if (evaluation.application.job.org_id !== orgId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }

      return res.json({
        success: true,
        data: {
          evaluationId: evaluation.id,
          biasFlag: evaluation.bias_flag,
          biasReport: evaluation.bias_report,
          confidence: evaluation.confidence,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

