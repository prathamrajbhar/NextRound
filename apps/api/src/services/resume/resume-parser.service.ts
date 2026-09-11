import { generateText } from '../llm/llm.service';
import { logger } from '../../lib/logger';
import type { ParsedResumeData } from './resume-heuristic.service';
import { sanitizeParsedData } from './resume-heuristic.service';

export * from './resume-extractor.service';
export * from './resume-heuristic.service';

export interface FieldRegenerationPayload {
  field: 'proudProject' | 'bio' | 'headline';
  rawResumeText?: string;
  socialData?: Record<string, unknown>;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  skills?: string[];
  targetRoles?: string[];
  yearsOfExperience?: string | number;
  currentValue?: string;
}

export async function generateFieldWithGemini(payload: FieldRegenerationPayload): Promise<string> {
  const { field, rawResumeText, socialData, linkedinUrl, githubUrl, portfolioUrl, skills, targetRoles, yearsOfExperience, currentValue } = payload;

  const profileContextParts: string[] = [];

  if (rawResumeText && rawResumeText.trim()) {
    profileContextParts.push(`RESUME TEXT:\n${rawResumeText.trim().slice(0, 8000)}`);
  }
  if (socialData && Object.keys(socialData).length > 0) {
    profileContextParts.push(`GITHUB & LINKEDIN SYNCHRONIZED PROFILES & REPOSITORIES:\n${JSON.stringify(socialData, null, 2).slice(0, 4000)}`);
  }
  if (skills && skills.length > 0) {
    profileContextParts.push(`TECHNICAL SKILLS: ${skills.join(', ')}`);
  }
  if (targetRoles && targetRoles.length > 0) {
    profileContextParts.push(`TARGET ROLES: ${targetRoles.join(', ')}`);
  }
  if (yearsOfExperience) {
    profileContextParts.push(`YEARS OF EXPERIENCE: ${yearsOfExperience}`);
  }
  if (linkedinUrl || githubUrl || portfolioUrl) {
    profileContextParts.push(`ONLINE PROFILES: LinkedIn: ${linkedinUrl || 'N/A'}, GitHub: ${githubUrl || 'N/A'}, Portfolio: ${portfolioUrl || 'N/A'}`);
  }

  if (profileContextParts.length === 0) {
    return currentValue || '';
  }

  const contextParts = [...profileContextParts];
  if (currentValue && currentValue.trim()) {
    contextParts.push(`CURRENT DRAFT: ${currentValue.trim()}`);
  }

  const combinedContext = contextParts.join('\n\n');

  try {
    let fieldInstruction = '';
    if (field === 'proudProject') {
      fieldInstruction = `Synthesize a structured, high-impact description of the candidate's most technically impressive project shipped. Combine insights from their resume text, GitHub repositories/stars, LinkedIn projects, and technical skills. Detail the project title/goal, stack used, architectural contributions, and measurable impact. Write in clear, professional English without preamble or quotation marks.`;
    } else if (field === 'bio') {
      fieldInstruction = `Craft a compelling, executive 2-4 sentence summary/bio for the candidate. Synthesize their experience level, technical stack (from GitHub/resume), engineering focus, major accomplishments, and career aspirations. Do NOT include emails, phone numbers, or addresses. Write directly without preamble or quotation marks.`;
    } else {
      fieldInstruction = `Generate a punchy, modern technical headline (e.g., "Full-Stack & AI Systems Engineer | React, Node.js & PyTorch") combining their top technologies from GitHub, resume, and skills. Write directly without preamble or quotation marks.`;
    }

    const prompt = `You are an elite AI technical recruiter & executive resume strategist.
Using ALL the candidate's provided resources (Resume text, GitHub projects/repos, LinkedIn profile data, technical skills), fulfill the following request:

FIELD REQUEST: ${fieldInstruction}

CANDIDATE RESOURCE CONTEXT:
${combinedContext}

Return ONLY the generated text string for the field without markdown formatting, quotes, or conversational filler.`;

    const responseText = await generateText(prompt);
    return responseText.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    logger.child('ResumeParser').error('Field regeneration error:', error);
    throw error instanceof Error ? error : new Error('Failed to regenerate resume field');
  }
}

export async function parseResumeWithGemini(rawText: string): Promise<ParsedResumeData> {
  if (rawText.trim().length <= 20) {
    throw new Error('Resume text too short for parsing');
  }

  const prompt = `You are an elite AI technical recruiter & executive resume strategist.
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

  try {
    const responseText = await generateText(prompt);
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('AI model did not return a valid JSON object for resume data');
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return sanitizeParsedData(parsed);
  } catch (error) {
    logger.child('ResumeParser').error('LLM resume parsing error:', error);
    throw error instanceof Error ? error : new Error('Failed to parse resume with AI model');
  }
}
