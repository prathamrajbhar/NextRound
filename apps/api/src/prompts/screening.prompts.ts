export interface ScreeningPromptOptions {
  jobTitle: string;
  jobDesc: string;
  minScore: number;
  jobExperienceLevel?: string;
  jobSkills?: string[];
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
    jobExperienceLevel,
    jobSkills = [],
    candidateHeadline,
    candidateSkills,
    candidateExp,
    candidateRawText,
  } = options;

  return `You are an elite AI technical screening agent evaluating a job application.

JOB DETAILS:
Title: ${jobTitle}
Target Seniority / Experience Level: ${jobExperienceLevel || 'Not specified'}
Configured Required Skills: ${jobSkills.length > 0 ? jobSkills.join(', ') : 'Not explicitly enumerated'}
Description: ${jobDesc.slice(0, 4000)}
Min Passing Score: ${minScore}%

CANDIDATE DETAILS:
Headline: ${candidateHeadline || 'N/A'}
Skills: ${candidateSkills.join(', ') || 'N/A'}
Years of Experience: ${candidateExp}
Resume Bio / Text: ${candidateRawText.slice(0, 4000)}

DIRECTIVES & FAIR EVALUATION PRINCIPLES:
1. STRICT SENIORITY & EXPERIENCE ALIGNMENT:
   - The role's target seniority level configured by HR is "${jobExperienceLevel || 'Not specified'}".
   - You MUST evaluate candidate experience strictly relative to this target level.
   - If the role is Entry-Level (0-2 Yrs), Junior, or Fresher: Candidates with 0 to 2 years of experience or fresh graduates MUST NOT be penalized for lack of 3+, 5+, or senior years of experience. Do NOT demand senior years if the role level is entry-level.
   - Evaluate whether they have the foundational technical competency, hands-on project work, problem-solving, and core required skills (${jobSkills.join(', ') || 'as described in JD'}).
2. STRICTLY MERIT-BASED & OBJECTIVE: Evaluate solely on demonstrable technical capabilities, domain expertise, project complexity, and direct alignment with job requirements.
3. ZERO BIAS: Completely disregard demographic indicators, name origin, gender, nationality, age, prestige bias (e.g. Ivy League/Tier 1 vs self-taught/state schools), or career breaks/gaps. Do NOT penalize non-traditional education or career transitions if skills are demonstrated.
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
