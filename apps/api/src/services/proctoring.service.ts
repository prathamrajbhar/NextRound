import { prisma } from '../lib/prisma';
import { Prisma } from '@nextround/database';
import { getPolicy, evaluateSessionPolicy } from './proctoring-policy.service';
import { logger } from '../lib/logger';
import { uploadFile } from '../lib/storage';
import { forbidden, notFound, badRequest } from '../lib/http-errors';

interface CreateSessionInput {
  id: string;
  candidate_id: string;
  session_type: 'aptitude' | 'coding' | 'video' | 'interview';
  assessment_id?: string | null;
  application_id?: string | null;
  mock_session_id?: string | null;
  policy_version: string;
  consent_version: string;
}

interface EventInput {
  client_event_id: string;
  client_sequence: number;
  kind: string;
  severity: 'info' | 'warning' | 'low' | 'medium' | 'high';
  source: string;
  client_timestamp: string;
  session_elapsed_ms: number;
  payload_json?: any | null;
}

export async function createProctoringSession(input: CreateSessionInput, userId: string) {
  
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { user_id: userId },
  });

  if (!candidateProfile || candidateProfile.id !== input.candidate_id) {
    throw forbidden('Access denied: Candidate profile mismatch');
  }

  
  if (input.application_id) {
    const app = await prisma.application.findUnique({
      where: { id: input.application_id },
    });
    if (!app || app.candidate_id !== candidateProfile.id) {
      throw forbidden('Access denied: Application does not belong to candidate');
    }
  }

  if (input.mock_session_id) {
    const mockSession = await prisma.mockSession.findUnique({
      where: { id: input.mock_session_id },
    });
    if (!mockSession || mockSession.candidate_id !== candidateProfile.id) {
      throw forbidden('Access denied: Mock session does not belong to candidate');
    }
  }

  if (input.assessment_id) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: input.assessment_id },
    });
    if (!assessment) {
      throw notFound('Assessment not found');
    }
  }

  
  const session = await prisma.proctoringSession.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      candidate_id: input.candidate_id,
      session_type: input.session_type,
      assessment_id: input.assessment_id || null,
      application_id: input.application_id || null,
      mock_session_id: input.mock_session_id || null,
      status: 'active',
      policy_version: input.policy_version,
      consent_version: input.consent_version,
      started_at: new Date(),
    },
    update: {
      status: 'active',
      ended_at: null,
    },
  });

  return session;
}

export async function logProctoringEvents(sessionId: string, events: EventInput[], userId: string) {
  
  const session = await prisma.proctoringSession.findUnique({
    where: { id: sessionId },
    include: { candidate: true },
  });

  if (!session) {
    throw notFound('Proctoring session not found');
  }

  if (session.candidate.user_id !== userId) {
    throw forbidden('Access denied: Unauthorized access to session');
  }

  if (session.status === 'ended') {
    throw badRequest('Cannot log events: Proctoring session has already ended');
  }

  
  const clientEventIds = events.map((e) => e.client_event_id);
  const existingEvents = await prisma.proctoringEvent.findMany({
    where: {
      proctoring_session_id: sessionId,
      client_event_id: { in: clientEventIds },
    },
    select: { client_event_id: true },
  });

  const existingIds = new Set(existingEvents.map((e) => e.client_event_id));
  const newEvents = events.filter((e) => !existingIds.has(e.client_event_id));

  if (newEvents.length === 0) {
    return { count: 0 };
  }

  
  const maxSeqAggregate = await prisma.proctoringEvent.aggregate({
    where: { proctoring_session_id: sessionId },
    _max: { server_sequence: true },
  });
  const startSeq = (maxSeqAggregate._max.server_sequence ?? 0) + 1;

  
  const dataToInsert = newEvents.map((event, idx) => ({
    proctoring_session_id: sessionId,
    client_event_id: event.client_event_id,
    client_sequence: event.client_sequence,
    server_sequence: startSeq + idx,
    kind: event.kind,
    severity: event.severity,
    source: event.source,
    client_timestamp: new Date(event.client_timestamp),
    session_elapsed_ms: event.session_elapsed_ms,
    payload_json: event.payload_json ?? {},
  }));

  await prisma.proctoringEvent.createMany({
    data: dataToInsert,
    skipDuplicates: true,
  });

  return { count: newEvents.length };
}

export async function updateHeartbeat(sessionId: string, userId: string) {
  const session = await prisma.proctoringSession.findUnique({
    where: { id: sessionId },
    include: { candidate: true },
  });

  if (!session) {
    throw notFound('Proctoring session not found');
  }

  if (session.candidate.user_id !== userId) {
    throw forbidden('Access denied');
  }

  return prisma.proctoringSession.update({
    where: { id: sessionId },
    data: { last_heartbeat_at: new Date() },
  });
}

export async function pauseProctoringSession(sessionId: string, userId: string) {
  const session = await prisma.proctoringSession.findUnique({
    where: { id: sessionId },
    include: { candidate: true },
  });

  if (!session) {
    throw notFound('Proctoring session not found');
  }

  if (session.candidate.user_id !== userId) {
    throw forbidden('Access denied');
  }

  return prisma.proctoringSession.update({
    where: { id: sessionId },
    data: { status: 'paused' },
  });
}

export async function resumeProctoringSession(sessionId: string, userId: string) {
  const session = await prisma.proctoringSession.findUnique({
    where: { id: sessionId },
    include: { candidate: true },
  });

  if (!session) {
    throw notFound('Proctoring session not found');
  }

  if (session.candidate.user_id !== userId) {
    throw forbidden('Access denied');
  }

  return prisma.proctoringSession.update({
    where: { id: sessionId },
    data: { status: 'active' },
  });
}

export async function endProctoringSession(sessionId: string, userId: string) {
  const session = await prisma.proctoringSession.findUnique({
    where: { id: sessionId },
    include: { candidate: true },
  });

  if (!session) {
    throw notFound('Proctoring session not found');
  }

  if (session.candidate.user_id !== userId) {
    throw forbidden('Access denied');
  }

  const updatedSession = await prisma.proctoringSession.update({
    where: { id: sessionId },
    data: {
      status: 'ended',
      ended_at: new Date(),
    },
  });

  
  analyzeSessionRisk(sessionId).catch((err) => {
    logger.child('Proctoring').error(`Background risk analysis error for session ${sessionId}:`, err);
  });

  return updatedSession;
}

export async function saveProctoringRecording(
  sessionId: string,
  userId: string,
  buffer: Buffer,
  opts: { mimeType?: string; durationMs?: number }
) {
  const session = await requireSessionOwnership(sessionId, userId);

  const mimeType = opts.mimeType || 'audio/webm';
  const ext = mimeType.includes('wav') ? 'wav' : mimeType.includes('ogg') ? 'ogg' : 'webm';
  const ts = Date.now();
  const key = `audio/proctor-${sessionId}-${ts}.${ext}`;
  const url = await uploadFile(key, buffer, mimeType);

  const updated = await prisma.proctoringSession.update({
    where: { id: sessionId },
    data: {
      recording_url: url,
      recording_duration_ms: opts.durationMs ?? null,
      recording_size_bytes: buffer.length,
    },
  });

  await prisma.proctoringEvidence.create({
    data: {
      proctoring_session_id: sessionId,
      kind: 'audio_recording',
      mime_type: mimeType,
      url,
      size_bytes: buffer.length,
      captured_at: new Date(),
      payload_json: { duration_ms: opts.durationMs ?? null } as Prisma.InputJsonValue,
    },
  });

  return updated;
}

export async function saveProctoringSnapshot(
  sessionId: string,
  userId: string,
  buffer: Buffer,
  opts: { mimeType?: string; width?: number; height?: number; payload?: Record<string, unknown> }
) {
  const session = await requireSessionOwnership(sessionId, userId);

  const mimeType = opts.mimeType || 'image/jpeg';
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const ts = Date.now();
  const key = `video/proctor-${sessionId}-snap-${ts}.${ext}`;
  const url = await uploadFile(key, buffer, mimeType);

  return prisma.proctoringEvidence.create({
    data: {
      proctoring_session_id: sessionId,
      kind: 'camera_snapshot',
      mime_type: mimeType,
      url,
      size_bytes: buffer.length,
      width: opts.width ?? null,
      height: opts.height ?? null,
      captured_at: new Date(),
      payload_json: (opts.payload ?? {}) as Prisma.InputJsonValue,
    },
  });
}

async function requireSessionOwnership(sessionId: string, userId: string) {
  const session = await prisma.proctoringSession.findUnique({
    where: { id: sessionId },
    include: { candidate: true },
  });

  if (!session) {
    throw notFound('Proctoring session not found');
  }

  if (session.candidate.user_id !== userId) {
    throw forbidden('Access denied: Unauthorized access to session');
  }

  return session;
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
      violations.map((v) =>
        prisma.proctoringViolation.upsert({
          where: {
            proctoring_session_id_rule_code: {
              proctoring_session_id: sessionId,
              rule_code: v.rule_code,
            },
          },
          create: {
            proctoring_session_id: sessionId,
            rule_code: v.rule_code,
            severity: v.severity,
            occurrence_count: v.occurrence_count,
            first_seen_at: v.first_seen_at,
            last_seen_at: v.last_seen_at,
            status: 'pending_review',
          },
          update: {
            occurrence_count: v.occurrence_count,
            last_seen_at: v.last_seen_at,
            severity: v.severity,
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

export function computeRiskScore(
  violations: Array<{ severity: string; occurrence_count: number }>
): number {
  const weights: Record<string, number> = { high: 40, medium: 20, low: 5 };
  let raw = 0;
  for (const v of violations) {
    const weight = weights[v.severity] ?? 0;
    raw += weight * Math.min(v.occurrence_count, 3);
  }
  return Math.min(100, Math.round(raw));
}

export async function getProctoringReport(sessionId: string, role: string, userOrgId?: string | null, userId?: string) {
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
    evidence: session.evidence.map((e) => ({
      id: e.id,
      kind: e.kind,
      mime_type: e.mime_type,
      url: e.url,
      size_bytes: e.size_bytes,
      width: e.width,
      height: e.height,
      captured_at: e.captured_at,
      payload_json: e.payload_json,
    })),
    violations: session.violations,
    events: session.events.map((e) => ({
      id: e.id,
      kind: e.kind,
      severity: e.severity,
      source: e.source,
      client_timestamp: e.client_timestamp,
      session_elapsed_ms: e.session_elapsed_ms,
      payload_json: e.payload_json,
    })),
  };
}

export async function getProctoringReportByApplicationId(applicationId: string, role: string, userOrgId?: string | null, userId?: string) {
  
  const session = await prisma.proctoringSession.findFirst({
    where: { application_id: applicationId },
    orderBy: { started_at: 'desc' },
  });

  if (!session) {
    return null;
  }

  return getProctoringReport(session.id, role, userOrgId, userId);
}

export async function reviewProctoringViolation(
  violationId: string,
  status: 'acknowledged' | 'false_positive' | 'escalated' | 'resolved',
  reviewReason: string,
  reviewerId: string,
  userOrgId: string | null
) {
  const violation = await prisma.proctoringViolation.findUnique({
    where: { id: violationId },
    include: {
      proctoring_session: {
        include: {
          application: {
            include: {
              job: { select: { org_id: true } },
            },
          },
        },
      },
    },
  });

  if (!violation) {
    throw notFound('Proctoring violation not found');
  }

  
  const violationOrgId = violation.proctoring_session.application?.job.org_id;
  if (!userOrgId || violationOrgId !== userOrgId) {
    throw forbidden('Access denied: Org isolation violation');
  }

  
  const updatedViolation = await prisma.proctoringViolation.update({
    where: { id: violationId },
    data: {
      status,
      review_reason: reviewReason,
      reviewer_id: reviewerId,
    },
  });

  return updatedViolation;
}
