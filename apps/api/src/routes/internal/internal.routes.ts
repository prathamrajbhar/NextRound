import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@nextround/database';
import type { ApplicationStatus } from '@nextround/database';
import { requireInternalSecret } from '../../middleware/internalSecret';
import { emailService } from '../../services/email.service';
import { enqueueEvaluation } from '../../lib/queues/evaluation.queue';
import { ensureInterviewAndSchedule, advanceAssessmentStage } from '../../lib/pipeline';
import { deriveSalary, deriveEquity } from '../../lib/offer-terms';
import crypto from 'crypto';

// Statuses that are already past the assessment phase. A late/retried modality
// result must never regress an application out of these.
const PAST_ASSESSMENT: string[] = [
  'interview_scheduled',
  'interviewed',
  'evaluation',
  'hr_round',
  'decided',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
];

// Offer terms (salary/equity) are derived from the Job record via
// lib/offer-terms so offers never fall back to hardcoded amounts.

export const internalRouter = Router();

// Require internal service secret on all internal routes
internalRouter.use(requireInternalSecret);

// 1. PATCH /jobs/:id/ai-assist-result
internalRouter.patch('/jobs/:id/ai-assist-result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { description, rubric, thresholds, status, skills } = req.body;

    const existingJob = await prisma.job.findUnique({ where: { id } });
    if (!existingJob) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        ...(description ? { description } : {}),
        ...(rubric ? { rubric } : {}),
        ...(thresholds ? { thresholds } : {}),
        ...(status ? { status } : {}),
        ...(skills ? { skills } : {}),
      },
    });

    return res.json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    return next(error);
  }
});

// 2. PATCH /applications/:id/screening-result
internalRouter.patch('/applications/:id/screening-result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const {
      status, // 'screening_completed' | 'rejected'
      resume_score,
      composite_score,
      semantic_match_score,
      gap_analysis,
      reasoning,
      rejection_feedback,
    } = req.body;

    const app = await prisma.application.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
        job: true,
      },
    });

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const updatedApp = await prisma.application.update({
      where: { id },
      data: {
        status: status || (resume_score && resume_score >= 70 ? 'screening_completed' : 'rejected'),
      },
    });

    const evaluation = await prisma.evaluation.upsert({
      where: { application_id: id },
      create: {
        application_id: id,
        stage: 'screening',
        resume_score: typeof resume_score === 'number' ? resume_score : null,
        composite_score: typeof composite_score === 'number' ? composite_score : (typeof resume_score === 'number' ? resume_score : null),
        reasoning: reasoning || (gap_analysis ? JSON.stringify(gap_analysis) : 'Screening completed'),
        decision: (updatedApp.status as string) === 'rejected' ? 'reject' : 'hire',
        bias_flag: false,
        bias_report: gap_analysis ? { gap_analysis, semantic_match_score } : undefined,
      },
      update: {
        stage: 'screening',
        resume_score: typeof resume_score === 'number' ? resume_score : undefined,
        composite_score: typeof composite_score === 'number' ? composite_score : undefined,
        reasoning: reasoning || (gap_analysis ? JSON.stringify(gap_analysis) : undefined),
        decision: (updatedApp.status as string) === 'rejected' ? 'reject' : 'hire',
        bias_report: gap_analysis ? { gap_analysis, semantic_match_score } : undefined,
      },
    });

    // If candidate was rejected, send automated feedback email
    if (updatedApp.status === 'rejected' && app.candidate.user.email) {
      const candidateName = app.candidate.user.email.split('@')[0];
      await emailService.sendRejectionEmail(
        app.candidate.user.email,
        candidateName,
        app.job.title,
        gap_analysis,
        rejection_feedback
      ).catch((err) => console.error('Failed to send rejection email:', err));
    }

    // On screening pass, create the Interview record and have the Scheduler
    // Agent generate 3 candidate slots (spec: scheduler runs after screening).
    if (updatedApp.status !== 'rejected') {
      await ensureInterviewAndSchedule(id).catch((err) =>
        console.error(`Failed to create interview/schedule for application ${id}:`, err)
      );
    }

    return res.json({
      success: true,
      data: {
        application: updatedApp,
        evaluation,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// 3. POST /sourcing/:jobId/candidates
internalRouter.post('/sourcing/:jobId/candidates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId as string;
    const { candidates } = req.body;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const currentThresholds = (job.thresholds && typeof job.thresholds === 'object') ? job.thresholds : {};
    const updatedThresholds = {
      ...currentThresholds,
      sourced_candidates: candidates || [],
      sourced_at: new Date().toISOString(),
    };

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        thresholds: updatedThresholds,
      },
    });

    return res.json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    return next(error);
  }
});

// 4. PATCH /candidate/:id/embedding
internalRouter.patch('/candidate/:id/embedding', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { embedding } = req.body;

    if (!Array.isArray(embedding) || embedding.length !== 768) {
      return res.status(400).json({ success: false, error: 'Embedding must be a 768-dimensional float array' });
    }

    const vectorStr = `[${embedding.join(',')}]`;
    await prisma.$executeRaw`UPDATE "CandidateProfile" SET resume_embedding = ${vectorStr}::vector WHERE id = ${id}`;

    return res.json({
      success: true,
      message: 'Candidate embedding updated successfully',
    });
  } catch (error) {
    return next(error);
  }
});

// 5. POST /agent-logs
internalRouter.post('/agent-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { job_id, org_id, agent_name, action, input, output, status, error } = req.body;

    const agentLog = await prisma.agentLog.create({
      data: {
        job_id: job_id || null,
        org_id: org_id || null,
        agent_name: agent_name || 'unknown_agent',
        action: action || 'processing',
        input: input || null,
        output: output || null,
        status: status || 'running',
        error: error || null,
      },
    });

    return res.status(201).json({
      success: true,
      data: agentLog,
    });
  } catch (error) {
    return next(error);
  }
});

// 6. GET /agent-logs
internalRouter.get('/agent-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.agentLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return next(error);
  }
});

// 7. GET /jobs/:id/raw
internalRouter.get('/jobs/:id/raw', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    // Include the real organization name so Python workers (prep-content) can
    // resolve the actual org instead of falling back to a fabricated name.
    const job = await prisma.job.findUnique({
      where: { id },
      include: { organization: { select: { name: true } } },
    });
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    return res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    return next(error);
  }
});

// 8. GET /applications/:id/raw
internalRouter.get('/applications/:id/raw', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const app = await prisma.application.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
        job: true,
        evaluations: true,
      },
    });
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    return res.json({
      success: true,
      data: app,
    });
  } catch (error) {
    return next(error);
  }
});

// 9. POST /interviews/:id/schedule-slots
internalRouter.post('/interviews/:id/schedule-slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { slots, formatted_email } = req.body;

    const interview = await prisma.interview.findUnique({ where: { id } });
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        status: 'scheduled',
      },
    });

    // Save available slots into application metadata or agent log
    await prisma.agentLog.create({
      data: {
        job_id: null,
        agent_name: 'scheduler_agent',
        action: 'slots_generated',
        input: { interviewId: id },
        output: { slots, formatted_email },
        status: 'completed',
      },
    });

    return res.json({
      success: true,
      data: { interview: updatedInterview, slots, formatted_email },
    });
  } catch (error) {
    return next(error);
  }
});

// 10. PATCH /interviews/:id/confirmed-slot
internalRouter.patch('/interviews/:id/confirmed-slot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { scheduled_at, confirmed_by } = req.body;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    const scheduledDate = scheduled_at ? new Date(scheduled_at) : new Date();

    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        scheduled_at: scheduledDate,
        status: 'scheduled',
      },
    });

    await prisma.application.update({
      where: { id: interview.application_id },
      data: {
        status: 'interview_scheduled',
        hr_round_status: 'scheduled',
        hr_round_scheduled_at: scheduledDate,
      },
    });

    return res.json({
      success: true,
      data: { interview: updatedInterview },
    });
  } catch (error) {
    return next(error);
  }
});

// 11. PATCH /applications/:id/assessment-result
internalRouter.patch('/applications/:id/assessment-result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const {
      score,
      category_scores,
      total_questions,
      correct_answers,
      status,
      passed,
      feedback,
    } = req.body;

    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Never regress a passed/advanced application. On pass, stay in the
    // assessment phase while modalities are in progress and let the
    // advanceAssessmentStage helper move the candidate to the Interview stage
    // once ALL enabled assessment modalities have passed. On fail, reject only
    // if the application is still within the assessment phase.
    let updatedStatus: ApplicationStatus | null = null;
    if (passed) {
      updatedStatus = ((await advanceAssessmentStage(id)) as ApplicationStatus | null) ?? 'screening_completed';
    } else if (!PAST_ASSESSMENT.includes(app.status)) {
      updatedStatus = 'rejected';
    }

    const updatedApp = updatedStatus
      ? await prisma.application.update({ where: { id }, data: { status: updatedStatus } })
      : app;

    const evaluation = await prisma.evaluation.upsert({
      where: { application_id: id },
      create: {
        application_id: id,
        stage: 'assessment',
        aptitude_score: typeof score === 'number' ? score : null,
        reasoning: feedback || `Aptitude assessment completed. Score: ${score}%`,
        decision: passed ? 'hire' : 'reject',
        bias_flag: false,
        bias_report: { category_scores, total_questions, correct_answers },
      },
      update: {
        stage: 'assessment',
        aptitude_score: typeof score === 'number' ? score : undefined,
        reasoning: feedback || `Aptitude assessment completed. Score: ${score}%`,
        decision: passed ? 'hire' : 'reject',
        bias_report: { category_scores, total_questions, correct_answers },
      },
    });

    // Update Assessment record if present
    await prisma.assessment.updateMany({
      where: { application_id: id, test_type: 'aptitude' },
      data: {
        score: typeof score === 'number' ? score : null,
        category_breakdown: category_scores || {},
        status: 'completed',
      },
    }).catch(() => {});

    if (passed) {
      await advanceAssessmentStage(id).catch((err) =>
        console.error(`advanceAssessmentStage failed for application ${id}:`, err)
      );
    }

    return res.json({
      success: true,
      data: { application: updatedApp, evaluation },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /applications/:id/assessment-data - Fetch stored assessment questions for scoring
internalRouter.get('/applications/:id/assessment-data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const testType = (req.query.type as string) || 'aptitude';

    const assessment = await prisma.assessment.findFirst({
      where: { application_id: id, test_type: testType as any },
      orderBy: { created_at: 'desc' },
    });

    // Surface the job's configured pass threshold so the AI worker can honor
    // per-job scoring config instead of a hardcoded 70%. Best-effort lookup.
    let minScore: number | null = null;
    try {
      const app = await prisma.application.findUnique({
        where: { id },
        select: { job: { select: { thresholds: true } } },
      });
      const thresholds = (app?.job?.thresholds ?? {}) as { minScore?: number };
      minScore = typeof thresholds.minScore === 'number' ? thresholds.minScore : null;
    } catch {
      minScore = null;
    }

    return res.json({
      success: true,
      data: {
        assessmentId: assessment?.id || null,
        questions: assessment?.questions || null,
        responses: assessment?.responses || null,
        status: assessment?.status || null,
        minScore,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// 12. PATCH /applications/:id/coding-result
internalRouter.patch('/applications/:id/coding-result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const {
      submissionId,
      score,
      pass_rate,
      complexity_analysis,
      passed,
      feedback,
      execution_time_ms,
      memory_kb,
    } = req.body;

    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Update CodingSubmission record if submissionId provided
    if (submissionId) {
      await prisma.codingSubmission.update({
        where: { id: submissionId },
        data: {
          status: passed ? 'passed' : 'failed',
          pass_rate: typeof pass_rate === 'number' ? pass_rate : (passed ? 1.0 : 0.0),
          complexity: complexity_analysis?.time_complexity || 'unknown',
          ai_feedback: feedback || 'Coding evaluation completed',
        },
      }).catch((err) => console.warn('Could not update coding submission:', err));
    }

    // Never regress a passed/advanced application. On pass, stay in the
    // assessment phase until all enabled modalities pass, then the
    // advanceAssessmentStage helper moves the candidate to the Interview stage.
    // On fail, reject only if the application is still within the assessment phase.
    let updatedStatus: ApplicationStatus | null = null;
    if (passed) {
      updatedStatus = ((await advanceAssessmentStage(id)) as ApplicationStatus | null) ?? 'screening_completed';
    } else if (!PAST_ASSESSMENT.includes(app.status)) {
      updatedStatus = 'rejected';
    }

    const updatedApp = updatedStatus
      ? await prisma.application.update({ where: { id }, data: { status: updatedStatus } })
      : app;

    const evaluation = await prisma.evaluation.upsert({
      where: { application_id: id },
      create: {
        application_id: id,
        stage: 'coding',
        coding_score: typeof score === 'number' ? score : null,
        reasoning: feedback || `Coding evaluation completed. Complexity: ${complexity_analysis?.time_complexity || 'unknown'}`,
        decision: passed ? 'hire' : 'reject',
        bias_flag: false,
        bias_report: { pass_rate, complexity_analysis, execution_time_ms, memory_kb },
      },
      update: {
        stage: 'coding',
        coding_score: typeof score === 'number' ? score : undefined,
        reasoning: feedback || `Coding evaluation completed. Complexity: ${complexity_analysis?.time_complexity || 'unknown'}`,
        decision: passed ? 'hire' : 'reject',
        bias_report: { pass_rate, complexity_analysis, execution_time_ms, memory_kb },
      },
    });

    if (passed) {
      await advanceAssessmentStage(id).catch((err) =>
        console.error(`advanceAssessmentStage failed for application ${id}:`, err)
      );
    }

    return res.json({
      success: true,
      data: { application: updatedApp, evaluation },
    });
  } catch (error) {
    return next(error);
  }
});

// 13. PATCH /applications/:id/video-transcript
internalRouter.patch('/applications/:id/video-transcript', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { transcript, key_points, video_url } = req.body;

    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const evaluation = await prisma.evaluation.upsert({
      where: { application_id: id },
      create: {
        application_id: id,
        stage: 'video_screening',
        reasoning: transcript || 'Video transcript processed',
        bias_flag: false,
        bias_report: { key_points, video_url },
      },
      update: {
        reasoning: transcript || undefined,
        bias_report: { key_points, video_url },
      },
    });

    return res.json({
      success: true,
      data: { evaluation },
    });
  } catch (error) {
    return next(error);
  }
});

// 13b. POST /applications/:id/video-screening-result
internalRouter.post('/applications/:id/video-screening-result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { submitted, score, passed, feedback, key_strengths, weaknesses } = req.body;

    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const videoReport = {
      video_score: typeof score === 'number' ? score : null,
      video_feedback: feedback || 'Video screening submitted',
      key_strengths: Array.isArray(key_strengths) ? key_strengths : [],
      weaknesses: Array.isArray(weaknesses) ? weaknesses : [],
    };

    const evaluation = await prisma.evaluation.upsert({
      where: { application_id: id },
      create: {
        application_id: id,
        stage: 'video_screening',
        reasoning: feedback || 'Video screening submitted',
        bias_flag: false,
        bias_report: videoReport,
      },
      update: {
        stage: 'video_screening',
        reasoning: feedback || undefined,
        bias_report: videoReport,
      },
    });

    // Never regress a passed/advanced application. Fail -> reject, otherwise
    // stay in the assessment phase and advance once all enabled modalities pass.
    let updatedStatus: ApplicationStatus | null = null;
    if (passed === false) {
      updatedStatus = 'rejected';
    } else if (submitted) {
      const advanced = await advanceAssessmentStage(id);
      updatedStatus = (advanced as ApplicationStatus | null) ?? 'screening_completed';
    }

    const updatedApp = updatedStatus
      ? await prisma.application.update({ where: { id }, data: { status: updatedStatus } })
      : app;

    return res.json({
      success: true,
      data: { application: updatedApp, evaluation },
    });
  } catch (error) {
    return next(error);
  }
});

// 14. PATCH /interviews/:id/result
internalRouter.patch('/interviews/:id/result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { transcript, audio_url, interview_score, scores, reasoning, feedback } = req.body;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        status: 'completed',
        ...(transcript ? { transcript } : {}),
        ...(audio_url ? { audio_url } : {}),
      },
    });

    // No interview score is ever fabricated: when the evaluator callback omits
    // it (and there is no real composite), the score is null and the candidate
    // is neither advanced to HR nor rejected on a made-up number.
    const scoreNum = typeof interview_score === 'number' ? interview_score : (typeof scores?.composite === 'number' ? scores.composite : null);

    const evaluation = await prisma.evaluation.upsert({
      where: { application_id: interview.application_id },
      create: {
        application_id: interview.application_id,
        stage: 'interview',
        interview_score: scoreNum,
        composite_score: scoreNum,
        reasoning: reasoning || feedback || (scoreNum != null ? `Voice interview evaluation completed. Score: ${scoreNum}%` : 'Voice interview evaluation completed.'),
        decision: scoreNum != null ? (scoreNum >= 70 ? 'hire' : 'reject') : null,
        bias_flag: false,
        bias_report: { scores, feedback },
      },
      update: {
        stage: 'interview',
        interview_score: scoreNum,
        composite_score: scoreNum,
        reasoning: reasoning || feedback || (scoreNum != null ? `Voice interview evaluation completed. Score: ${scoreNum}%` : 'Voice interview evaluation completed.'),
        decision: scoreNum != null ? (scoreNum >= 70 ? 'hire' : 'reject') : null,
        bias_report: { scores, feedback },
      },
    });

    // Advance application status to hr_round if passed, or rejected if failed.
    // Without a real score we leave the status untouched (no fabricated move).
    if (scoreNum != null) {
      await prisma.application.update({
        where: { id: interview.application_id },
        data: {
          status: scoreNum >= 70 ? 'hr_round' : 'rejected',
          hr_round_status: scoreNum >= 70 ? 'pending' : undefined,
        },
      });
    }

    // After a passed interview, run the Evaluator Agent so a real composite +
    // confidence are computed before the HR round. The decision fires only
    // after the human HR round passes (interviews/hr/:applicationId/result).
    // Missing stage scores are passed as null — never fabricated defaults.
    if (scoreNum != null && scoreNum >= 70) {
      await enqueueEvaluation(
        interview.application_id,
        'final_evaluation',
        {
          interviewId: id,
          screening_score: typeof evaluation.resume_score === 'number' ? evaluation.resume_score : null,
          aptitude_score: typeof evaluation.aptitude_score === 'number' ? evaluation.aptitude_score : null,
          coding_score: typeof evaluation.coding_score === 'number' ? evaluation.coding_score : null,
          interview_score: scoreNum,
          proctor_flags: req.body.proctor_flags || [],
          proctor_telemetry: req.body.proctor_telemetry || {},
        }
      ).catch((err) =>
        console.error(
          `Failed to enqueue evaluator for application ${interview.application_id}:`,
          err
        )
      );
    }

    return res.json({
      success: true,
      data: { interview: updatedInterview, evaluation },
    });
  } catch (error) {
    return next(error);
  }
});

// 15. PATCH /evaluations/:id
// Evaluator Agent callback. Upserts the evaluation by application_id (the
// evaluator may key its callback off the interview id) so a single canonical
// Evaluation row exists per application. The decision fires ONLY after the
// human HR round (see interviews/hr/:applicationId/result), not from here.
internalRouter.patch('/evaluations/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      application_id,
      composite_score,
      confidence,
      bias_report,
      reasoning,
    } = req.body;

    const existing = application_id
      ? await prisma.evaluation.findFirst({ where: { application_id } })
      : null;

    const biasFlag = Boolean(
      bias_report && bias_report.severity && bias_report.severity !== 'low'
    );

    const evaluation = existing
      ? await prisma.evaluation.update({
          where: { id: existing.id },
          data: {
            composite_score: typeof composite_score === 'number' ? composite_score : undefined,
            confidence: typeof confidence === 'number' ? confidence : undefined,
            stage: 'final_evaluation',
            reasoning: reasoning || undefined,
            bias_flag: biasFlag,
            bias_report: bias_report || undefined,
          },
        })
      : await prisma.evaluation.create({
          data: {
            application_id,
            composite_score: typeof composite_score === 'number' ? composite_score : null,
            confidence: typeof confidence === 'number' ? confidence : 1.0,
            stage: 'final_evaluation',
            reasoning: reasoning || 'Evaluation completed by Evaluator Agent',
            bias_flag: biasFlag,
            bias_report: bias_report || {},
          },
        });

    // Low-confidence composites flag the candidate for a human HR hold review.
    const conf = typeof confidence === 'number' ? confidence : 1.0;
    if (conf < 0.70) {
      const app = await prisma.application.findUnique({
        where: { id: application_id },
        include: {
          job: { include: { organization: { include: { users: true } } } },
          candidate: { include: { user: true } },
        },
      });

      if (app) {
        const hrEmails = app.job.organization.users
          .filter((u) => u.role === 'hr')
          .map((u) => u.email);
        const candidateName = app.candidate.user.email.split('@')[0];
        if (hrEmails.length > 0) {
          await emailService.sendHRHoldAlert(hrEmails, candidateName, application_id, conf);
        }
      }
    }

    return res.json({
      success: true,
      data: { evaluation, status: 'hr_round', queuedDecision: false },
    });
  } catch (error) {
    return next(error);
  }
});

// 16. PATCH /evaluations/:id/decision
internalRouter.patch('/evaluations/:id/decision', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const {
      application_id,
      decision, // 'hire' | 'reject' | 'hold_for_review'
      decision_rationale,
      auto_offer,
      offer_letter_content,
      rejection_email_content,
    } = req.body;

    const decisionVal = decision === 'hire' ? 'hire' : decision === 'reject' ? 'reject' : 'hold_for_review';
    
    let evaluation = await prisma.evaluation.findUnique({ where: { id } });
    if (evaluation) {
      evaluation = await prisma.evaluation.update({
        where: { id },
        data: {
          decision: decisionVal,
          reasoning: decision_rationale || undefined,
        },
      });
    } else if (application_id) {
      const existingAppEval = await prisma.evaluation.findFirst({ where: { application_id } });
      if (existingAppEval) {
        evaluation = await prisma.evaluation.update({
          where: { id: existingAppEval.id },
          data: {
            decision: decisionVal,
            reasoning: decision_rationale || undefined,
          },
        });
      } else {
        evaluation = await prisma.evaluation.create({
          data: {
            application_id,
            stage: 'final_review',
            decision: decisionVal,
            reasoning: decision_rationale || undefined,
          },
        });
      }
    }

    const app = await prisma.application.findUnique({
      where: { id: application_id },
      include: {
        job: true,
        candidate: { include: { user: true } },
      },
    });

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (decision === 'hire') {
      // Idempotent offer creation: application_id is unique, so a retried decision
      // updates the existing offer (keeping its magic link token) instead of crashing.
      const magicToken = crypto.randomUUID();
      const salary = deriveSalary(app.job.salary);
      const equity = deriveEquity(app.job);

      // Never emit a made-up offer: if the Job genuinely has no salary, refuse to
      // create the offer instead of inventing a number.
      if (salary === null) {
        return res.status(422).json({
          success: false,
          error: `Cannot generate an offer for "${app.job.title}": the job has no salary configured. Add a salary to the job before generating an offer.`,
        });
      }

      const offer = await prisma.offer.upsert({
        where: { application_id: app.id },
        create: {
          application_id: app.id,
          role_title: app.job.title,
          salary,
          equity,
          magic_link_token: magicToken,
          offer_letter_content: offer_letter_content || `Official Offer for ${app.job.title}`,
          status: 'pending',
          valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        update: {
          role_title: app.job.title,
          salary,
          equity,
          offer_letter_content: offer_letter_content || `Official Offer for ${app.job.title}`,
          status: 'pending',
          valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.application.update({
        where: { id: app.id },
        data: { status: 'offered' },
      });

      // Only email the candidate when a brand-new offer was created (token freshly generated)
      if (offer.magic_link_token === magicToken) {
        const candidateName = app.candidate.user.email.split('@')[0];
        await emailService.sendOfferEmail(app.candidate.user.email, candidateName, app.job.title, {
          salary,
          equity: equity ?? undefined,
          magicLinkToken: magicToken,
        });
      }

      return res.json({
        success: true,
        data: { evaluation, offer, status: 'offered' },
      });
    } else if (decision === 'reject') {
      await prisma.application.update({
        where: { id: app.id },
        data: { status: 'rejected' },
      });

      const candidateName = app.candidate.user.email.split('@')[0];
      await emailService.sendConstructiveRejection(
        app.candidate.user.email,
        candidateName,
        app.job.title,
        ['System Architecture', 'Algorithmic Optimization'],
        rejection_email_content || 'Thank you for interviewing with us. Based on our evaluation criteria, we are unable to extend an offer at this time.'
      );

      return res.json({
        success: true,
        data: { evaluation, status: 'rejected' },
      });
    } else {
      await prisma.application.update({
        where: { id: app.id },
        data: { status: 'evaluation' },
      });

      return res.json({
        success: true,
        data: { evaluation, status: 'hold_for_review' },
      });
    }
  } catch (error) {
    return next(error);
  }
});

// 17. POST /offers
internalRouter.post('/offers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { application_id, role_title, salary, equity, start_date, offer_letter_content } = req.body;

    if (!application_id) {
      return res.status(400).json({ success: false, error: 'application_id is required' });
    }

    // Offer terms are derived from the real Job record (mirroring the
    // decision-hire path) — never fabricated fallbacks. Explicit body values are
    // honored as real caller inputs; otherwise the Job posting is the truth.
    const app = await prisma.application.findUnique({
      where: { id: application_id },
      include: { job: true },
    });

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const derivedSalary = typeof salary === 'number' ? salary : deriveSalary(app.job.salary);

    // Never emit a made-up offer: if the Job genuinely has no salary, refuse to
    // create the offer instead of inventing a number.
    if (derivedSalary === null) {
      return res.status(422).json({
        success: false,
        error: `Cannot generate an offer for "${app.job.title}": the job has no salary configured. Add a salary to the job before generating an offer.`,
      });
    }

    const derivedRoleTitle = (role_title && role_title.trim()) || app.job.title;
    const derivedEquity = equity || deriveEquity(app.job);

    // Idempotent offer creation: application_id is unique, so re-posting updates the
    // existing offer (keeping its magic link token) instead of crashing on a constraint.
    const magicToken = crypto.randomUUID();
    const offer = await prisma.offer.upsert({
      where: { application_id },
      create: {
        application_id,
        role_title: derivedRoleTitle,
        salary: derivedSalary,
        equity: derivedEquity,
        start_date: start_date ? new Date(start_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        offer_letter_content: offer_letter_content || `Official Offer for ${app.job.title}`,
        magic_link_token: magicToken,
        status: 'pending',
        valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      update: {
        role_title: derivedRoleTitle,
        salary: derivedSalary,
        equity: derivedEquity,
        start_date: start_date ? new Date(start_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        offer_letter_content: offer_letter_content || `Official Offer for ${app.job.title}`,
        status: 'pending',
        valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(201).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    return next(error);
  }
});

// 18. PATCH /mock/sessions/:id/feedback
internalRouter.patch('/mock/sessions/:id/feedback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { score, feedback, status } = req.body;

    const session = await prisma.mockSession.findUnique({
      where: { id },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Mock session not found' });
    }

    const updated = await prisma.mockSession.update({
      where: { id },
      data: {
        status: status || 'completed',
        ...(typeof score === 'number' ? { score } : {}),
        ...(feedback ? { feedback } : {}),
      },
    });

    return res.json({
      success: true,
      data: { session: updated },
    });
  } catch (error) {
    return next(error);
  }
});

// 19. PATCH /resume-builder/:sessionId/result
internalRouter.patch('/resume-builder/:sessionId/result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.sessionId as string;
    const { generatedResume, resumePdfUrl, status } = req.body;

    const session = await prisma.mockSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Resume builder session not found' });
    }

    const updated = await prisma.mockSession.update({
      where: { id: sessionId },
      data: {
        status: status || 'completed',
        ...(generatedResume ? { generated_resume: generatedResume } : {}),
        ...(resumePdfUrl ? { resume_pdf_url: resumePdfUrl } : {}),
      },
    });

    return res.json({
      success: true,
      data: { session: updated },
    });
  } catch (error) {
    return next(error);
  }
});

// 20. POST /prep/generate
internalRouter.post('/prep/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyName, roleArchetype, questions, cultureNotes, skillChecklist, jobId, orgId } = req.body;

    let existing = null;
    if (jobId) {
      existing = await prisma.prepContent.findFirst({ where: { job_id: jobId } });
    } else if (orgId) {
      existing = await prisma.prepContent.findFirst({ where: { org_id: orgId } });
    } else if (companyName) {
      existing = await prisma.prepContent.findFirst({ where: { company_name: companyName } });
    }

    let prepContent;
    if (existing) {
      prepContent = await prisma.prepContent.update({
        where: { id: existing.id },
        data: {
          company_name: companyName || existing.company_name,
          role_archetype: roleArchetype || existing.role_archetype,
          questions: questions || existing.questions,
          culture_notes: cultureNotes || existing.culture_notes,
          skill_checklist: skillChecklist || existing.skill_checklist,
          ...(jobId ? { job_id: jobId } : {}),
          ...(orgId ? { org_id: orgId } : {}),
        },
      });
    } else {
      // Never fabricate prep content: without a real company name and role
      // archetype there is nothing honest to create, so the request is refused.
      if (!companyName || !roleArchetype) {
        return res.status(400).json({
          success: false,
          error: 'companyName and roleArchetype are required to generate prep content',
        });
      }
      prepContent = await prisma.prepContent.create({
        data: {
          company_name: companyName,
          role_archetype: roleArchetype,
          questions: questions || [],
          culture_notes: cultureNotes || '',
          skill_checklist: skillChecklist || [],
          job_id: jobId || null,
          org_id: orgId || null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: { prepContent },
    });
  } catch (error) {
    return next(error);
  }
});

// 21. GET /analytics/raw - Raw aggregated analytics data for Python Analytics Agent
internalRouter.get('/analytics/raw', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.query.org_id as string;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'org_id is required' });
    }

    const jobs = await prisma.job.findMany({
      where: { org_id: orgId },
      include: {
        applications: {
          include: {
            evaluations: true,
            // Prisma relation is `interview Interview?` (singular), not `interviews`.
            interview: true,
            // Offer created_at is the terminal timestamp the Analytics Agent
            // uses to compute a REAL mean time-to-hire for offered/accepted apps.
            offer: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: { orgId, jobs },
    });
  } catch (error) {
    return next(error);
  }
});

// 22. POST /analytics/reports - Receive generated PDF analytics report metadata
internalRouter.post('/analytics/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { org_id, report_url, summary, generated_at } = req.body;

    const agentLog = await prisma.agentLog.create({
      data: {
        org_id: org_id || null,
        agent_name: 'analytics_agent',
        action: 'report_generated',
        input: { org_id },
        output: { report_url, summary, generated_at },
        status: 'completed',
      },
    });

    return res.status(201).json({
      success: true,
      data: agentLog,
    });
  } catch (error) {
    return next(error);
  }
});

// 23. PATCH /interviews/:id/sentiment - Update sentiment report from Python worker
internalRouter.patch('/interviews/:id/sentiment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { sentiment_report } = req.body;

    const interview = await prisma.interview.findUnique({ where: { id } });
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        sentiment_report: sentiment_report || undefined,
      },
    });

    return res.json({
      success: true,
      data: { interview: updatedInterview },
    });
  } catch (error) {
    return next(error);
  }
});



