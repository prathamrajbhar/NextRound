import { prisma } from '../lib/prisma';
import { forbidden, notFound } from '../lib/http-errors';
import { logger } from '../lib/logger';
import type { CreateSessionInput } from './proctoring.types';
import { analyzeSessionRisk } from './proctoring-reporting.service';

export async function requireSessionOwnership(sessionId: string, userId: string) {
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

  analyzeSessionRisk(sessionId).catch((error) => {
    logger.child('Proctoring').error(`Background risk analysis error for session ${sessionId}:`, error);
  });

  return updatedSession;
}
