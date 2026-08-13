import { prisma, Prisma } from '@nextround/database';
import type { ApplicationStatus, AgentStatus } from '@nextround/database';
import { emailService } from './email.service';
import { enqueueEvaluation } from '../lib/queues/evaluation.queue';
import {
  ensureInterviewAndSchedule,
  advanceAssessmentStage,
  PAST_ASSESSMENT,
} from '../lib/pipeline';
import { upsertOffer } from './offer.service';
import { notFound, badRequest } from '../lib/http-errors';















export async function recordAiAssistResult(jobId: string, body: Record<string, unknown>) {
  const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
  if (!existingJob) {
    throw notFound('Job not found');
  }

  const { description, rubric, thresholds, status, skills } = body;

  return prisma.job.update({
    where: { id: jobId },
    data: {
      ...(description ? { description } : {}),
      ...(rubric ? { rubric } : {}),
      ...(thresholds ? { thresholds } : {}),
      ...(status ? { status } : {}),
      ...(skills ? { skills } : {}),
    },
  });
}


export async function recordSourcedCandidates(jobId: string, body: Record<string, unknown>) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw notFound('Job not found');
  }

  const { candidates } = body;

  const currentThresholds =
    job.thresholds && typeof job.thresholds === 'object' ? job.thresholds : {};
  const updatedThresholds = {
    ...currentThresholds,
    sourced_candidates: candidates || [],
    sourced_at: new Date().toISOString(),
  };

  return prisma.job.update({
    where: { id: jobId },
    data: {
      thresholds: updatedThresholds,
    },
  });
}






export async function recordScreeningResult(applicationId: string, body: Record<string, unknown>) {
  const id = applicationId;
  const {
    status,
    resume_score,
    composite_score,
    semantic_match_score,
    gap_analysis,
    reasoning,
    rejection_feedback,
  } = body;

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
    throw notFound('Application not found');
  }

  const updatedApp = await prisma.application.update({
    where: { id },
    data: {
      status:
        (status as ApplicationStatus | undefined) ||
        (typeof resume_score === 'number' && resume_score >= 70
          ? 'screening_completed'
          : 'rejected'),
    },
  });

  const evaluation = await prisma.evaluation.upsert({
    where: { application_id: id },
    create: {
      application_id: id,
      stage: 'screening',
      resume_score: typeof resume_score === 'number' ? resume_score : null,
      composite_score:
        typeof composite_score === 'number'
          ? composite_score
          : typeof resume_score === 'number'
          ? resume_score
          : null,
      reasoning:
        (reasoning as string) || (gap_analysis ? JSON.stringify(gap_analysis) : 'Screening completed'),
      decision: updatedApp.status === 'rejected' ? 'reject' : 'hire',
    },
    update: {
      stage: 'screening',
      resume_score: typeof resume_score === 'number' ? resume_score : undefined,
      composite_score: typeof composite_score === 'number' ? composite_score : undefined,
      reasoning:
        (reasoning as string) || (gap_analysis ? JSON.stringify(gap_analysis) : undefined),
      decision: updatedApp.status === 'rejected' ? 'reject' : 'hire',
    },
  });

  
  if (updatedApp.status === 'rejected' && app.candidate.user.email) {
    const candidateName = app.candidate.user.email.split('@')[0];
    await emailService
      .sendRejectionEmail(
        app.candidate.user.email,
        candidateName,
        app.job.title,
        gap_analysis,
        rejection_feedback as string | undefined
      )
      .catch((err) => console.error('Failed to send rejection email:', err));
  }

  
  
  if (updatedApp.status !== 'rejected') {
    await ensureInterviewAndSchedule(id).catch((err) =>
      console.error(`Failed to create interview/schedule for application ${id}:`, err)
    );
    
    await advanceAssessmentStage(id).catch((err) =>
      console.error(`advanceAssessmentStage failed during screening completion for ${id}:`, err)
    );
  }

  return { application: updatedApp, evaluation };
}


export async function recordAssessmentResult(applicationId: string, body: Record<string, unknown>) {
  const id = applicationId;
  const { score, category_scores, total_questions, correct_answers, passed, feedback } = body;

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) {
    throw notFound('Application not found');
  }

  
  
  
  
  
  let updatedStatus: ApplicationStatus | null = null;
  if (passed) {
    updatedStatus =
      ((await advanceAssessmentStage(id)) as ApplicationStatus | null) ?? 'screening_completed';
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
      reasoning: (feedback as string) || `Aptitude assessment completed. Score: ${score}%`,
      decision: passed ? 'hire' : 'reject',
    },
    update: {
      stage: 'assessment',
      aptitude_score: typeof score === 'number' ? score : undefined,
      reasoning: (feedback as string) || `Aptitude assessment completed. Score: ${score}%`,
      decision: passed ? 'hire' : 'reject',
    },
  });

  
  await prisma.assessment
    .updateMany({
      where: { application_id: id, test_type: 'aptitude' },
      data: {
        score: typeof score === 'number' ? score : null,
        category_breakdown: category_scores || {},
        status: 'completed',
      },
    })
    .catch((err) => {
      console.error(`Failed to update assessment ${id} with evaluation results:`, err);
      throw err;
    });

  if (passed) {
    await advanceAssessmentStage(id).catch((err) =>
      console.error(`advanceAssessmentStage failed for application ${id}:`, err)
    );
  }

  return { application: updatedApp, evaluation };
}


export async function recordCodingResult(applicationId: string, body: Record<string, unknown>) {
  const id = applicationId;
  const {
    submissionId,
    score,
    pass_rate,
    complexity_analysis,
    passed,
    feedback,
    execution_time_ms,
    memory_kb,
  } = body;

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) {
    throw notFound('Application not found');
  }

  
  if (submissionId) {
    await prisma.codingSubmission
      .update({
        where: { id: submissionId as string },
        data: {
          status: passed ? 'passed' : 'failed',
          pass_rate:
            typeof pass_rate === 'number'
              ? pass_rate
              : passed
              ? 1.0
              : 0.0,
          complexity:
            (complexity_analysis as any)?.time_complexity || 'unknown',
          ai_feedback: (feedback as string) || 'Coding evaluation completed',
        },
      })
      .catch((err) => console.warn('Could not update coding submission:', err));
  }

  
  
  
  
  let updatedStatus: ApplicationStatus | null = null;
  if (passed) {
    updatedStatus =
      ((await advanceAssessmentStage(id)) as ApplicationStatus | null) ?? 'screening_completed';
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
      reasoning:
        (feedback as string) ||
        `Coding evaluation completed. Complexity: ${(complexity_analysis as any)?.time_complexity || 'unknown'}`,
      decision: passed ? 'hire' : 'reject',
    },
    update: {
      stage: 'coding',
      coding_score: typeof score === 'number' ? score : undefined,
      reasoning:
        (feedback as string) ||
        `Coding evaluation completed. Complexity: ${(complexity_analysis as any)?.time_complexity || 'unknown'}`,
      decision: passed ? 'hire' : 'reject',
    },
  });

  if (passed) {
    await advanceAssessmentStage(id).catch((err) =>
      console.error(`advanceAssessmentStage failed for application ${id}:`, err)
    );
  }

  return { application: updatedApp, evaluation };
}


export async function getAssessmentData(applicationId: string, testType: string) {
  const id = applicationId;
  const assessment = await prisma.assessment.findFirst({
    where: { application_id: id, test_type: testType as any },
    orderBy: { created_at: 'desc' },
  });

  
  
  
  
  let minScore: number | null = null;
  try {
    const app = await prisma.application.findUnique({
      where: { id },
      select: { job: { select: { thresholds: true, assessmentConfig: true } } },
    });
    const assessmentConfig = (app?.job?.assessmentConfig ?? {}) as { passingScore?: number };
    const thresholds = (app?.job?.thresholds ?? {}) as { minScore?: number };
    
    minScore =
      typeof assessmentConfig.passingScore === 'number'
        ? assessmentConfig.passingScore
        : typeof thresholds.minScore === 'number'
        ? thresholds.minScore
        : null;
  } catch {
    minScore = null;
  }

  return {
    assessmentId: assessment?.id || null,
    questions: assessment?.questions || null,
    responses: assessment?.responses || null,
    status: assessment?.status || null,
    minScore,
  };
}


export async function recordInterviewResult(interviewId: string, body: Record<string, unknown>) {
  const id = interviewId;
  const { transcript, audio_url, interview_score, scores, reasoning, feedback } = body;

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { application: true },
  });

  if (!interview) {
    throw notFound('Interview not found');
  }

  const updatedInterview = await prisma.interview.update({
    where: { id },
    data: {
      status: 'completed',
      ...(transcript ? { transcript } : {}),
      ...(audio_url ? { audio_url } : {}),
    },
  });

  
  
  
  const scoreNum =
    typeof interview_score === 'number'
      ? interview_score
      : typeof (scores as any)?.composite === 'number'
      ? (scores as any).composite
      : null;

  const evaluation = await prisma.evaluation.upsert({
    where: { application_id: interview.application_id },
    create: {
      application_id: interview.application_id,
      stage: 'interview',
      interview_score: scoreNum,
      composite_score: scoreNum,
      reasoning:
        (reasoning as string) ||
        (feedback as string) ||
        (scoreNum != null
          ? `Voice interview evaluation completed. Score: ${scoreNum}%`
          : 'Voice interview evaluation completed.'),
      decision: scoreNum != null ? (scoreNum >= 70 ? 'hire' : 'reject') : null,
    },
    update: {
      stage: 'interview',
      interview_score: scoreNum,
      composite_score: scoreNum,
      reasoning:
        (reasoning as string) ||
        (feedback as string) ||
        (scoreNum != null
          ? `Voice interview evaluation completed. Score: ${scoreNum}%`
          : 'Voice interview evaluation completed.'),
      decision: scoreNum != null ? (scoreNum >= 70 ? 'hire' : 'reject') : null,
    },
  });

  
  
  if (scoreNum != null) {
    await prisma.application.update({
      where: { id: interview.application_id },
      data: {
        status: scoreNum >= 70 ? 'hr_round' : 'rejected',
        hr_round_status: scoreNum >= 70 ? 'pending' : undefined,
      },
    });
  }

  
  
  
  
  if (scoreNum != null && scoreNum >= 70) {
    await enqueueEvaluation(
      interview.application_id,
      'final_evaluation',
      {
        interviewId: id,
        screening_score:
          typeof evaluation.resume_score === 'number' ? evaluation.resume_score : null,
        aptitude_score:
          typeof evaluation.aptitude_score === 'number' ? evaluation.aptitude_score : null,
        coding_score:
          typeof evaluation.coding_score === 'number' ? evaluation.coding_score : null,
        interview_score: scoreNum,
        proctor_flags: (body.proctor_flags as unknown[]) || [],
        proctor_telemetry: body.proctor_telemetry || {},
      }
    ).catch((err) =>
      console.error(
        `Failed to enqueue evaluator for application ${interview.application_id}:`,
        err
      )
    );
  }

  return { interview: updatedInterview, evaluation };
}


export async function confirmInterviewSlot(interviewId: string, body: Record<string, unknown>) {
  const id = interviewId;
  const { scheduled_at } = body;

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { application: true },
  });

  if (!interview) {
    throw notFound('Interview not found');
  }

  const scheduledDate = scheduled_at ? new Date(scheduled_at as string) : new Date();

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

  return { interview: updatedInterview };
}


export async function recordScheduleSlots(interviewId: string, body: Record<string, unknown>) {
  const id = interviewId;
  const { slots, formatted_email } = body;

  const interview = await prisma.interview.findUnique({ where: { id } });
  if (!interview) {
    throw notFound('Interview not found');
  }

  const updatedInterview = await prisma.interview.update({
    where: { id },
    data: {
      status: 'scheduled',
    },
  });

  
  await prisma.agentLog.create({
    data: {
      job_id: null,
      agent_name: 'scheduler_agent',
      action: 'slots_generated',
      input: { interviewId: id } as Prisma.InputJsonValue,
      output: { slots, formatted_email } as Prisma.InputJsonValue,
      status: 'completed',
    },
  });

  return { interview: updatedInterview, slots, formatted_email };
}






export async function recordFinalEvaluation(body: Record<string, unknown>) {
  const { application_id, composite_score, confidence, reasoning } = body;

  const existing = application_id
    ? await prisma.evaluation.findFirst({ where: { application_id: application_id as string } })
    : null;

  const evaluation = existing
    ? await prisma.evaluation.update({
        where: { id: existing.id },
        data: {
          composite_score: typeof composite_score === 'number' ? composite_score : undefined,
          confidence: typeof confidence === 'number' ? confidence : undefined,
          stage: 'final_evaluation',
          reasoning: (reasoning as string) || undefined,
        },
      })
    : await prisma.evaluation.create({
        data: {
          application_id: application_id as string,
          composite_score: typeof composite_score === 'number' ? composite_score : null,
          confidence: typeof confidence === 'number' ? confidence : 1.0,
          stage: 'final_evaluation',
          reasoning: (reasoning as string) || 'Evaluation completed by Evaluator Agent',
        },
      });

  
  const conf = typeof confidence === 'number' ? confidence : 1.0;
  if (conf < 0.7) {
    const app = await prisma.application.findUnique({
      where: { id: application_id as string },
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
        await emailService.sendHRHoldAlert(hrEmails, candidateName, application_id as string, conf);
      }
    }
  }

  return { evaluation, status: 'hr_round', queuedDecision: false };
}


export async function applyDecision(evaluationId: string, body: Record<string, unknown>) {
  const id = evaluationId;
  const {
    application_id,
    decision,
    decision_rationale,
    offer_letter_content,
    rejection_email_content,
  } = body;

  const decisionVal =
    decision === 'hire' ? 'hire' : decision === 'reject' ? 'reject' : 'hold_for_review';

  let evaluation = await prisma.evaluation.findUnique({ where: { id } });
  if (evaluation) {
    evaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        decision: decisionVal,
        reasoning: (decision_rationale as string) || undefined,
      },
    });
  } else if (application_id) {
    const existingAppEval = await prisma.evaluation.findFirst({
      where: { application_id: application_id as string },
    });
    if (existingAppEval) {
      evaluation = await prisma.evaluation.update({
        where: { id: existingAppEval.id },
        data: {
          decision: decisionVal,
          reasoning: (decision_rationale as string) || undefined,
        },
      });
    } else {
      evaluation = await prisma.evaluation.create({
        data: {
          application_id: application_id as string,
          stage: 'final_review',
          decision: decisionVal,
          reasoning: (decision_rationale as string) || undefined,
        },
      });
    }
  }

  const app = await prisma.application.findUnique({
    where: { id: application_id as string },
    include: {
      job: true,
      candidate: { include: { user: true } },
    },
  });

  if (!app) {
    throw notFound('Application not found');
  }

  if (decision === 'hire') {
    
    
    const { offer, isNew } = await upsertOffer({
      applicationId: app.id,
      job: app.job,
      offerLetterContent: offer_letter_content as string | null,
    });

    await prisma.application.update({
      where: { id: app.id },
      data: { status: 'offered' },
    });

    
    if (isNew) {
      const candidateName = app.candidate.user.email.split('@')[0];
      await emailService.sendOfferEmail(app.candidate.user.email, candidateName, app.job.title, {
        salary: offer.salary,
        equity: offer.equity ?? undefined,
        magicLinkToken: offer.magic_link_token!,
      });
    }

    return { evaluation, offer, status: 'offered' };
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
      (rejection_email_content as string) ||
        'Thank you for interviewing with us. Based on our evaluation criteria, we are unable to extend an offer at this time.'
    );

    return { evaluation, status: 'rejected' };
  } else {
    await prisma.application.update({
      where: { id: app.id },
      data: { status: 'evaluation' },
    });

    return { evaluation, status: 'hold_for_review' };
  }
}


export async function createInternalOffer(body: Record<string, unknown>) {
  const {
    application_id,
    role_title,
    salary,
    equity,
    start_date,
    offer_letter_content,
  } = body;

  if (!application_id) {
    throw badRequest('application_id is required');
  }

  
  
  
  const app = await prisma.application.findUnique({
    where: { id: application_id as string },
    include: { job: true },
  });

  if (!app) {
    throw notFound('Application not found');
  }

  
  
  
  const { offer } = await upsertOffer({
    applicationId: application_id as string,
    job: app.job,
    roleTitle: role_title as string | null,
    salary: typeof salary === 'number' ? salary : null,
    equity: (equity as string) || null,
    startDate:
      (start_date as string) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    offerLetterContent: offer_letter_content as string | null,
  });

  return offer;
}






export async function recordMockFeedback(sessionId: string, body: Record<string, unknown>) {
  const id = sessionId;
  const { score, feedback, status } = body;

  const session = await prisma.mockSession.findUnique({
    where: { id },
  });

  if (!session) {
    throw notFound('Mock session not found');
  }

  const updated = await prisma.mockSession.update({
    where: { id },
    data: {
      status: (status as string) || 'completed',
      ...(typeof score === 'number' ? { score } : {}),
      ...(feedback ? { feedback } : {}),
    },
  });

  return { session: updated };
}


export async function recordResumeBuilderResult(sessionId: string, body: Record<string, unknown>) {
  const { generatedResume, resumePdfUrl, status } = body;

  const session = await prisma.mockSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw notFound('Resume builder session not found');
  }

  const updated = await prisma.mockSession.update({
    where: { id: sessionId },
    data: {
      status: (status as string) || 'completed',
      ...(generatedResume ? { generated_resume: generatedResume } : {}),
      ...(resumePdfUrl ? { resume_pdf_url: resumePdfUrl } : {}),
    },
  });

  return { session: updated };
}


export async function generatePrepContent(body: Record<string, unknown>) {
  const {
    companyName,
    roleArchetype,
    questions,
    cultureNotes,
    skillChecklist,
    jobId,
    orgId,
  } = body;

  let existing = null;
  if (jobId) {
    existing = await prisma.prepContent.findFirst({ where: { job_id: jobId as string } });
  } else if (orgId) {
    existing = await prisma.prepContent.findFirst({ where: { org_id: orgId as string } });
  } else if (companyName) {
    existing = await prisma.prepContent.findFirst({
      where: { company_name: companyName as string },
    });
  }

  let prepContent;
  if (existing) {
    prepContent = await prisma.prepContent.update({
      where: { id: existing.id },
      data: {
        company_name: (companyName as string) || existing.company_name,
        role_archetype: (roleArchetype as string) || existing.role_archetype,
        questions: (questions ?? existing.questions) as Prisma.InputJsonValue,
        culture_notes: (cultureNotes as string) || existing.culture_notes,
        skill_checklist: (skillChecklist ?? existing.skill_checklist) as Prisma.InputJsonValue,
        ...(jobId ? { job_id: jobId as string } : {}),
        ...(orgId ? { org_id: orgId as string } : {}),
      },
    });
  } else {
    
    
    if (!companyName || !roleArchetype) {
      throw badRequest('companyName and roleArchetype are required to generate prep content');
    }
    prepContent = await prisma.prepContent.create({
      data: {
        company_name: companyName as string,
        role_archetype: roleArchetype as string,
        questions: ((questions as unknown[]) || []) as Prisma.InputJsonValue,
        culture_notes: (cultureNotes as string) || '',
        skill_checklist: ((skillChecklist as unknown[]) || []) as Prisma.InputJsonValue,
        job_id: (jobId as string) || null,
        org_id: (orgId as string) || null,
      },
    });
  }

  return { prepContent };
}






export async function createAgentLog(body: Record<string, unknown>) {
  const { job_id, org_id, agent_name, action, input, output, status, error } = body;

  return prisma.agentLog.create({
    data: {
      job_id: (job_id as string) || null,
      org_id: (org_id as string) || null,
      agent_name: (agent_name as string) || 'unknown_agent',
      action: (action as string) || 'processing',
      input: (input ?? Prisma.DbNull) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
      output: (output ?? Prisma.DbNull) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
      status: (status as AgentStatus) || 'running',
      error: (error as string) || null,
    },
  });
}


export async function listAgentLogs() {
  return prisma.agentLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 50,
  });
}


export async function getRawJob(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { organization: { select: { name: true } } },
  });
  if (!job) {
    throw notFound('Job not found');
  }
  return job;
}


export async function getRawApplication(applicationId: string) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
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
    throw notFound('Application not found');
  }
  return app;
}


export async function updateCandidateEmbedding(candidateId: string, body: Record<string, unknown>) {
  const id = candidateId;
  const { embedding } = body;

  if (!Array.isArray(embedding) || embedding.length !== 768) {
    throw badRequest('Embedding must be a 768-dimensional float array');
  }

  const vectorStr = `[${embedding.join(',')}]`;
  await prisma.$executeRaw`UPDATE "CandidateProfile" SET resume_embedding = ${vectorStr}::vector WHERE id = ${id}`;

  return { message: 'Candidate embedding updated successfully' };
}


export async function getRawAnalytics(orgId: string) {
  const jobs = await prisma.job.findMany({
    where: { org_id: orgId },
    include: {
      applications: {
        include: {
          evaluations: true,
          
          interview: true,
          
          
          offer: true,
        },
      },
    },
  });

  return { orgId, jobs };
}


export async function recordAnalyticsReport(body: Record<string, unknown>) {
  const { org_id, report_url, summary, generated_at } = body;

  return prisma.agentLog.create({
    data: {
      org_id: (org_id as string) || null,
      agent_name: 'analytics_agent',
      action: 'report_generated',
      input: { org_id } as Prisma.InputJsonValue,
      output: { report_url, summary, generated_at } as Prisma.InputJsonValue,
      status: 'completed',
    },
  });
}


export async function updateInterviewSentiment(interviewId: string, body: Record<string, unknown>) {
  const id = interviewId;
  const { sentiment_report } = body;

  const interview = await prisma.interview.findUnique({ where: { id } });
  if (!interview) {
    throw notFound('Interview not found');
  }

  return prisma.interview.update({
    where: { id },
    data: {
      sentiment_report: sentiment_report || undefined,
    },
  });
}
