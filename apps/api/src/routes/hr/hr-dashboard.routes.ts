import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope, rejectOrgIdParam } from '../../middleware/orgScope';
import { serializeApplicationList } from '../../lib/serializers';

export const hrDashboardRouter = Router();

// Org scoping is JWT-derived; never accept a client-supplied org_id.
hrDashboardRouter.use(rejectOrgIdParam);

// GET /api/v1/hr/dashboard - Aggregated HR KPI metrics & active job pipeline status
hrDashboardRouter.get(
  '/dashboard',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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