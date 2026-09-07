import { prisma } from '../../lib/prisma';
import { Prisma } from '@nextround/database';
import { getPolicy, evaluateSessionPolicy } from './proctoring-policy.service';
import { forbidden, notFound } from '../../lib/http-errors';
import { reviewProctoringViolation } from './proctoring-violation.service';

export { reviewProctoringViolation };

export function computeRiskScore(
  violations: Array<{ severity: string; occurrence_count: number }>
): number {
  const weights: Record<string, number> = { high: 40, medium: 20, low: 5 };
  let raw = 0;
  for (const violation of violations) {
    const weight = weights[violation.severity] ?? 0;
    raw += weight * Math.min(violation.occurrence_count, 3);
  }
  return Math.min(100, Math.round(raw));
}

export async function analyzeSessionRisk(sessionId: string) {
  const session = await prisma.proctoringSession.findUnique({
    where: { id: sessionId },
    include: { events: true },
  });

  if (!session) return;

  const policy = getPolicy(session.policy_version);
  const { violations, summary } = evaluateSessionPolicy(policy, session.events);

  if (violations.length > 0) {
    await prisma.$transaction(
      violations.map((violation) =>
        prisma.proctoringViolation.upsert({
          where: {
            proctoring_session_id_rule_code: {
              proctoring_session_id: sessionId,
              rule_code: violation.rule_code,
            },
          },
          create: {
            proctoring_session_id: sessionId,
            rule_code: violation.rule_code,
            severity: violation.severity,
            occurrence_count: violation.occurrence_count,
            first_seen_at: violation.first_seen_at,
            last_seen_at: violation.last_seen_at,
            status: 'pending_review',
          },
          update: {
            occurrence_count: violation.occurrence_count,
            last_seen_at: violation.last_seen_at,
            severity: violation.severity,
          },
        })
      )
    );
  }

  const riskScore = computeRiskScore(violations);

  await prisma.proctoringSession.update({
    where: { id: sessionId },
    data: {
      risk_score: riskScore,
      summary_json: summary as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function getProctoringReport(
  sessionId: string,
  role: string,
  userOrgId?: string | null,
  userId?: string
) {
  const session = await prisma.proctoringSession.findUnique({
    where: { id: sessionId },
    include: {
      candidate: { include: { user: { select: { email: true } } } },
      events: { orderBy: { server_sequence: 'asc' } },
      violations: true,
      evidence: { orderBy: { captured_at: 'asc' } },
      application: {
        include: {
          job: { select: { org_id: true } },
        },
      },
    },
  });

  if (!session) {
    throw notFound('Proctoring session not found');
  }

  if (role === 'hr') {
    if (!userOrgId || session.application?.job.org_id !== userOrgId) {
      throw forbidden('Access denied: Org isolation violation');
    }
  } else if (role === 'candidate') {
    if (session.candidate.user_id !== userId) {
      throw forbidden('Access denied: Candidate profile mismatch');
    }
  }

  return {
    session: {
      id: session.id,
      session_type: session.session_type,
      status: session.status,
      started_at: session.started_at,
      ended_at: session.ended_at,
      last_heartbeat_at: session.last_heartbeat_at,
      candidate_email: session.candidate.user.email,
    },
    risk_score: session.risk_score,
    summary: session.summary_json,
    recording: session.recording_url
      ? {
          url: session.recording_url,
          duration_ms: session.recording_duration_ms,
          size_bytes: session.recording_size_bytes,
        }
      : null,
    evidence: session.evidence.map((ev) => ({
      id: ev.id,
      kind: ev.kind,
      mime_type: ev.mime_type,
      url: ev.url,
      size_bytes: ev.size_bytes,
      width: ev.width,
      height: ev.height,
      captured_at: ev.captured_at,
      payload_json: ev.payload_json,
    })),
    violations: session.violations,
    events: session.events.map((ev) => ({
      id: ev.id,
      kind: ev.kind,
      severity: ev.severity,
      source: ev.source,
      client_timestamp: ev.client_timestamp,
      session_elapsed_ms: ev.session_elapsed_ms,
      payload_json: ev.payload_json,
    })),
  };
}

export async function getProctoringReportByApplicationId(
  applicationId: string,
  role: string,
  userOrgId?: string | null,
  userId?: string
) {
  const session = await prisma.proctoringSession.findFirst({
    where: { application_id: applicationId },
    orderBy: { started_at: 'desc' },
  });

  if (!session) {
    return null;
  }

  return getProctoringReport(session.id, role, userOrgId, userId);
}
