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

  const contextParts: string[] = [];

  if (rawResumeText && rawResumeText.trim()) {
    contextParts.push(`RESUME TEXT:\n${rawResumeText.trim().slice(0, 8000)}`);
  }
  if (socialData && Object.keys(socialData).length > 0) {
    contextParts.push(`GITHUB & LINKEDIN SYNCHRONIZED PROFILES & REPOSITORIES:\n${JSON.stringify(socialData, null, 2).slice(0, 4000)}`);
  }
  if (skills && skills.length > 0) {
    contextParts.push(`TECHNICAL SKILLS: ${skills.join(', ')}`);
  }
  if (targetRoles && targetRoles.length > 0) {
    contextParts.push(`TARGET ROLES: ${targetRoles.join(', ')}`);
  }
  if (yearsOfExperience) {
    contextParts.push(`YEARS OF EXPERIENCE: ${yearsOfExperience}`);
  }
  if (linkedinUrl || githubUrl || portfolioUrl) {
    contextParts.push(`ONLINE PROFILES: LinkedIn: ${linkedinUrl || 'N/A'}, GitHub: ${githubUrl || 'N/A'}, Portfolio: ${portfolioUrl || 'N/A'}`);
  }
  if (currentValue && currentValue.trim()) {
    contextParts.push(`CURRENT DRAFT: ${currentValue.trim()}`);
  }

  const combinedContext = contextParts.join('\n\n');

  if (combinedContext.trim().length === 0) {
    return currentValue || '';
  }

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

  const prompt = `You are an executive AI recruiter & professional technical resume strategist.
Analyze the candidate's uploaded raw resume text. DO NOT simply copy-paste raw text snippets ("take and put"). Instead, synthesize, elevate, and craft polished, recruiter-ready profile fields based strictly on the uploaded resume content.

WRITING & SYNTHESIS DIRECTIVES:
1. "headline": Synthesize a punchy, modern technical headline highlighting their primary engineering focus and core stack (e.g., "Full-Stack & AI Systems Engineer | React, Node.js & PyTorch").
2. "bio": Craft a polished, high-impact 2-4 sentence executive professional summary synthesizing candidate's specialization, technical depth, major project accomplishments, and engineering focus. DO NOT include email, phone, address, or raw resume header lines.
3. "proudProject": Identify their most technically complex or impactful project from the uploaded resume. Rewrite it into an engaging narrative detailing the project objective, key technologies used, candidate's key architectural/code contributions, and measurable results.
4. "skills": Extract all technical skills, programming languages, frameworks, databases, cloud tools, and libraries found in the resume.
5. "targetRoles": Infer 2-4 strategic target job titles tailored to their experience and tech stack.

JSON SCHEMAS TO RETURN:
- "fullName": candidate's exact full name (e.g. "Pratham Rajbhar" or "Marcus Vance")
- "headline": synthesized professional title/headline
- "location": candidate's city, state, or country
- "phone": contact phone number
- "timezone": inferred IANA timezone string (e.g. "Asia/Kolkata", "America/New_York", "Europe/London")
- "linkedinUrl": complete LinkedIn URL if present
- "githubUrl": complete GitHub URL if present
- "portfolioUrl": personal portfolio / blog website URL if present
- "yearsOfExperience": total numerical years of experience (e.g. 3)
- "skills": string array of tech skills
- "targetRoles": string array of 2-4 target job roles
- "targetLocations": string array of target locations
- "workMode": "Remote" | "Hybrid" | "Onsite"
- "bio": synthesized 2-4 sentence executive summary
- "proudProject": synthesized narrative of their top project
- "currentCtc": numerical estimated/stated annual salary
- "expectedSalary": numerical target annual salary based on experience
- "noticePeriod": "Immediate" | "1-2 weeks" | "30 days" | "60+ days" | "90 days"
- "workAuthorization": "Authorized" | "Sponsorship Required" | "Student / On Work Permit"

Return ONLY a valid raw JSON object without markdown formatting.

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
