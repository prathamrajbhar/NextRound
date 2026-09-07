import { Request, Response } from 'express';
import { serializeOffer } from '../../lib/serializers';
import { ok } from '../../lib/http';
import * as applicationService from '../../services/application/application.service';
import { userCtx } from './applications.controller';

export async function getOfferByToken(req: Request, res: Response) {
  ok(res, await applicationService.getOfferByToken(req.params.token as string));
}

export async function getApplicationOffer(req: Request, res: Response) {
  const { application, offer } = await applicationService.getApplicationOffer(
    req.params.id as string,
    userCtx(req)
  );
  ok(res, serializeOffer(offer, application));
}

export async function signOffer(req: Request, res: Response) {
  ok(
    res,
    await applicationService.signOffer(req.params.id as string, req.body, req.user ? userCtx(req) : null)
  );
}

export async function declineOffer(req: Request, res: Response) {
  ok(
    res,
    await applicationService.declineOffer(
      req.params.id as string,
      req.body,
      req.user ? userCtx(req) : null
    )
  );
}
