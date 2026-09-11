import { prisma } from '../../lib/prisma';
import { Prisma } from '@nextround/database';
import { uploadFile } from '../../lib/storage';
import { forbidden, notFound, badRequest } from '../../lib/http-errors';
import type { EventInput } from './proctoring.types';
import { requireSessionOwnership } from './proctoring-session.service';

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

  const clientEventIds = events.map((event) => event.client_event_id);
  const existingEvents = await prisma.proctoringEvent.findMany({
    where: {
      proctoring_session_id: sessionId,
      client_event_id: { in: clientEventIds },
    },
    select: { client_event_id: true },
  });

  const existingIds = new Set(existingEvents.map((event) => event.client_event_id));
  const newEvents = events.filter((event) => !existingIds.has(event.client_event_id));

  if (newEvents.length === 0) {
    return { count: 0 };
  }

  const maxSeqAggregate = await prisma.proctoringEvent.aggregate({
    where: { proctoring_session_id: sessionId },
    _max: { server_sequence: true },
  });
  const startSeq = (maxSeqAggregate._max.server_sequence ?? 0) + 1;

  const dataToInsert = newEvents.map((event, index) => ({
    proctoring_session_id: sessionId,
    client_event_id: event.client_event_id,
    client_sequence: event.client_sequence,
    server_sequence: startSeq + index,
    kind: event.kind,
    severity: event.severity,
    source: event.source,
    client_timestamp: new Date(event.client_timestamp),
    session_elapsed_ms: event.session_elapsed_ms,
    payload_json: (event.payload_json ?? {}) as Prisma.InputJsonValue,
  }));

  await prisma.proctoringEvent.createMany({
    data: dataToInsert,
    skipDuplicates: true,
  });

  return { count: newEvents.length };
}

export async function saveProctoringRecording(
  sessionId: string,
  userId: string,
  buffer: Buffer,
  options: { mimeType?: string; durationMs?: number }
) {
  await requireSessionOwnership(sessionId, userId);

  const mimeType = options.mimeType || 'audio/webm';
  const ext = mimeType.includes('wav') ? 'wav' : mimeType.includes('ogg') ? 'ogg' : 'webm';
  const timestamp = Date.now();
  const key = `audio/proctor-${sessionId}-${timestamp}.${ext}`;
  const url = await uploadFile(key, buffer, mimeType);

  const updated = await prisma.proctoringSession.update({
    where: { id: sessionId },
    data: {
      recording_url: url,
      recording_duration_ms: options.durationMs ?? null,
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
      payload_json: { duration_ms: options.durationMs ?? null } as Prisma.InputJsonValue,
    },
  });

  return updated;
}

export async function saveProctoringSnapshot(
  sessionId: string,
  userId: string,
  buffer: Buffer,
  options: { mimeType?: string; width?: number; height?: number; payload?: Record<string, unknown> }
) {
  await requireSessionOwnership(sessionId, userId);

  const mimeType = options.mimeType || 'image/jpeg';
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const timestamp = Date.now();
  const key = `video/proctor-${sessionId}-snap-${timestamp}.${ext}`;
  const url = await uploadFile(key, buffer, mimeType);

  return prisma.proctoringEvidence.create({
    data: {
      proctoring_session_id: sessionId,
      kind: 'camera_snapshot',
      mime_type: mimeType,
      url,
      size_bytes: buffer.length,
      width: options.width ?? null,
      height: options.height ?? null,
      captured_at: new Date(),
      payload_json: (options.payload ?? {}) as Prisma.InputJsonValue,
    },
  });
}
