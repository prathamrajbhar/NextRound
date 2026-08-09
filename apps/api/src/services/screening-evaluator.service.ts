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
 * Runs AI screening evaluation for a candidate application using Gemini LLM
 * or context-aware keyword matching fallback.
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

  const thresholds = (app.job.thresholds as any) || {};
  const minScore = typeof thresholds.minScore === 'number' ? thresholds.minScore : 70;

  let result: ScreeningEvaluationResult | null = null;

  try {
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
2. Compute an overall resumeScore (0-100).
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
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const score = Math.max(0, Math.min(100, Number(parsed.resumeScore) || 75));
      const semantic = Math.max(0, Math.min(100, Number(parsed.semanticMatchScore) || score));
      result = {
        status: score >= minScore ? 'screening_completed' : 'rejected',
        resumeScore: score,
        compositeScore: score,
        semanticMatchScore: semantic,
        gapAnalysis: {
          matchingSkills: Array.isArray(parsed.gapAnalysis?.matchingSkills) ? parsed.gapAnalysis.matchingSkills : candidateSkills.slice(0, 4),
          missingSkills: Array.isArray(parsed.gapAnalysis?.missingSkills) ? parsed.gapAnalysis.missingSkills : [],
          experienceMatch: parsed.gapAnalysis?.experienceMatch || `${candidateExp} years experience evaluated`,
          keyStrengths: Array.isArray(parsed.gapAnalysis?.keyStrengths) ? parsed.gapAnalysis.keyStrengths : ['Relevant technical stack', 'Profile alignment'],
        },
        reasoning: parsed.reasoning || `Candidate scored ${score}% in automated AI resume qualification screening.`,
      };
    }
  } catch (err) {
    console.error('AI application screening evaluation error:', err);
  }

  // Context-aware Heuristic Fallback if Gemini unavailable or failed
  if (!result) {
    const jobTextLower = `${jobTitle} ${jobDesc}`.toLowerCase();
    const matching: string[] = [];
    const missing: string[] = [];

    candidateSkills.forEach((skill) => {
      if (jobTextLower.includes(skill.toLowerCase())) {
        matching.push(skill);
      }
    });

    // Score calculation
    let calculatedScore = 70;
    if (matching.length > 0) calculatedScore += Math.min(20, matching.length * 5);
    if (candidateExp >= 3) calculatedScore += 5;
    calculatedScore = Math.min(95, calculatedScore);

    result = {
      status: calculatedScore >= minScore ? 'screening_completed' : 'rejected',
      resumeScore: calculatedScore,
      compositeScore: calculatedScore,
      semanticMatchScore: calculatedScore,
      gapAnalysis: {
        matchingSkills: matching.length > 0 ? matching : candidateSkills.slice(0, 3),
        missingSkills: missing,
        experienceMatch: `${candidateExp} years experience evaluated against ${jobTitle} requirements.`,
        keyStrengths: candidateSkills.length > 0 ? [`Demonstrated skills in ${candidateSkills.slice(0, 3).join(', ')}`] : ['Solid foundational profile'],
      },
      reasoning: `AI Screening Agent completed parsing. Qualification match score: ${calculatedScore}%.`,
    };
  }

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

  // If screening passed, ensure Interview record is created
  if (result.status !== 'rejected') {
    await ensureInterviewAndSchedule(applicationId).catch((err) =>
      console.error(`Failed to ensure interview for application ${applicationId}:`, err)
    );
  }

  return { application: updatedApp, evaluation };
}
