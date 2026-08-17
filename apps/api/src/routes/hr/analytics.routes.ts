import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { rejectOrgIdParam } from '../../middleware/orgScope';
import { AnalyticsExportQuerySchema } from '@nextround/shared';
import { enqueueAnalyticsReport } from '../../lib/queues/analytics.queue';

export const analyticsRouter = Router();

analyticsRouter.use(rejectOrgIdParam);

analyticsRouter.get(
  '/',
  authenticate,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.orgId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
      }

      const jobs = await prisma.job.findMany({
        where: { org_id: orgId },
        select: { id: true, status: true },
      });

      const jobIds = jobs.map((j) => j.id);
      const activeJobsCount = jobs.filter((j) => j.status === 'active' || j.status === 'published').length;

      const applications = await prisma.application.findMany({
        where: { job_id: { in: jobIds } },
        select: {
          id: true,
          status: true,
          applied_at: true,
          hr_round_completed_at: true,
        },
      });

      const totalApplications = applications.length;

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

      const stageConversionRates = {
        appliedToScreened: applied > 0 ? Math.round((screened / applied) * 100) : 0,
        screenedToInterviewed: screened > 0 ? Math.round((interviewed / screened) * 100) : 0,
        interviewedToOffered: interviewed > 0 ? Math.round((offered / interviewed) * 100) : 0,
        offerAcceptanceRate: offered > 0 ? Math.round((accepted / offered) * 100) : 0,
      };

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

      const now = new Date();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      const getWeekBucket = (date: Date) => {
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays <= 7) return 3;
        if (diffDays <= 14) return 2;
        if (diffDays <= 21) return 1;
        return 0;
      };

      const weeklyCounts = [
        { week: 'Week 1', applied: 0, screened: 0, interviewed: 0, offered: 0 },
        { week: 'Week 2', applied: 0, screened: 0, interviewed: 0, offered: 0 },
        { week: 'Week 3', applied: 0, screened: 0, interviewed: 0, offered: 0 },
        { week: 'Week 4', applied: 0, screened: 0, interviewed: 0, offered: 0 },
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
      });

      const weeklyFunnel = weeklyCounts;

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
          },
          weeklyFunnel,
          stageConversionRates,
          dropoffAnalysis,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

analyticsRouter.get(
  '/export',
  authenticate,
  requireRole('hr'),
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
