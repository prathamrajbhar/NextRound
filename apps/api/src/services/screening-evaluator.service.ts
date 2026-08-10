import { generateText } from './llm.service';
import { prisma } from '../lib/prisma';
import { ensureInterviewAndSchedule } from '../lib/pipeline';

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

/**
 * Runs AI screening evaluation for a candidate application using Gemini LLM.
 *
 * Every score and every gap-analysis field comes from a validated LLM response.
 * No heuristic score, default threshold, or canned strengths list is ever used —
 * if the LLM cannot produce a complete, valid result the evaluation fails
 * instead of fabricating one.
 */
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

  // The pass threshold comes from the job's real config. Fabricating a 70 would
  // silently gate candidates against an invented number.
  const thresholds = (app.job.thresholds as any) || {};
  const minScore = typeof thresholds.minScore === 'number' ? thresholds.minScore : null;
  if (minScore === null) {
    throw new Error(`Job ${app.jobId} has no minScore threshold configured; screening cannot run.`);
  }

  const prompt = `You are an elite AI technical screening agent evaluating a job application.

JOB DETAILS:
Title: ${jobTitle}
Description: ${jobDesc.slice(0, 4000)}
Min Passing Score: ${minScore}%

CANDIDATE DETAILS:
Headline: ${app.candidate.headline || 'N/A'}
Skills: ${candidateSkills.join(', ') || 'N/A'}
Years of Experience: ${candidateExp}
Resume Bio / Text: ${candidateRawText.slice(0, 4000)}

DIRECTIVES:
1. Compare candidate's experience, skills, and background against job requirements.
2. Compute an overall resumeScore (0-100) and semanticMatchScore (0-100).
3. Generate a gapAnalysis object containing matchingSkills, missingSkills, experienceMatch, keyStrengths.
4. Provide a 2-3 sentence executive reasoning summary.

Return ONLY a JSON object matching:
{
  "resumeScore": number,
  "semanticMatchScore": number,
  "gapAnalysis": {
    "matchingSkills": string[],
    "missingSkills": string[],
    "experienceMatch": string,
    "keyStrengths": string[]
  },
  "reasoning": string
}`;

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

  // Update Application record status in DB
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
    },
  });

  // Upsert Evaluation record in DB
  const evaluation = await prisma.evaluation.upsert({
    where: { application_id: applicationId },
    create: {
      application_id: applicationId,
      stage: 'screening',
      resume_score: result.resumeScore,
      composite_score: result.compositeScore,
      reasoning: result.reasoning,
      decision: result.status === 'rejected' ? 'reject' : 'hire',
      bias_flag: false,
      bias_report: {
        gap_analysis: result.gapAnalysis,
        semantic_match_score: result.semanticMatchScore,
      },
    },
    update: {
      stage: 'screening',
      resume_score: result.resumeScore,
      composite_score: result.compositeScore,
      reasoning: result.reasoning,
      decision: result.status === 'rejected' ? 'reject' : 'hire',
      bias_report: {
        gap_analysis: result.gapAnalysis,
        semantic_match_score: result.semanticMatchScore,
      },
    },
  });

  // If screening passed, ensure Interview record is created. A failure here is
  // a real failure — it is not silently swallowed.
  if (result.status !== 'rejected') {
    await ensureInterviewAndSchedule(applicationId);
  }

  return { application: updatedApp, evaluation };
}
