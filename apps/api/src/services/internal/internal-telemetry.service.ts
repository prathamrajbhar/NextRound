import { prisma, Prisma } from '@nextround/database';
import type { AgentStatus } from '@nextround/database';
import { notFound } from '../../lib/http-errors';

export async function createAgentLog(body: Record<string, unknown>) {
  const { job_id, org_id, agent_name, action, input, output, status, error } = body;

  return prisma.agentLog.create({
    data: {
      job_id: (job_id as string) || null,
      org_id: (org_id as string) || null,
      agent_name: (agent_name as string) || 'unknown_agent',
      action: (action as string) || 'processing',
      input: (input ?? Prisma.DbNull) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
      output: (output ?? Prisma.DbNull) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
      status: (status as AgentStatus) || 'running',
      error: (error as string) || null,
    },
  });
}

export async function listAgentLogs() {
  return prisma.agentLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 50,
  });
}

export async function getRawJob(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { organization: { select: { name: true } } },
  });
  if (!job) {
    throw notFound('Job not found');
  }
  return job;
}

export async function getRawApplication(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: {
        include: {
          user: true,
        },
      },
      job: true,
      evaluations: true,
    },
  });
  if (!application) {
    throw notFound('Application not found');
  }
  return application;
}

export async function getRawAnalytics(orgId: string) {
  const jobs = await prisma.job.findMany({
    where: { org_id: orgId },
    include: {
      applications: {
        include: {
          evaluations: true,
          interview: true,
          offer: true,
        },
      },
    },
  });

  return { orgId, jobs };
}

export async function recordAnalyticsReport(body: Record<string, unknown>) {
  const { org_id, report_url, summary, generated_at } = body;

  return prisma.agentLog.create({
    data: {
      org_id: (org_id as string) || null,
      agent_name: 'analytics_agent',
      action: 'report_generated',
      input: { org_id } as Prisma.InputJsonValue,
      output: { report_url, summary, generated_at } as Prisma.InputJsonValue,
      status: 'completed',
    },
  });
}

export async function updateInterviewSentiment(interviewId: string, body: Record<string, unknown>) {
  const id = interviewId;
  const { sentiment_report } = body;

  const interview = await prisma.interview.findUnique({ where: { id } });
  if (!interview) {
    throw notFound('Interview not found');
  }

  return prisma.interview.update({
    where: { id },
    data: {
      sentiment_report: (sentiment_report as Prisma.InputJsonValue) || undefined,
    },
  });
}
