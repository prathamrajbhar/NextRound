import { Request, Response } from 'express';
import { ok } from '../../lib/http';
import * as internalService from '../../services/internal.service';

export async function patchAiAssistResult(req: Request, res: Response) {
  ok(res, await internalService.recordAiAssistResult(req.params.id as string, req.body));
}

export async function patchScreeningResult(req: Request, res: Response) {
  const data = await internalService.recordScreeningResult(req.params.id as string, req.body);
  ok(res, data);
}

export async function postSourcedCandidates(req: Request, res: Response) {
  const job = await internalService.recordSourcedCandidates(req.params.jobId as string, req.body);
  ok(res, job);
}

export async function postScheduleSlots(req: Request, res: Response) {
  const data = await internalService.recordScheduleSlots(req.params.id as string, req.body);
  ok(res, data);
}

export async function patchConfirmedSlot(req: Request, res: Response) {
  const data = await internalService.confirmInterviewSlot(req.params.id as string, req.body);
  ok(res, data);
}

export async function patchAssessmentResult(req: Request, res: Response) {
  const data = await internalService.recordAssessmentResult(req.params.id as string, req.body);
  ok(res, data);
}

export async function getAssessmentData(req: Request, res: Response) {
  const testType = (req.query.type as string) || 'aptitude';
  ok(res, await internalService.getAssessmentData(req.params.id as string, testType));
}

export async function patchCodingResult(req: Request, res: Response) {
  const data = await internalService.recordCodingResult(req.params.id as string, req.body);
  ok(res, data);
}

export async function patchInterviewResult(req: Request, res: Response) {
  const data = await internalService.recordInterviewResult(req.params.id as string, req.body);
  ok(res, data);
}

export async function patchFinalEvaluation(req: Request, res: Response) {
  ok(res, await internalService.recordFinalEvaluation(req.body));
}

export async function patchDecision(req: Request, res: Response) {
  const data = await internalService.applyDecision(req.params.id as string, req.body);
  ok(res, data);
}

export async function postInternalOffer(req: Request, res: Response) {
  ok(res, await internalService.createInternalOffer(req.body), 201);
}
