import { Request, Response, NextFunction } from 'express';
import { Prisma, prisma } from '@nextround/database';
import { ConsentBodySchema, EndInterviewBodySchema } from '../../validators/interview.schemas';
import { findInterviewByRef, loadIceServers } from './interviews.helpers';
import { enqueueInterview } from '../../lib/queues/interview.queue';

export async function recordConsent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params['id']);
    const body = ConsentBodySchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.flatten() });
    }

    const interview = await findInterviewByRef({
      idOrApplicationId: id,
      include: { application: { include: { candidate: true } } },
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }

    if (
      req.user?.role === 'candidate' &&
      interview.application.candidate.user_id !== req.user.userId
    ) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const consentedAt = new Date().toISOString();
    const existingSignal =
      interview.engagement_signal !== null &&
      typeof interview.engagement_signal === 'object' &&
      !Array.isArray(interview.engagement_signal)
        ? (interview.engagement_signal as Record<string, unknown>)
        : {};

    await prisma.interview.update({
      where: { id: interview.id },
      data: {
        engagement_signal: {
          ...existingSignal,
          consent: {
            video: body.data.videoConsent,
            audio: body.data.audioConsent,
            recorded_at: consentedAt,
          },
        } as Prisma.InputJsonValue,
      },
    });

    return res.json({
      success: true,
      data: {
        interviewId: interview.id,
        videoConsent: body.data.videoConsent,
        audioConsent: body.data.audioConsent,
        consentedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getSessionToken(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params['id']);

    const interview = await findInterviewByRef({
      idOrApplicationId: id,
      include: {
        application: {
          include: {
            candidate: true,
            job: { include: { organization: true } },
          },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }

    if (interview.status === 'scheduled') {
      await prisma.interview.update({
        where: { id: interview.id },
        data: { status: 'in_progress' },
      });
    }

    return res.json({
      success: true,
      data: {
        interviewId: interview.id,
        applicationId: interview.application_id,
        sessionToken: null,
        expiresInSeconds: null,
        iceServers: loadIceServers(),
        jobTitle: interview.application.job.title,
        company: interview.application.job.organization?.name ?? null,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function endInterview(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params['id']);
    const body = EndInterviewBodySchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.flatten() });
    }

    const interview = await findInterviewByRef({
      idOrApplicationId: id,
      include: { application: true },
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }

    const { transcript, audio_url } = body.data;

    const updatedInterview = await prisma.interview.update({
      where: { id: interview.id },
      data: {
        status: 'completed',
        ...(transcript !== undefined ? { transcript: transcript as Prisma.InputJsonValue } : {}),
        ...(audio_url ? { audio_url } : {}),
      },
    });

    await prisma.application.update({
      where: { id: interview.application_id },
      data: { status: 'interviewed' },
    });

    await enqueueInterview(interview.id, interview.application_id, { transcript, audio_url });

    return res.json({
      success: true,
      data: {
        interview: updatedInterview,
        message: 'Interview session completed. AI Evaluation queued.',
      },
    });
  } catch (error) {
    return next(error);
  }
}
