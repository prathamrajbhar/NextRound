import { generateText } from '../llm/llm.service';
import { prisma } from '../../lib/prisma';
import { ensureInterviewAndSchedule } from '../../lib/pipeline';
import { buildScreeningEvaluationPrompt } from '../../prompts';

export interface ScreeningEvaluationResult {
  status: 'screening_completed' | 'rejected';
  resumeScore: number;
  compositeScore: number;
  semanticMatchScore: number;
  gapAnalysis: {
    matchingSkills: string[];
    missingSkills: string[];
    experienceMatch: string;
    keyStrengths: string[];
  };
  reasoning: string;
}

export async function evaluateApplicationScreening(
  applicationId: string
): Promise<{ application: any; evaluation: any }> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: {
        include: { user: { select: { email: true } } },
      },
      job: true,
    },
  });

  if (!app) {
    throw new Error('Application not found');
  }

  const jobDesc = app.job.description || '';
  const jobTitle = app.job.title || '';
  const candidateSkills: string[] = Array.isArray(app.candidate.skills)
    ? (app.candidate.skills as string[])
    : [];
  const candidateRawText = app.candidate.raw_resume_text || app.candidate.bio || '';
  const candidateExp = app.candidate.years_of_experience || 0;

  const thresholds = (app.job.thresholds as any) || {};
  const minScore = typeof thresholds.minScore === 'number' ? thresholds.minScore : null;
  if (minScore === null) {
    throw new Error(`Job ${app.job_id} has no minScore threshold configured; screening cannot run.`);
  }

  const jobSkills: string[] = Array.isArray(app.job.skills) ? (app.job.skills as string[]) : [];

  const prompt = buildScreeningEvaluationPrompt({
    jobTitle,
    jobDesc,
    minScore,
    jobExperienceLevel: app.job.experienceLevel || undefined,
    jobSkills,
    candidateHeadline: app.candidate.headline || undefined,
    candidateSkills,
    candidateExp,
    candidateRawText,
  });

  const text = await generateText(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI screening LLM returned no parseable JSON.');
  }
  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new Error(`AI screening LLM returned malformed JSON: ${(err as Error).message}`);
  }

  const rawScore = Number(parsed.resumeScore);
  const rawSemantic = Number(parsed.semanticMatchScore);
  if (!Number.isFinite(rawScore) || !Number.isFinite(rawSemantic)) {
    throw new Error('AI screening LLM returned missing or non-numeric scores.');
  }
  const score = Math.max(0, Math.min(100, rawScore));
  const semantic = Math.max(0, Math.min(100, rawSemantic));

  const gap = parsed.gapAnalysis || {};
  const matchingSkills = Array.isArray(gap.matchingSkills) ? gap.matchingSkills.map(String) : [];
  const missingSkills = Array.isArray(gap.missingSkills) ? gap.missingSkills.map(String) : [];
  const keyStrengths = Array.isArray(gap.keyStrengths) ? gap.keyStrengths.map(String) : [];
  const experienceMatch = typeof gap.experienceMatch === 'string' ? gap.experienceMatch : '';
  const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : '';

  const result: ScreeningEvaluationResult = {
    status: score >= minScore ? 'screening_completed' : 'rejected',
    resumeScore: score,
    compositeScore: score,
    semanticMatchScore: semantic,
    gapAnalysis: {
      matchingSkills,
      missingSkills,
      experienceMatch,
      keyStrengths,
    },
    reasoning,
  };

  const evaluation = await prisma.evaluation.upsert({
    where: { application_id: applicationId },
    create: {
      application_id: applicationId,
      stage: 'screening',
      resume_score: result.resumeScore,
      composite_score: result.compositeScore,
      reasoning: result.reasoning,
      decision: result.status === 'rejected' ? 'reject' : 'hire',
    },
    update: {
      stage: 'screening',
      resume_score: result.resumeScore,
      composite_score: result.compositeScore,
      reasoning: result.reasoning,
      decision: result.status === 'rejected' ? 'reject' : 'hire',
    },
  });

  const updatedApp = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: result.status as any,
    },
    include: {
      job: true,
      candidate: {
        include: { user: { select: { email: true } } },
      },
      evaluations: true,
    },
  });

  if (result.status !== 'rejected') {
    await ensureInterviewAndSchedule(applicationId);
  }

  return { application: updatedApp, evaluation };
}
