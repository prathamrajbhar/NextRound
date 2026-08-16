import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@nextround/database';
import { prisma } from '@nextround/database';
import { enqueueInterview } from '../../lib/queues/interview.queue';
import { enqueueDecision } from '../../lib/queues/decision.queue';
import {
  ConsentBodySchema,
  EndInterviewBodySchema,
  HrResultBodySchema,
  ProctoringFlagBodySchema,
} from '../../validators/interview.schemas';
import {
  computeCompositeScore,
  findInterviewByRef,
  loadIceServers,
} from './interviews.helpers';
import { getCandidateInterviewContext, buildContextText } from '../../services/candidate-context.service';











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










export async function recordProctoringFlag(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params['id']);
    const body = ProctoringFlagBodySchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.flatten() });
    }

    const interview = await findInterviewByRef({ idOrApplicationId: id });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }

    const existingFlags = Array.isArray(interview.proctor_flags)
      ? (interview.proctor_flags as Prisma.JsonValue[])
      : [];

    const newFlag = {
      timestamp: new Date().toISOString(),
      face_count: body.data.face_count ?? null,
      gaze_centered: body.data.gaze_centered ?? null,
      engagement_index: body.data.engagement_index ?? null,
      multiple_faces_detected: body.data.multiple_faces_detected ?? null,
      tab_switch_count: body.data.tab_switch_count ?? null,
    };

    const updatedFlags: Prisma.JsonValue[] = [...existingFlags, newFlag as Prisma.JsonValue];

    const updated = await prisma.interview.update({
      where: { id: interview.id },
      data: {
        proctor_flags: updatedFlags as Prisma.InputJsonValue,
        engagement_signal: {
          last_updated: newFlag.timestamp,
          latest_engagement: newFlag.engagement_index,
          total_events: updatedFlags.length,
        } as Prisma.InputJsonValue,
      },
    });

    return res.json({
      success: true,
      data: {
        interviewId: updated.id,
        proctor_flag_count: updatedFlags.length,
      },
    });
  } catch (error) {
    return next(error);
  }
}









export async function getTranscript(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params['id']);

    const interview = await findInterviewByRef({
      idOrApplicationId: id,
      include: {
        application: {
          include: {
            job: true,
            candidate: { include: { user: true } },
            evaluation: true,
          },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }

    
    if (req.user?.role === 'hr') {
      if (!req.user.orgId || interview.application.job.org_id !== req.user.orgId) {
        return res
          .status(403)
          .json({ success: false, error: 'Forbidden: Org isolation boundary violation' });
      }
    } else if (req.user?.role === 'candidate') {
      if (interview.application.candidate.user_id !== req.user.userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }
    }

    return res.json({
      success: true,
      data: {
        interviewId: interview.id,
        applicationId: interview.application_id,
        status: interview.status,
        transcript: interview.transcript ?? [],
        audio_url: interview.audio_url ?? null,
        proctor_flags: interview.proctor_flags ?? [],
        engagement_signal: interview.engagement_signal ?? null,
        scheduled_at: interview.scheduled_at,
        created_at: interview.created_at,
        evaluation: interview.application.evaluation,
        candidateName: interview.application.candidate.user.email,
        jobTitle: interview.application.job.title,
      },
    });
  } catch (error) {
    return next(error);
  }
}










export async function saveHrResult(req: Request, res: Response, next: NextFunction) {
  try {
    const applicationId = String(req.params['applicationId']);
    const orgId = req.user?.orgId;

    if (!orgId) {
      return res
        .status(403)
        .json({ success: false, error: 'HR user must belong to an organization' });
    }

    const body = HrResultBodySchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.flatten() });
    }

    const { decision, notes } = body.data;

    
    const application = await prisma.application.findFirst({
      where: { id: applicationId, job: { org_id: orgId } },
      include: { job: true },
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found in organization' });
    }

    const hrRoundStatus = decision === 'pass' ? ('passed' as const) : ('failed' as const);
    const nextAppStatus = decision === 'pass' ? ('decided' as const) : ('rejected' as const);

    const [updatedApp, evaluation] = await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: {
          hr_round_status: hrRoundStatus,
          hr_round_completed_at: new Date(),
          status: nextAppStatus,
        },
      }),
      prisma.evaluation.upsert({
        where: { application_id: applicationId },
        create: {
          application_id: applicationId,
          stage: 'hr_round',
          decision: decision === 'pass' ? 'hire' : 'reject',
          reasoning: notes ?? `HR Video Round completed with decision: ${decision}`,
        },
        update: {
          stage: 'hr_round',
          decision: decision === 'pass' ? 'hire' : 'reject',
          reasoning: notes ?? `HR Video Round completed with decision: ${decision}`,
        },
      }),
    ]);

    if (decision === 'pass') {
      const compositeScore = computeCompositeScore(evaluation);
      const confidence = typeof evaluation.confidence === 'number' ? evaluation.confidence : 0.95;

      await enqueueDecision(
        applicationId,
        evaluation.id,
        compositeScore ?? undefined,
        confidence,
        { hr_notes: notes },
      );
    }

    return res.json({
      success: true,
      data: {
        application: updatedApp,
        message: `HR Video Round decision saved as ${decision}.`,
      },
    });
  } catch (error) {
    return next(error);
  }
}




export async function sendSignal(req: Request, res: Response, next: NextFunction) {
  try {
    const applicationId = String(req.params['id']);
    const { sender, message } = req.body;

    if (!sender || !message) {
      return res.status(400).json({ success: false, error: 'sender and message are required' });
    }

    const signal = await prisma.webRTCSignal.create({
      data: {
        application_id: applicationId,
        sender,
        message: message as any,
      },
    });

    return res.json({ success: true, data: signal });
  } catch (error) {
    return next(error);
  }
}




export async function getSignals(req: Request, res: Response, next: NextFunction) {
  try {
    const applicationId = String(req.params['id']);
    const since = req.query['since'] ? new Date(String(req.query['since'])) : new Date(Date.now() - 10000);

    const signals = await prisma.webRTCSignal.findMany({
      where: {
        application_id: applicationId,
        created_at: { gt: since },
      },
      orderBy: { created_at: 'asc' },
    });

    
    prisma.webRTCSignal.deleteMany({
      where: {
        application_id: applicationId,
        created_at: { lt: new Date(Date.now() - 300000) },
      },
    }).catch(err => console.error('Failed to clean up old signaling messages:', err));

    return res.json({ success: true, data: signals });
  } catch (error) {
    return next(error);
  }
}


export async function getInterviewContext(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params['id']);

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

    const candidateId = interview.application.candidate_id;
    const jobId = interview.application.job_id;

    const context = await getCandidateInterviewContext(candidateId, jobId);
    const contextText = buildContextText(context);

    return res.json({
      success: true,
      data: { context, contextText },
    });
  } catch (error) {
    return next(error);
  }
}
