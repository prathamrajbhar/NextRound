export interface FieldPromptOptions {
  field: 'proudProject' | 'bio' | 'headline';
  combinedContext: string;
}

export function buildResumeFieldPrompt(options: FieldPromptOptions): string {
  let fieldInstruction = '';
  if (options.field === 'proudProject') {
    fieldInstruction = `Synthesize a structured, high-impact description of the candidate's most technically impressive project shipped. Combine insights from their resume text, GitHub repositories/stars, LinkedIn projects, and technical skills. Detail the project title/goal, stack used, architectural contributions, and measurable impact. Write in clear, professional English without preamble or quotation marks.`;
  } else if (options.field === 'bio') {
    fieldInstruction = `Craft a compelling, executive 2-4 sentence summary/bio for the candidate. Synthesize their experience level, technical stack (from GitHub/resume), engineering focus, major accomplishments, and career aspirations. Do NOT include emails, phone numbers, or addresses. Write directly without preamble or quotation marks.`;
  } else {
    fieldInstruction = `Generate a punchy, modern technical headline (e.g., "Full-Stack & AI Systems Engineer | React, Node.js & PyTorch") combining their top technologies from GitHub, resume, and skills. Write directly without preamble or quotation marks.`;
  }

  return `You are an elite AI technical recruiter & executive resume strategist.
Using ALL the candidate's provided resources (Resume text, GitHub projects/repos, LinkedIn profile data, technical skills), fulfill the following request:

FIELD REQUEST: ${fieldInstruction}

CANDIDATE RESOURCE CONTEXT:
${options.combinedContext}

Return ONLY the generated text string for the field without markdown formatting, quotes, or conversational filler.`;
}

export function buildResumeParserPrompt(rawText: string): string {
  return `You are an elite AI technical recruiter & executive resume strategist.
Analyze the candidate's raw resume text and extract high-precision profile data.

EXTRACTION & SYNTHESIS RULES:
1. "fullName": The candidate's actual personal name found at the top of the resume. NEVER output a job title (e.g. "Software Engineer"), degree, section header, or generic phrase. If uncertain, return null.
2. "headline": Synthesize a punchy, modern technical headline reflecting their actual engineering roles and core stack (e.g. "Full-Stack Engineer | React, Node.js & TypeScript" or "Backend & Cloud Engineer | Go & Kubernetes").
3. "bio": A polished 2-4 sentence executive summary of the candidate's experience, technical depth, major engineering accomplishments, and domains. Grounded strictly in facts from the resume. NEVER invent past companies or credentials. Do NOT include email, phone, or links.
4. "proudProject": Identify the most technically complex or impactful project described in the resume. Rewrite into a narrative covering project objective, tech stack, key architectural/coding contributions, and measurable impact.
5. "skills": Extract all verifiable technical skills, languages, frameworks, libraries, databases, and cloud tools explicitly mentioned in the resume.
6. "targetRoles": Infer 2-3 realistic target job titles strictly aligned with the candidate's demonstrated skill set and past roles.
7. "yearsOfExperience": Estimated total numerical years of full-time professional experience. For new graduates/students without full-time roles, return 0.
8. "currentCtc" & "expectedSalary": Resumes rarely state salary. Return null UNLESS an explicit numerical annual salary/compensation is unambiguously stated in the text. NEVER guess, estimate, or hallucinate salary numbers.
9. "noticePeriod": Return "Immediate", "15 days", "30 days", "60 days", or "90 days" ONLY if explicitly mentioned in the resume text. Otherwise return null.
10. "workMode": Return "Remote", "Hybrid", or "Onsite" ONLY if explicitly stated as a preference or current status. Otherwise return null.
11. "workAuthorization": Return "Authorized", "Sponsorship Required", or "Student / On Work Permit" ONLY if explicitly stated in the resume. Otherwise return null.

JSON SCHEMAS TO RETURN:
{
  "fullName": string | null,
  "headline": string | null,
  "location": string | null,
  "phone": string | null,
  "timezone": string | null,
  "linkedinUrl": string | null,
  "githubUrl": string | null,
  "portfolioUrl": string | null,
  "yearsOfExperience": number | null,
  "skills": string[],
  "targetRoles": string[],
  "targetLocations": string[],
  "workMode": "Remote" | "Hybrid" | "Onsite" | null,
  "bio": string | null,
  "proudProject": string | null,
  "currentCtc": number | null,
  "expectedSalary": number | null,
  "noticePeriod": "Immediate" | "15 days" | "30 days" | "60 days" | "90 days" | null,
  "workAuthorization": "Authorized" | "Sponsorship Required" | "Student / On Work Permit" | null
}

Return ONLY a valid raw JSON object without markdown fences, explanation, or conversational filler.

RESUME CONTENT:
${rawText.slice(0, 12000)}`;
}
