import { Request, Response, NextFunction } from 'express';
import { findInterviewByRef } from './interviews.helpers';
import { getCandidateInterviewContext, buildContextText } from '../../services/candidate/candidate-context.service';

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
