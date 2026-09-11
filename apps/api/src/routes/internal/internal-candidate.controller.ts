import { Request, Response } from 'express';
import { ok } from '../../lib/http';
import { badRequest } from '../../lib/http-errors';
import * as internalService from '../../services/internal/internal.service';

export async function patchCandidateEmbedding(req: Request, res: Response) {
  const data = await internalService.updateCandidateEmbedding(req.params.id as string, req.body);
  ok(res, data);
}

export async function postAgentLog(req: Request, res: Response) {
  ok(res, await internalService.createAgentLog(req.body), 201);
}

export async function getAgentLogs(_req: Request, res: Response) {
  ok(res, await internalService.listAgentLogs());
}

export async function getRawJob(req: Request, res: Response) {
  ok(res, await internalService.getRawJob(req.params.id as string));
}

export async function getRawApplication(req: Request, res: Response) {
  ok(res, await internalService.getRawApplication(req.params.id as string));
}

export async function getCandidateSections(req: Request, res: Response) {
  ok(res, await internalService.getCandidateSections(req.params.id as string));
}

export async function postCandidateEmbeddings(req: Request, res: Response) {
  const data = await internalService.saveCandidateEmbeddings(req.params.id as string, req.body);
  ok(res, data);
}

export async function deleteCandidateSocial(req: Request, res: Response) {
  const data = await internalService.deleteCandidateSocialSource(
    req.params.id as string,
    req.params.source as 'github' | 'linkedin'
  );
  ok(res, data);
}

export async function getCandidateContext(req: Request, res: Response) {
  const jobId = req.query.jobId as string | undefined;
  if (!jobId) {
    throw badRequest('jobId is required');
  }
  ok(res, await internalService.getCandidateInterviewContextInternal(req.params.id as string, jobId));
}

export async function patchMockFeedback(req: Request, res: Response) {
  const data = await internalService.recordMockFeedback(req.params.id as string, req.body);
  ok(res, data);
}

export async function patchResumeBuilderResult(req: Request, res: Response) {
  const data = await internalService.recordResumeBuilderResult(
    req.params.sessionId as string,
    req.body
  );
  ok(res, data);
}

export async function postPrepGenerate(req: Request, res: Response) {
  ok(res, await internalService.generatePrepContent(req.body));
}

export async function getRawAnalytics(req: Request, res: Response) {
  const orgId = req.query.org_id as string | undefined;
  if (!orgId) {
    throw badRequest('org_id is required');
  }
  ok(res, await internalService.getRawAnalytics(orgId));
}

export async function postAnalyticsReport(req: Request, res: Response) {
  ok(res, await internalService.recordAnalyticsReport(req.body), 201);
}

export async function patchInterviewSentiment(req: Request, res: Response) {
  const interview = await internalService.updateInterviewSentiment(
    req.params.id as string,
    req.body
  );
  ok(res, { interview });
}
