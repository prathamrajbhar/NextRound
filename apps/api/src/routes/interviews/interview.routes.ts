import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@nextround/database';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { enqueueInterview } from '../../lib/queues/interview.queue';
import { decisionQueue } from '../../lib/bullmq';

export const interviewRouter = Router();

// All routes require authentication
interviewRouter.use(authenticate);

// 1. POST /api/v1/interviews/:id/consent
interviewRouter.post('/:id/consent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { videoConsent, audioConsent } = req.body;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            candidate: true,
          },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }

    // Verify candidate ownership if role is candidate
    if (req.user?.role === 'candidate' && interview.application.candidate.user_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = await prisma.interview.update({
      where: { id },
      data: {
        video_consent: typeof videoConsent === 'boolean' ? videoConsent : true,
      },
    });

    return res.json({
      success: true,
      data: {
        interviewId: updated.id,
        video_consent: updated.video_consent,
        consentedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// 2. POST /api/v1/interviews/:id/session-token
interviewRouter.post('/:id/session-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            candidate: true,
            job: true,
          },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }

    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    const sessionToken = `session_token_${interview.id}_${Date.now()}`;

    // Update interview status to in_progress if currently scheduled
    if (interview.status === 'scheduled') {
      await prisma.interview.update({
        where: { id },
        data: { status: 'in_progress' },
      });
    }

    return res.json({
      success: true,
      data: {
        interviewId: interview.id,
        applicationId: interview.application_id,
        sessionToken,
        iceServers,
        jobTitle: interview.application.job.title,
        company: 'NextRound / HireOS',
        expiresInSeconds: 3600,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// 3. POST /api/v1/interviews/:id/end
interviewRouter.post('/:id/end', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { transcript, audio_url } = req.body;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }

    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        status: 'completed',
        ...(transcript ? { transcript } : {}),
        ...(audio_url ? { audio_url } : {}),
      },
    });

    await prisma.application.update({
      where: { id: interview.application_id },
      data: { status: 'interviewed' },
    });

    // Enqueue interview evaluation job
    await enqueueInterview(interview.id, interview.application_id);

    return res.json({
      success: true,
      data: {
        interview: updatedInterview,
        message: 'Interview session completed successfully. AI Evaluation queued.',
      },
    });
  } catch (error) {
    return next(error);
  }
});

// 4. PATCH /api/v1/interviews/:id/proctoring
interviewRouter.patch('/:id/proctoring', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { face_count, gaze_centered, engagement_index, multiple_faces_detected, tab_switch_count } = req.body;

    const interview = await prisma.interview.findUnique({ where: { id } });
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }

    const existingFlags = Array.isArray(interview.proctor_flags) ? (interview.proctor_flags as any[]) : [];
    const newFlag = {
      timestamp: new Date().toISOString(),
      face_count: typeof face_count === 'number' ? face_count : 1,
      gaze_centered: typeof gaze_centered === 'boolean' ? gaze_centered : true,
      engagement_index: typeof engagement_index === 'number' ? engagement_index : 90,
      multiple_faces_detected: Boolean(multiple_faces_detected),
      tab_switch_count: typeof tab_switch_count === 'number' ? tab_switch_count : 0,
    };

    const updatedFlags = [...existingFlags, newFlag];

    const updated = await prisma.interview.update({
      where: { id },
      data: {
        proctor_flags: updatedFlags,
        engagement_signal: {
          last_updated: new Date().toISOString(),
          latest_engagement: newFlag.engagement_index,
          total_events: updatedFlags.length,
        },
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
});

// 5. GET /api/v1/interviews/:id/transcript
interviewRouter.get('/:id/transcript', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            job: true,
            candidate: {
              include: { user: true },
            },
            evaluation: true,
          },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }

    // Security Check: HR access strictly scoped server-side using JWT-derived org_id
    if (req.user?.role === 'hr') {
      if (!req.user.orgId || interview.application.job.org_id !== req.user.orgId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Org isolation boundary violation' });
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
        transcript: interview.transcript || [],
        audio_url: interview.audio_url || null,
        proctor_flags: interview.proctor_flags || [],
        engagement_signal: interview.engagement_signal || null,
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
});

// 6. POST /api/v1/interviews/hr/:applicationId/result
// Require HR role
interviewRouter.post('/hr/:applicationId/result', requireRole('hr'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = req.params.applicationId as string;

    // Security Check: Reject org_id in body/query parameters (403 Forbidden)
    if (req.body.org_id || req.query.org_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: org_id parameter in body/query is strictly forbidden. Server derives org_id from JWT token.',
      });
    }

    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(403).json({ success: false, error: 'HR user must belong to an organization' });
    }

    const { decision, notes } = req.body; // 'pass' | 'fail'

    if (!decision || !['pass', 'fail'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Decision must be "pass" or "fail"' });
    }

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { org_id: orgId },
      },
      include: { job: true },
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found in organization' });
    }

    const hrRoundStatus = decision === 'pass' ? 'passed' : 'failed';
    const nextAppStatus = decision === 'pass' ? 'decided' : 'rejected';

    const updatedApp = await prisma.application.update({
      where: { id: applicationId },
      data: {
        hr_round_status: hrRoundStatus,
        hr_round_completed_at: new Date(),
        status: nextAppStatus,
      },
    });

    // Save decision in evaluation
    await prisma.evaluation.upsert({
      where: { application_id: applicationId },
      create: {
        application_id: applicationId,
        stage: 'hr_round',
        decision: decision === 'pass' ? 'hire' : 'reject',
        reasoning: notes || `HR Video Round completed with decision: ${decision}`,
        bias_flag: false,
      },
      update: {
        stage: 'hr_round',
        decision: decision === 'pass' ? 'hire' : 'reject',
        reasoning: notes || `HR Video Round completed with decision: ${decision}`,
      },
    });

    // If passed, trigger decision queue job
    if (decision === 'pass') {
      await decisionQueue.add('decision_evaluate', {
        applicationId,
        extraData: { hr_notes: notes },
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      });
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
});
