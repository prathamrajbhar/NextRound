import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@nextround/database';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { rejectOrgIdParam } from '../../middleware/orgScope';
import { enqueueInterview } from '../../lib/queues/interview.queue';
import { enqueueDecision } from '../../lib/queues/decision.queue';

// ICE servers for the WebRTC session are env-configurable. The dev default is
// the public Google STUN list; no TURN credentials are invented. A production
// deployment supplies its own ICE_SERVERS JSON (array of { urls, username?,
// credential? }), otherwise only the configured/default STUN servers are used.
function loadIceServers(): { urls: string; username?: string; credential?: string }[] {
  const raw = process.env.ICE_SERVERS;
  if (raw && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (s): s is { urls: string; username?: string; credential?: string } =>
            typeof s === 'object' && s !== null && typeof (s as { urls?: unknown }).urls === 'string'
        );
      }
    } catch (err) {
      console.error('Failed to parse ICE_SERVERS env var; using STUN defaults:', err);
    }
  }
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];
}

export const interviewRouter = Router();

// All routes require authentication; org scoping is JWT-derived, never client-supplied.
interviewRouter.use(authenticate);
interviewRouter.use(rejectOrgIdParam);

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
            job: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }

    const iceServers = loadIceServers();

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
        // No real session credential exists here (nothing consumes one), so the
        // field is null rather than a fabricated token, and there is no expiry.
        sessionToken: null,
        expiresInSeconds: null,
        iceServers,
        jobTitle: interview.application.job.title,
        company: interview.application.job.organization?.name ?? null,
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

    // Enqueue interview evaluation job with the transcript so the Interviewer
    // Agent scores the real conversation (never an empty history).
    await enqueueInterview(interview.id, interview.application_id, {
      transcript,
      audio_url,
    });

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
    // Absent CV signals are stored as null (unknown), never rewritten to
    // compliant values — an unmeasured signal must not become a clean audit flag.
    const newFlag = {
      timestamp: new Date().toISOString(),
      face_count: typeof face_count === 'number' ? face_count : null,
      gaze_centered: typeof gaze_centered === 'boolean' ? gaze_centered : null,
      engagement_index: typeof engagement_index === 'number' ? engagement_index : null,
      multiple_faces_detected: typeof multiple_faces_detected === 'boolean' ? multiple_faces_detected : null,
      tab_switch_count: typeof tab_switch_count === 'number' ? tab_switch_count : null,
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
    const hrEvaluation = await prisma.evaluation.upsert({
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

    // If passed, trigger the Decision Agent with the Evaluator's real composite
    // so offers/holds reflect an actual score instead of a 0/1.0 default.
    if (decision === 'pass') {
      let compositeScore = hrEvaluation.composite_score ?? null;
      let confidence = hrEvaluation.confidence ?? 0.95;
      if (compositeScore === null) {
        // Fall back to the weighted composite of the per-stage scores.
        const parts = [
          ['resume_score', 0.2],
          ['aptitude_score', 0.2],
          ['coding_score', 0.3],
          ['interview_score', 0.3],
        ] as const;
        const weights = parts.map(([k, w]) => {
          const v = hrEvaluation[k];
          return typeof v === 'number' ? v * w : 0;
        });
        const totalWeight = parts.reduce((s, [, w]) => s + w, 0);
        compositeScore = totalWeight > 0 ? weights.reduce((s, v) => s + v, 0) / totalWeight : null;
      }

      await enqueueDecision(
        applicationId,
        hrEvaluation.id,
        compositeScore ?? undefined,
        confidence ?? undefined,
        { hr_notes: notes }
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
});
