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

export interface GenerateJdPromptOptions {
  prompt?: string;
  title?: string;
  department?: string;
  experienceLevel?: string;
  locationType?: string;
  keySkills?: string;
  objectives?: string;
  tone?: string;
}

export function buildGenerateJdPrompt(options: GenerateJdPromptOptions): string {
  const {
    prompt: userPrompt = '',
    title = '',
    department = 'Engineering',
    experienceLevel = 'Senior',
    locationType = 'Remote',
  } = options;

  return `You are an executive talent acquisition specialist and world-class job description copywriter for high-growth tech companies.
Draft an exceptional, comprehensive, and attractive Job Description based on the recruiter's instructions:

RECRUITER'S REQUIREMENTS / INSTRUCTIONS:
${userPrompt || title || 'Create a world-class job description for this role.'}

ROLE CONTEXT (IF KNOWN):
- Proposed Title: ${title || 'Infer from recruiter instructions'}
- Department: ${department}
- Seniority / Level: ${experienceLevel || 'Mid-Level'}
- Work Location Model: ${locationType}

OUTPUT REQUIREMENTS:
1. "description": Write an articulate, beautifully formatted Markdown job description with these distinct sections:
   - ### Role Overview: 2-3 engaging paragraphs explaining the mission, team context, and why this position matters.
   - ### Key Responsibilities: 5-7 clear, action-oriented bullet points outlining day-to-day deliverables and strategic duties.
   - ### What You Bring (Requirements): 5-7 realistic, competence-based qualifications (technical proficiencies, problem-solving, collaboration).
     CRITICAL: Strictly align the required years of experience and depth with the Seniority / Level ("${experienceLevel || 'Mid-Level'}"). If the level is Entry-Level (0-2 Yrs), Junior, or Fresher, you MUST NOT ask for 3+, 5+, or senior years of experience. Instead, focus on 0-2 years, foundational competence, academic/personal projects, and learning velocity.
   - ### Nice to Have: 3-4 bonus skills or domain experience that would make an applicant stand out.
   - ### What We Offer: 3-4 compelling points on compensation, career acceleration, ownership, and modern culture.
   Keep language inclusive, bias-free, and engaging. Avoid cliché buzzwords like 'rockstar' or 'ninja'.
2. "detectedTitle": Infer or refine the most accurate job title from the prompt (e.g., "Senior Fullstack Engineer").
3. "skills": Array of 4-8 core technical skill chips (e.g., ["React", "TypeScript", "Node.js"]).
4. "softSkills": Array of 3-5 behavioral competencies (e.g., ["Systems Thinking", "Cross-Functional Collaboration"]).
5. "cultureKeywords": Array of 3-5 work value keywords (e.g., ["Extreme Ownership", "Continuous Learning"]).
6. "rubric": Suggested candidate scoring percentages (technical, communication, problemSolving, experience) summing to EXACTLY 100.

Return ONLY a valid JSON object matching this schema:
{
  "description": string,
  "detectedTitle": string,
  "skills": string[],
  "softSkills": string[],
  "cultureKeywords": string[],
  "rubric": {
    "technical": number,
    "communication": number,
    "problemSolving": number,
    "experience": number
  }
}`;
}


