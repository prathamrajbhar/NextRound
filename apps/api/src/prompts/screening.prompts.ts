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

DIRECTIVES & FAIR EVALUATION PRINCIPLES:
1. STRICTLY MERIT-BASED & OBJECTIVE: Evaluate solely on demonstrable technical capabilities, domain expertise, project complexity, and direct alignment with job requirements.
2. ZERO BIAS: Completely disregard demographic indicators, name origin, gender, nationality, age, prestige bias (e.g. Ivy League/Tier 1 vs self-taught/state schools), or career breaks/gaps. Do NOT penalize non-traditional education or career transitions if skills are demonstrated.
3. SCORING INTEGRITY:
   - "resumeScore": (0-100) Quantitative assessment of candidate's proven competencies against the required job responsibilities.
   - "semanticMatchScore": (0-100) Semantic compatibility of candidate's technical domain and past problem scopes with the job's core challenges.
4. "gapAnalysis": Object detailing "matchingSkills", "missingSkills", "experienceMatch", and "keyStrengths" based purely on technical evidence in the candidate profile.
5. "reasoning": 2-3 sentence fact-based, objective rationale explaining the match scores without subjective or biased language.

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
