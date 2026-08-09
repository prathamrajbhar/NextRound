import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope } from '../../middleware/orgScope';
import { serializeApplicationList } from '../../lib/serializers';
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

// GET /api/v1/hr/analytics - Funnel conversion, bias audits, time-to-hire trends
hrRouter.get(
  '/analytics',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const orgId = req.user!.orgId!;

      // Fetch evaluations to compute bias metrics
      const evaluations = await prisma.evaluation.findMany({
        where: {
          application: {
            job: { org_id: orgId },
          },
        },
        select: {
          id: true,
          bias_flag: true,
        },
      });

      const totalAudited = evaluations.length;
      const biasFlagsTriggered = evaluations.filter((e) => e.bias_flag).length;
      const cleanRatePercent = totalAudited > 0
        ? Math.round(((totalAudited - biasFlagsTriggered) / totalAudited) * 100)
        : 100;

      // Fetch applications with applied_at to compute actual weekly funnel
      const allApps = await prisma.application.findMany({
        where: { job: { org_id: orgId } },
        select: { status: true, applied_at: true },
      });

      const now = new Date();
      const getWeekBucket = (date: Date) => {
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays <= 7) return 3; // Week 4
        if (diffDays <= 14) return 2; // Week 3
        if (diffDays <= 21) return 1; // Week 2
        return 0; // Week 1
      };

      const weeklyFunnel = [
        { week: 'Week 1', applied: 0, screened: 0, interviewed: 0, offered: 0 },
        { week: 'Week 2', applied: 0, screened: 0, interviewed: 0, offered: 0 },
        { week: 'Week 3', applied: 0, screened: 0, interviewed: 0, offered: 0 },
        { week: 'Week 4', applied: 0, screened: 0, interviewed: 0, offered: 0 },
      ];

      allApps.forEach((app) => {
        const bucket = getWeekBucket(app.applied_at);
        weeklyFunnel[bucket].applied++;
        if (['screening_completed', 'assessment', 'interview_scheduled', 'interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted'].includes(app.status)) {
          weeklyFunnel[bucket].screened++;
        }
        if (['interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted'].includes(app.status)) {
          weeklyFunnel[bucket].interviewed++;
        }
        if (['offered', 'accepted'].includes(app.status)) {
          weeklyFunnel[bucket].offered++;
        }
      });

      const totalApps = allApps.length;
      const screenedApps = allApps.filter((a) => !['applied', 'rejected', 'withdrawn'].includes(a.status)).length;
      const interviewedApps = allApps.filter((a) => ['interview_scheduled', 'interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted'].includes(a.status)).length;
      const offeredApps = allApps.filter((a) => ['offered', 'accepted'].includes(a.status)).length;

      return res.json({
        success: true,
        data: {
          weeklyFunnel,
          stageConversionRates: {
            appliedToScreened: totalApps > 0 ? Math.round((screenedApps / totalApps) * 100) : 0,
            screenedToInterviewed: screenedApps > 0 ? Math.round((interviewedApps / screenedApps) * 100) : 0,
            interviewedToOffered: interviewedApps > 0 ? Math.round((offeredApps / interviewedApps) * 100) : 0,
          },
          biasReportSummary: {
            totalAudited,
            biasFlagsTriggered,
            cleanRatePercent,
          },
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
            role_title: evaluation.application.job.title,
            salary: 150000,
            equity: '0.15% ESOPs',
            magic_link_token: magicToken,
            offer_letter_content: `Official Job Offer for ${evaluation.application.job.title} (Approved by HR Override)`,
            status: 'pending',
            valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          update: {
            role_title: evaluation.application.job.title,
            salary: 150000,
            equity: '0.15% ESOPs',
            offer_letter_content: `Official Job Offer for ${evaluation.application.job.title} (Approved by HR Override)`,
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
            evaluation.application.job.title,
            { salary: 150000, equity: '0.15% ESOPs', magicLinkToken: magicToken }
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

