export interface JdPromptOptions {
  title?: string;
  description: string;
}

export function buildJdRequirementsPrompt(options: JdPromptOptions): string {
  const { title, description } = options;

  return `You are an expert AI recruiter and technical talent architect.
Analyze the following job title and job description text. Extract real, precise requirements directly present or implied in the text.

JOB TITLE: ${title || 'Not specified'}
JOB DESCRIPTION:
${description.slice(0, 12000)}

DIRECTIVES:
1. "skills": Extract 3-10 core technical skills, programming languages, frameworks, vector databases, AI/ML tools, APIs, cloud platforms, or domain tools mentioned or directly implied. Focus strictly on competence, not arbitrary credential barriers.
2. "softSkills": Extract 2-5 soft skills, interpersonal traits, or leadership capabilities mentioned or implied (e.g., "Stakeholder Management", "Cross-functional Collaboration", "Analytical Thinking").
3. "cultureKeywords": Extract 2-5 company culture, mindset, or work value keywords (e.g., "Innovation", "Fast Execution", "Quality Focus", "Customer Obsessed").
4. "rubric": Suggest balanced evaluation weights percentage (technical, communication, problemSolving, experience) summing to EXACTLY 100 based on the job role type.
5. "enhancedDescription": Provide a clean, structured, ATS-friendly markdown job description with headers (Role Overview, Responsibilities, Requirements, Preferred Qualifications). Use inclusive, gender-neutral language (no gendered idioms or aggressive 'rockstar/ninja' tropes) and avoid exclusionary pedigree requirements (e.g. do not require specific top-tier colleges or elitist degrees).

Return ONLY a valid JSON object matching this schema:
{
  "skills": string[],
  "softSkills": string[],
  "cultureKeywords": string[],
  "rubric": {
    "technical": number,
    "communication": number,
    "problemSolving": number,
    "experience": number
  },
  "enhancedDescription": string
}`;
}
