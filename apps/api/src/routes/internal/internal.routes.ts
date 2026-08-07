import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@nextround/database';
import { requireInternalSecret } from '../../middleware/internalSecret';
import { emailService } from '../../services/email.service';
import { enqueueDecision } from '../../lib/queues/decision.queue';
import crypto from 'crypto';

export const internalRouter = Router();

// Require internal service secret on all internal routes
internalRouter.use(requireInternalSecret);

// 1. PATCH /jobs/:id/ai-assist-result
internalRouter.patch('/jobs/:id/ai-assist-result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { description, rubric, thresholds, status } = req.body;

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
    const job = await prisma.job.findUnique({ where: { id } });
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

    const updatedStatus = passed ? 'assessment' : 'rejected';

    const updatedApp = await prisma.application.update({
      where: { id },
      data: { status: updatedStatus },
    });

    const evaluation = await prisma.evaluation.upsert({
      where: { application_id: id },
      create: {
        application_id: id,
        stage: 'assessment',
        composite_score: typeof score === 'number' ? score : null,
        reasoning: feedback || `Aptitude assessment completed. Score: ${score}%`,
        decision: passed ? 'hire' : 'reject',
        bias_flag: false,
        bias_report: { category_scores, total_questions, correct_answers },
      },
      update: {
        stage: 'assessment',
        composite_score: typeof score === 'number' ? score : undefined,
        reasoning: feedback || `Aptitude assessment completed. Score: ${score}%`,
        decision: passed ? 'hire' : 'reject',
        bias_report: { category_scores, total_questions, correct_answers },
      },
    });

    return res.json({
      success: true,
      data: { application: updatedApp, evaluation },
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
          complexity: complexity_analysis?.time_complexity || 'O(N)',
          ai_feedback: feedback || 'Coding evaluation completed',
        },
      }).catch((err) => console.warn('Could not update coding submission:', err));
    }

    const nextStatus = passed ? 'interview_scheduled' : 'rejected';

    const updatedApp = await prisma.application.update({
      where: { id },
      data: { status: nextStatus },
    });

    const evaluation = await prisma.evaluation.upsert({
      where: { application_id: id },
      create: {
        application_id: id,
        stage: 'coding',
        coding_score: typeof score === 'number' ? score : null,
        reasoning: feedback || `Coding evaluation completed. Complexity: ${complexity_analysis?.time_complexity || 'O(N)'}`,
        decision: passed ? 'hire' : 'reject',
        bias_flag: false,
        bias_report: { pass_rate, complexity_analysis, execution_time_ms, memory_kb },
      },
      update: {
        stage: 'coding',
        coding_score: typeof score === 'number' ? score : undefined,
        reasoning: feedback || `Coding evaluation completed. Complexity: ${complexity_analysis?.time_complexity || 'O(N)'}`,
        decision: passed ? 'hire' : 'reject',
        bias_report: { pass_rate, complexity_analysis, execution_time_ms, memory_kb },
      },
    });

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

    const scoreNum = typeof interview_score === 'number' ? interview_score : (typeof scores?.composite === 'number' ? scores.composite : 85);

    const evaluation = await prisma.evaluation.upsert({
      where: { application_id: interview.application_id },
      create: {
        application_id: interview.application_id,
        stage: 'interview',
        interview_score: scoreNum,
        composite_score: scoreNum,
        reasoning: reasoning || feedback || `Voice interview evaluation completed. Score: ${scoreNum}%`,
        decision: scoreNum >= 70 ? 'hire' : 'reject',
        bias_flag: false,
        bias_report: { scores, feedback },
      },
      update: {
        stage: 'interview',
        interview_score: scoreNum,
        composite_score: scoreNum,
        reasoning: reasoning || feedback || `Voice interview evaluation completed. Score: ${scoreNum}%`,
        decision: scoreNum >= 70 ? 'hire' : 'reject',
        bias_report: { scores, feedback },
      },
    });

    // Advance application status to hr_round if passed, or rejected if failed
    await prisma.application.update({
      where: { id: interview.application_id },
      data: {
        status: scoreNum >= 70 ? 'hr_round' : 'rejected',
        hr_round_status: scoreNum >= 70 ? 'pending' : undefined,
      },
    });

    return res.json({
      success: true,
      data: { interview: updatedInterview, evaluation },
    });
  } catch (error) {
    return next(error);
  }
});

// 15. PATCH /evaluations/:id
internalRouter.patch('/evaluations/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const {
      application_id,
      composite_score,
      confidence,
      dimension_scores,
      bias_report,
      reasoning,
    } = req.body;

    const evaluation = await prisma.evaluation.upsert({
      where: { id },
      create: {
        id,
        application_id,
        composite_score: typeof composite_score === 'number' ? composite_score : null,
        confidence: typeof confidence === 'number' ? confidence : 1.0,
        stage: 'final_evaluation',
        reasoning: reasoning || 'Evaluation completed by Evaluator Agent',
        bias_flag: Boolean(bias_report && bias_report.severity && bias_report.severity !== 'low'),
        bias_report: bias_report || {},
      },
      update: {
        composite_score: typeof composite_score === 'number' ? composite_score : undefined,
        confidence: typeof confidence === 'number' ? confidence : undefined,
        stage: 'final_evaluation',
        reasoning: reasoning || undefined,
        bias_flag: Boolean(bias_report && bias_report.severity && bias_report.severity !== 'low'),
        bias_report: bias_report || undefined,
      },
    });

    const isHighConfidence = (typeof confidence === 'number' ? confidence : 1.0) >= 0.70;
    const nextStatus = isHighConfidence ? 'evaluation' : 'evaluation';

    await prisma.application.update({
      where: { id: application_id },
      data: { status: nextStatus },
    });

    if (isHighConfidence) {
      await enqueueDecision(application_id, evaluation.id, composite_score || 0, confidence || 1.0);
    } else {
      // Trigger HR hold alert email to org HR users
      const app = await prisma.application.findUnique({
        where: { id: application_id },
        include: {
          job: {
            include: {
              organization: {
                include: { users: true },
              },
            },
          },
          candidate: { include: { user: true } },
        },
      });

      if (app) {
        const hrEmails = app.job.organization.users
          .filter((u) => u.role === 'hr')
          .map((u) => u.email);
        const candidateName = app.candidate.user.email.split('@')[0];
        if (hrEmails.length > 0) {
          await emailService.sendHRHoldAlert(hrEmails, candidateName, application_id, confidence || 0);
        }
      }
    }

    return res.json({
      success: true,
      data: { evaluation, status: nextStatus, queuedDecision: isHighConfidence },
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

    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        decision: decision === 'hire' ? 'hire' : decision === 'reject' ? 'reject' : 'hold_for_review',
        reasoning: decision_rationale || undefined,
      },
    });

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
      const magicToken = crypto.randomUUID();
      const offer = await prisma.offer.create({
        data: {
          application_id: app.id,
          role_title: app.job.title,
          salary: 150000,
          equity: '0.15% ESOPs',
          magic_link_token: magicToken,
          offer_letter_content: offer_letter_content || `Official Offer for ${app.job.title}`,
          status: 'pending',
          valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.application.update({
        where: { id: app.id },
        data: { status: 'offered' },
      });

      const candidateName = app.candidate.user.email.split('@')[0];
      await emailService.sendOfferEmail(app.candidate.user.email, candidateName, app.job.title, {
        salary: 150000,
        equity: '0.15% ESOPs',
        magicLinkToken: magicToken,
      });

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

    const magicToken = crypto.randomUUID();
    const offer = await prisma.offer.create({
      data: {
        application_id,
        role_title: role_title || 'Software Engineer',
        salary: typeof salary === 'number' ? salary : 120000,
        equity: equity || null,
        start_date: start_date ? new Date(start_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        offer_letter_content: offer_letter_content || 'Formal Offer Document',
        magic_link_token: magicToken,
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
      prepContent = await prisma.prepContent.create({
        data: {
          company_name: companyName || 'General Tech',
          role_archetype: roleArchetype || 'Software Engineer',
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
            interviews: true,
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



