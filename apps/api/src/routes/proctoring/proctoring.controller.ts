import { Request, Response } from 'express';
import { ok } from '../../lib/http';
import { forbidden } from '../../lib/http-errors';
import * as proctoringService from '../../services/proctoring/proctoring.service';

export async function createSession(req: Request, res: Response) {
  const session = await proctoringService.createProctoringSession(req.body, req.user!.userId);
  ok(res, session, 201);
}

export async function logBatchEvents(req: Request, res: Response) {
  const result = await proctoringService.logProctoringEvents(
    req.params['id'] as string,
    req.body.events,
    req.user!.userId
  );
  ok(res, result);
}

export async function sendHeartbeat(req: Request, res: Response) {
  const session = await proctoringService.updateHeartbeat(req.params['id'] as string, req.user!.userId);
  ok(res, session);
}

export async function pauseSession(req: Request, res: Response) {
  const session = await proctoringService.pauseProctoringSession(req.params['id'] as string, req.user!.userId);
  ok(res, session);
}

export async function resumeSession(req: Request, res: Response) {
  const session = await proctoringService.resumeProctoringSession(req.params['id'] as string, req.user!.userId);
  ok(res, session);
}

export async function endSession(req: Request, res: Response) {
  const session = await proctoringService.endProctoringSession(req.params['id'] as string, req.user!.userId);
  ok(res, session);
}

export async function uploadRecording(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No recording file uploaded' });
  }
  const body = req.body as { duration_ms?: number | null };
  const session = await proctoringService.saveProctoringRecording(
    req.params['id'] as string,
    req.user!.userId,
    req.file.buffer,
    {
      mimeType: req.file.mimetype,
      durationMs: body.duration_ms ?? undefined,
    }
  );
  return ok(res, { session_id: session.id, recording_url: session.recording_url }, 201);
}

export async function uploadEvidence(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No evidence file uploaded' });
  }
  const body = req.body as { width?: number; height?: number };
  const evidence = await proctoringService.saveProctoringSnapshot(
    req.params['id'] as string,
    req.user!.userId,
    req.file.buffer,
    {
      mimeType: req.file.mimetype,
      width: body.width ?? undefined,
      height: body.height ?? undefined,
    }
  );
  return ok(res, { evidence_id: evidence.id, url: evidence.url }, 201);
}

export async function getSessionReport(req: Request, res: Response) {
  const report = await proctoringService.getProctoringReport(
    req.params['id'] as string,
    req.user!.role,
    req.user!.orgId,
    req.user!.userId
  );
  ok(res, report);
}

export async function getApplicationReport(req: Request, res: Response) {
  const report = await proctoringService.getProctoringReportByApplicationId(
    req.params['applicationId'] as string,
    req.user!.role,
    req.user!.orgId,
    req.user!.userId
  );
  if (!report) {
    ok(res, null);
  } else {
    ok(res, report);
  }
}

export async function reviewViolation(req: Request, res: Response) {
  if (req.user!.role !== 'hr') {
    throw forbidden('Access denied: HR role required for violation review');
  }
  const result = await proctoringService.reviewProctoringViolation(
    req.params['id'] as string,
    req.body.status,
    req.body.review_reason,
    req.user!.userId,
    req.user!.orgId ?? null
  );
  ok(res, result);
}
