import { Request, Response } from 'express';
import { serializeApplication, serializeApplicationList } from '../../lib/serializers';
import { ok } from '../../lib/http';
import * as applicationService from '../../services/application.service';
import type { AppUserCtx } from '../../services/application.service';

export function userCtx(req: Request): AppUserCtx {
  const u = req.user!;
  return { userId: u.userId, role: u.role, orgId: u.orgId, email: u.email };
}

export async function applyToJob(req: Request, res: Response) {
  ok(res, await applicationService.applyToJob(userCtx(req), req.body), 201);
}

export async function listMyApplications(req: Request, res: Response) {
  const applications = await applicationService.listCandidateApplications(req.user!.userId);
  if (applications === null) {
    return ok(res, { applications: [] });
  }
  return ok(res, serializeApplicationList(applications));
}

export async function listOrgApplications(req: Request, res: Response) {
  const orgId = req.user!.orgId!;
  const jobId = req.query.jobId as string | undefined;
  ok(res, serializeApplicationList(await applicationService.listOrgApplications(orgId, jobId)));
}

export async function getApplication(req: Request, res: Response) {
  const { application, scheduledSlots } = await applicationService.getApplication(
    req.params.id as string,
    userCtx(req)
  );
  ok(res, serializeApplication(application, { scheduledSlots }));
}

export async function runScreening(req: Request, res: Response) {
  const { application: updatedApp, evaluation } = await applicationService.runScreening(
    req.params.id as string,
    userCtx(req)
  );
  ok(res, { application: serializeApplication(updatedApp), evaluation });
}

export async function overrideStatus(req: Request, res: Response) {
  ok(res, await applicationService.overrideStatus(req.params.id as string, req.user!.orgId!, req.body));
}

export async function advanceStage(req: Request, res: Response) {
  const { application } = await applicationService.advanceStage(
    req.params.id as string,
    req.user!.orgId!,
    req.body
  );
  ok(res, serializeApplication(application));
}

export async function scheduleInterview(req: Request, res: Response) {
  ok(
    res,
    await applicationService.scheduleInterview(req.params.id as string, userCtx(req), req.body)
  );
}

export async function withdrawApplication(req: Request, res: Response) {
  ok(res, await applicationService.withdrawApplication(req.params.id as string, req.user!.userId));
}

export async function requestReschedule(req: Request, res: Response) {
  const data = await applicationService.requestReschedule(req.params.id as string, req.user!.userId);
  res.json({ success: true, ...data });
}
