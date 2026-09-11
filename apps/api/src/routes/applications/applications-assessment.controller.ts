import { Request, Response } from 'express';
import { ok } from '../../lib/http';
import * as applicationService from '../../services/application/application.service';

export async function getAptitudeChunk(req: Request, res: Response) {
  const chunkIndex = Math.max(0, parseInt(req.query.chunkIndex as string, 10) || 0);
  const chunkSize = Math.max(1, Math.min(10, parseInt(req.query.chunkSize as string, 10) || 3));
  ok(
    res,
    await applicationService.getAptitudeChunk(req.params.id as string, req.user!.userId, {
      chunkIndex,
      chunkSize,
    })
  );
}

export async function submitAptitudeChunk(req: Request, res: Response) {
  ok(
    res,
    await applicationService.submitAptitudeChunk(req.params.id as string, req.user!.userId, req.body)
  );
}

export async function getAptitudeAssessment(req: Request, res: Response) {
  ok(res, await applicationService.getAptitudeAssessment(req.params.id as string, req.user!.userId));
}

export async function submitAptitude(req: Request, res: Response) {
  const data = await applicationService.submitAptitude(req.params.id as string, req.user!.userId, req.body);
  res.json({ success: true, data });
}

export async function getCodingAssessment(req: Request, res: Response) {
  ok(res, await applicationService.getCodingAssessment(req.params.id as string, req.user!.userId));
}

export async function submitCoding(req: Request, res: Response) {
  ok(res, await applicationService.submitCoding(req.params.id as string, req.user!.userId, req.body));
}

export async function getCodingSubmission(req: Request, res: Response) {
  ok(res, await applicationService.getCodingSubmission(req.params.submissionId as string));
}
