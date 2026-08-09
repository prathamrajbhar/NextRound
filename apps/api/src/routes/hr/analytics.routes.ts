import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { AnalyticsExportQuerySchema } from '@nextround/shared';
import { enqueueAnalyticsReport } from '../../lib/queues/analytics.queue';

export const analyticsRouter = Router();

// Middleware helper to ensure org_id is NOT passed in body or query params
function rejectExplicitOrgId(req: Request, res: Response, next: NextFunction) {
  if ((req.body && req.body.org_id) || (req.query && req.query.org_id)) {
    return res.status(403).json({
      success: false,
      error: 'Security Error: org_id parameter is forbidden in request body/query. Scoped automatically by auth token.',
    });
  }
  next();
}

// GET /api/v1/hr/analytics - Overview metrics, weekly funnel, conversion rates, bias trends
analyticsRouter.get(
  '/',
  authenticate,
  requireRole('hr'),
  rejectExplicitOrgId,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.orgId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
      }

      // Fetch org jobs
      const jobs = await prisma.job.findMany({
        where: { org_id: orgId },
        select: { id: true, status: true },
      });

      const jobIds = jobs.map((j) => j.id);
      const activeJobsCount = jobs.filter((j) => j.status === 'active' || j.status === 'published').length;

      // Fetch applications scoped to org's jobs
      const applications = await prisma.application.findMany({
        where: { job_id: { in: jobIds } },
        select: {
          id: true,
          status: true,
          applied_at: true,
          hr_round_completed_at: true,
          evaluations: { select: { bias_flag: true } },
        },
      });

      const totalApplications = applications.length;

      // Calculate funnel counts
      let applied = 0;
      let screened = 0;
      let interviewed = 0;
      let offered = 0;
      let accepted = 0;

      applications.forEach((app) => {
        applied++;
        if (
          [
            'screening_completed',
            'assessment',
            'interview_scheduled',
            'interviewed',
            'evaluation',
            'hr_round',
            'decided',
            'offered',
            'accepted',
          ].includes(app.status)
        ) {
          screened++;
        }
        if (
          ['interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted'].includes(
            app.status
          )
        ) {
          interviewed++;
        }
        if (['offered', 'accepted'].includes(app.status)) {
          offered++;
        }
        if (app.status === 'accepted') {
          accepted++;
        }
      });

      // Calculate Stage Conversion Rates
      const stageConversionRates = {
        appliedToScreened: applied > 0 ? Math.round((screened / applied) * 100) : 0,
        screenedToInterviewed: screened > 0 ? Math.round((interviewed / screened) * 100) : 0,
        interviewedToOffered: interviewed > 0 ? Math.round((offered / interviewed) * 100) : 0,
        offerAcceptanceRate: offered > 0 ? Math.round((accepted / offered) * 100) : 0,
      };

      // Calculate Average Time-To-Hire (Days from applied_at to hr_round_completed_at or accepted)
      const hireTimeMsList: number[] = [];
      applications.forEach((app) => {
        if (app.hr_round_completed_at) {
          const diff = app.hr_round_completed_at.getTime() - app.applied_at.getTime();
          if (diff > 0) hireTimeMsList.push(diff);
        }
      });
      const avgTimeToHireDays =
        hireTimeMsList.length > 0
          ? Math.round(
              hireTimeMsList.reduce((acc, val) => acc + val, 0) /
                hireTimeMsList.length /
                (1000 * 60 * 60 * 24)
            )
          : 0;

      // Bias Clean Rate calculation
      let totalAudited = 0;
      let biasFlags = 0;
      applications.forEach((app) => {
        if (app.evaluations && app.evaluations.length > 0) {
          totalAudited++;
          if (app.evaluations.some((e) => e.bias_flag)) {
            biasFlags++;
          }
        }
      });
      const biasCleanRatePercent =
        totalAudited > 0 ? Math.round(((totalAudited - biasFlags) / totalAudited) * 100) : 100;

      // Calculate actual weekly metrics based on applied_at timestamps
      const now = new Date();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      const getWeekBucket = (date: Date) => {
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays <= 7) return 3; // Week 4 (most recent)
        if (diffDays <= 14) return 2; // Week 3
        if (diffDays <= 21) return 1; // Week 2
        return 0; // Week 1 (oldest)
      };

      const weeklyCounts = [
        { week: 'Week 1', applied: 0, screened: 0, interviewed: 0, offered: 0 },
        { week: 'Week 2', applied: 0, screened: 0, interviewed: 0, offered: 0 },
        { week: 'Week 3', applied: 0, screened: 0, interviewed: 0, offered: 0 },
        { week: 'Week 4', applied: 0, screened: 0, interviewed: 0, offered: 0 },
      ];

      const weeklyAudits = [
        { week: 'W1', totalAudited: 0, flagsTriggered: 0 },
        { week: 'W2', totalAudited: 0, flagsTriggered: 0 },
        { week: 'W3', totalAudited: 0, flagsTriggered: 0 },
        { week: 'W4', totalAudited: 0, flagsTriggered: 0 },
      ];

      applications.forEach((app) => {
        const bucket = getWeekBucket(app.applied_at);
        weeklyCounts[bucket].applied++;
        if (
          [
            'screening_completed',
            'assessment',
            'interview_scheduled',
            'interviewed',
            'evaluation',
            'hr_round',
            'decided',
            'offered',
            'accepted',
          ].includes(app.status)
        ) {
          weeklyCounts[bucket].screened++;
        }
        if (
          ['interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted'].includes(
            app.status
          )
        ) {
          weeklyCounts[bucket].interviewed++;
        }
        if (['offered', 'accepted'].includes(app.status)) {
          weeklyCounts[bucket].offered++;
        }

        if (app.evaluations && app.evaluations.length > 0) {
          weeklyAudits[bucket].totalAudited++;
          if (app.evaluations.some((e) => e.bias_flag)) {
            weeklyAudits[bucket].flagsTriggered++;
          }
        }
      });

      const weeklyFunnel = weeklyCounts;
      const biasStabilityTrend = weeklyAudits.map((item) => ({
        week: item.week,
        totalAudited: item.totalAudited,
        flagsTriggered: item.flagsTriggered,
        cleanRatePercent:
          item.totalAudited > 0
            ? Math.round(((item.totalAudited - item.flagsTriggered) / item.totalAudited) * 100)
            : 100,
      }));

      // Dropoff Analysis
      const dropoffAnalysis = [
        { stage: 'Screening to Interview', dropCount: Math.max(0, screened - interviewed), percentage: screened > 0 ? Math.round(((screened - interviewed) / screened) * 100) : 0 },
        { stage: 'Interview to Offer', dropCount: Math.max(0, interviewed - offered), percentage: interviewed > 0 ? Math.round(((interviewed - offered) / interviewed) * 100) : 0 },
        { stage: 'Offer to Acceptance', dropCount: Math.max(0, offered - accepted), percentage: offered > 0 ? Math.round(((offered - accepted) / offered) * 100) : 0 },
      ];

      return res.json({
        success: true,
        data: {
          kpis: {
            totalApplications,
            activeJobs: activeJobsCount,
            avgTimeToHireDays,
            offerAcceptanceRatePercent: stageConversionRates.offerAcceptanceRate,
            biasCleanRatePercent,
          },
          weeklyFunnel,
          stageConversionRates,
          biasStabilityTrend,
          dropoffAnalysis,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/hr/analytics/export - Export CSV or trigger PDF report download
analyticsRouter.get(
  '/export',
  authenticate,
  requireRole('hr'),
  rejectExplicitOrgId,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.orgId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
      }

      const parsed = AnalyticsExportQuerySchema.safeParse(req.query);
      const format = parsed.success ? parsed.data.format : 'csv';

      if (format === 'csv') {
        const jobs = await prisma.job.findMany({
          where: { org_id: orgId },
          select: { id: true },
        });
        const jobIds = jobs.map((j) => j.id);

        const apps = await prisma.application.findMany({
          where: { job_id: { in: jobIds } },
          select: { status: true },
        });

        const totalApplied = apps.length;
        const totalScreened = apps.filter((a) =>
          [
            'screening_completed',
            'assessment',
            'interview_scheduled',
            'interviewed',
            'evaluation',
            'hr_round',
            'decided',
            'offered',
            'accepted',
          ].includes(a.status)
        ).length;
        const totalInterviewed = apps.filter((a) =>
          ['interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted'].includes(a.status)
        ).length;
        const totalOffered = apps.filter((a) => ['offered', 'accepted'].includes(a.status)).length;
        const totalAccepted = apps.filter((a) => a.status === 'accepted').length;

        const screenedRate = totalApplied > 0 ? Math.round((totalScreened / totalApplied) * 100) : 0;
        const interviewedRate = totalScreened > 0 ? Math.round((totalInterviewed / totalScreened) * 100) : 0;
        const offeredRate = totalInterviewed > 0 ? Math.round((totalOffered / totalInterviewed) * 100) : 0;
        const acceptedRate = totalOffered > 0 ? Math.round((totalAccepted / totalOffered) * 100) : 0;

        const csvContent =
          `Stage,Total Count,Conversion Rate (%)\n` +
          `Applied,${totalApplied},100%\n` +
          `Screened,${totalScreened},${screenedRate}%\n` +
          `Interviewed,${totalInterviewed},${interviewedRate}%\n` +
          `Offered,${totalOffered},${offeredRate}%\n` +
          `Accepted,${totalAccepted},${acceptedRate}%\n`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${Date.now()}.csv"`);
        return res.send(csvContent);
      }

      // PDF format: return the latest report the Analytics Agent actually
      // generated for this org, or queue a real generation job and report an
      // honest 202. Never hand back a self-referencing fake download URL.
      const latestReport = await prisma.agentLog.findFirst({
        where: { org_id: orgId, action: 'report_generated' },
        orderBy: { created_at: 'desc' },
      });
      const output = latestReport?.output && typeof latestReport.output === 'object'
        ? (latestReport.output as { report_url?: unknown })
        : undefined;
      const reportUrl = output?.report_url;

      if (latestReport && typeof reportUrl === 'string' && reportUrl.trim().length > 0) {
        return res.json({
          success: true,
          data: {
            reportUrl,
            format: 'pdf',
            generatedAt: latestReport.created_at.toISOString(),
          },
        });
      }

      await enqueueAnalyticsReport({ orgId, type: 'manual_export', format: 'pdf' });
      return res.status(202).json({
        success: true,
        data: {
          status: 'generating',
          message: 'Analytics PDF generation queued; it will be available shortly.',
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);
