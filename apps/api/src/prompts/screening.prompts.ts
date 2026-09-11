export interface ScreeningPromptOptions {
  jobTitle: string;
  jobDesc: string;
  minScore: number;
  candidateHeadline?: string;
  candidateSkills: string[];
  candidateExp: string | number;
  candidateRawText: string;
}

export function buildScreeningEvaluationPrompt(options: ScreeningPromptOptions): string {
  const {
    jobTitle,
    jobDesc,
    minScore,
    candidateHeadline,
    candidateSkills,
    candidateExp,
    candidateRawText,
  } = options;

  return `You are an elite AI technical screening agent evaluating a job application.

JOB DETAILS:
Title: ${jobTitle}
Description: ${jobDesc.slice(0, 4000)}
Min Passing Score: ${minScore}%

CANDIDATE DETAILS:
Headline: ${candidateHeadline || 'N/A'}
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
}
