import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AnalyticsExportQuerySchema } from '@nextround/shared';
import { enqueueAnalyticsReport } from '../../lib/queues/analytics.queue';

export async function exportAnalytics(req: Request, res: Response, next: NextFunction) {
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
      const jobIds = jobs.map((job) => job.id);

      const applications = await prisma.application.findMany({
        where: { job_id: { in: jobIds } },
        select: { status: true },
      });

      const totalApplied = applications.length;
      const totalScreened = applications.filter((application) =>
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
        ].includes(application.status)
      ).length;
      const totalInterviewed = applications.filter((application) =>
        ['interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted'].includes(application.status)
      ).length;
      const totalOffered = applications.filter((application) =>
        ['offered', 'accepted'].includes(application.status)
      ).length;
      const totalAccepted = applications.filter((application) => application.status === 'accepted').length;

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
  } catch (error) {
    return next(error);
  }
}
