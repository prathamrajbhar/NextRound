import { generateText } from './llm.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');

export interface ParsedResumeData {
  fullName?: string;
  headline?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  yearsOfExperience?: number;
  skills: string[];
  targetRoles: string[];
  targetLocations?: string[];
  workMode?: 'Remote' | 'Hybrid' | 'Onsite';
  currentCtc?: number;
  expectedSalary?: number;
  noticePeriod?: string;
  workAuthorization?: string;
  bio?: string;
  proudProject?: string;
  workValues?: string[];
}

/**
 * Normalizes letter-spaced resume headings like "P R O F E S S I O N A L  S U M M A R Y"
 */
function normalizeResumeText(text: string): string {
  let cleaned = text.replace(/P\s+R\s+O\s+F\s+E\s+S\s+S\s+I\s+O\s+N\s+A\s+L\s+S\s+U\s+M\s+M\s+A\s+R\s+Y/gi, 'PROFESSIONAL SUMMARY');
  cleaned = cleaned.replace(/E\s+X\s+P\s+E\s+R\s+I\s+E\s+N\s+C\s+E/gi, 'EXPERIENCE');
  cleaned = cleaned.replace(/E\s+D\s+U\s+C\s+A\s+T\s+I\s+O\s+N/gi, 'EDUCATION');
  cleaned = cleaned.replace(/P\s+R\s+O\s+J\s+E\s+C\s+T\s+S/gi, 'PROJECTS');
  cleaned = cleaned.replace(/S\s+K\s+I\s+L\s+L\s+S/gi, 'SKILLS');
  return cleaned;
}

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

/**
 * Synthesizes a single candidate profile field (e.g. proudProject, bio, headline) using ALL available candidate resources.
 */
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
  } catch (err) {
    console.error('Field regeneration error:', err);
    return currentValue || '';
  }
}

/**
 * Extracts plain text from an uploaded file buffer (PDF or plain text).
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const isPdf = mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      if (data && typeof data.text === 'string' && data.text.trim().length > 0) {
        return normalizeResumeText(data.text.trim());
      }
    } catch (err) {
      console.error('Failed to extract text using PDFParse:', err);
    }
  }

  // Fallback / plain text handling
  const rawText = buffer.toString('utf-8');
  const cleaned = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
  return normalizeResumeText(cleaned);
}

/**
 * Parses raw resume text into structured candidate profile fields using Gemini LLM.
 */
export async function parseResumeWithGemini(rawText: string): Promise<ParsedResumeData> {
  if (rawText.length > 20) {
    try {
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

      const responseText = await generateText(prompt);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return sanitizeParsedData(parsed, rawText);
      }
    } catch (err) {
      console.error('LLM resume parsing error:', err);
    }
  }

  // Heuristic fallback if Gemini API is not configured or fails
  return fallbackHeuristicParsing(rawText);
}

function sanitizeParsedData(data: Record<string, unknown>, rawText: string): ParsedResumeData {
  const toString = (...vals: unknown[]): string | undefined => {
    for (const val of vals) {
      if (typeof val === 'string' && val.trim().length > 0) return val.trim();
    }
    return undefined;
  };

  const toNumber = (...vals: unknown[]): number | undefined => {
    for (const val of vals) {
      if (typeof val === 'number' && !isNaN(val)) return val;
      if (typeof val === 'string' && !isNaN(Number(val.trim()))) return Number(val.trim());
    }
    return undefined;
  };

  const toStringArray = (...vals: unknown[]): string[] => {
    for (const val of vals) {
      if (Array.isArray(val)) {
        const arr = val.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
        if (arr.length > 0) return arr;
      }
    }
    return [];
  };

  const heuristic = fallbackHeuristicParsing(rawText);

  const fullName = toString(data.fullName, data.full_name, data.name, data.candidateName) || heuristic.fullName;
  const headline = toString(data.headline, data.professionalHeadline, data.title, data.currentRole, data.role) || heuristic.headline;
  const phone = toString(data.phone, data.phone_number, data.phoneNumber, data.mobile) || heuristic.phone;
  const location = toString(data.location, data.currentLocation, data.address, data.city) || heuristic.location;
  const timezone = toString(data.timezone) || heuristic.timezone || 'Asia/Kolkata';

  let linkedinUrl = toString(data.linkedinUrl, data.linkedin) || heuristic.linkedinUrl;
  if (linkedinUrl && !linkedinUrl.startsWith('http')) {
    linkedinUrl = `https://${linkedinUrl}`;
  }

  let githubUrl = toString(data.githubUrl, data.github) || heuristic.githubUrl;
  if (githubUrl && !githubUrl.startsWith('http')) {
    githubUrl = `https://${githubUrl}`;
  }

  let portfolioUrl = toString(data.portfolioUrl, data.portfolio, data.website) || heuristic.portfolioUrl;
  if (portfolioUrl && !portfolioUrl.startsWith('http')) {
    portfolioUrl = `https://${portfolioUrl}`;
  }

  const skills = Array.from(new Set([...toStringArray(data.skills), ...(heuristic.skills || [])]));

  // Dynamically infer targetRoles if empty
  let targetRoles = toStringArray(data.targetRoles, data.roles);
  if (targetRoles.length === 0) {
    if (headline) {
      targetRoles.push(headline);
    }
    if (skills.includes('React') || skills.includes('TypeScript') || skills.includes('Node.js')) {
      targetRoles.push('Full-Stack Engineer');
    }
    if (skills.includes('Python') || skills.includes('FastAPI') || skills.includes('LangChain') || skills.includes('PyTorch')) {
      targetRoles.push('AI/ML Engineer');
    }
    targetRoles = Array.from(new Set(targetRoles));
  }

  const targetLocations = toStringArray(data.targetLocations);
  const yearsOfExperience = toNumber(data.yearsOfExperience, data.experienceYears) ?? heuristic.yearsOfExperience;

  const workModeStr = toString(data.workMode);
  const workMode = ['Remote', 'Hybrid', 'Onsite'].includes(workModeStr || '')
    ? (workModeStr as 'Remote' | 'Hybrid' | 'Onsite')
    : 'Remote';

  let bio = toString(data.bio, data.summary, data.professionalSummary) || heuristic.bio;
  // Clean header lines from bio if Gemini returned contact headers
  if (bio && (bio.includes('@') || bio.includes('+91') || bio.includes('http'))) {
    bio = bio
      .split('\n')
      .filter((line) => !line.includes('@') && !line.includes('+') && !line.includes('http') && line.length > 15)
      .join(' ')
      .trim();
  }

  const proudProject = toString(data.proudProject, data.keyProject, data.featuredProject) || heuristic.proudProject;
  const currentCtc = toNumber(data.currentCtc);
  const expectedSalary = toNumber(data.expectedSalary);
  const noticePeriod = toString(data.noticePeriod) || '30 days';
  const workAuthorization = toString(data.workAuthorization) || 'Authorized';

  return {
    fullName,
    headline,
    phone,
    location,
    timezone,
    linkedinUrl,
    githubUrl,
    portfolioUrl,
    yearsOfExperience,
    skills,
    targetRoles,
    targetLocations,
    workMode,
    bio,
    proudProject,
    currentCtc,
    expectedSalary,
    noticePeriod,
    workAuthorization,
  };
}

function fallbackHeuristicParsing(rawText: string): ParsedResumeData {
  const normalized = normalizeResumeText(rawText);
  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);

  let fullName: string | undefined;
  let headline: string | undefined;

  for (const line of lines.slice(0, 6)) {
    if (
      !fullName &&
      line.length >= 2 &&
      line.length <= 40 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !/resume|curriculum|cv|summary|experience|education|skills|projects|contact/i.test(line)
    ) {
      fullName = line.replace(/^[^\w]+|[^\w]+$/g, '');
      continue;
    }
    if (
      fullName &&
      !headline &&
      line.length >= 3 &&
      line.length <= 60 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !/summary|experience|education|skills|projects|contact/i.test(line)
    ) {
      headline = line;
      break;
    }
  }

  // Location match
  const locationMatch = normalized.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s*\d{5,6})?)/);
  const location = locationMatch ? locationMatch[1] : undefined;

  // Contact links
  const linkedinMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const portfolioMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9_-]+\.(?:tech|io|dev|com|me|design)/i);
  const phoneMatch = normalized.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

  // Extract date ranges for years of experience
  const dateYears = normalized.match(/\b(20\d{2})\b/g);
  let yearsOfExperience: number | undefined;
  if (dateYears && dateYears.length >= 2) {
    const years = dateYears.map(Number).sort((a, b) => a - b);
    const minYear = years[0];
    const maxYear = new Date().getFullYear();
    yearsOfExperience = Math.min(Math.max(maxYear - minYear, 1), 30);
  }

  const skills: string[] = [];
  const commonSkills = [
    'TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js', 'Express.js', 'FastAPI', 'Python', 'Go',
    'Java', 'C++', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
    'AWS', 'GCP', 'GraphQL', 'REST API', 'Tailwind', 'Git', 'LangChain', 'PyTorch'
  ];

  commonSkills.forEach((skill) => {
    const escaped = skill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(normalized)) {
      skills.push(skill);
    }
  });

  const targetRoles: string[] = [];
  if (headline) targetRoles.push(headline);
  if (skills.includes('React') || skills.includes('Next.js')) targetRoles.push('Full-Stack Engineer');
  if (skills.includes('Python') || skills.includes('FastAPI')) targetRoles.push('AI/ML Engineer');

  // Extract bio summary paragraph
  let bio: string | undefined;
  const summaryIdx = normalized.search(/PROFESSIONAL SUMMARY|SUMMARY|PROFILE|ABOUT ME/i);
  if (summaryIdx !== -1) {
    const snippet = normalized.slice(summaryIdx, summaryIdx + 500);
    bio = snippet
      .replace(/PROFESSIONAL SUMMARY|SUMMARY|PROFILE|ABOUT ME/i, '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 20 && !l.includes('@') && !l.includes('http') && !l.includes('+91'))
      .join(' ')
      .trim();
  }
  if (!bio || bio.length < 20) {
    bio = `Full-stack & AI software engineer experienced in building real-world applications using ${skills.slice(0, 5).join(', ')}.`;
  }

  // Extract project highlight paragraph
  let proudProject: string | undefined;
  const projectIdx = normalized.search(/PROJECTS|FEATURED PROJECTS|KEY PROJECTS|EXPERIENCE/i);
  if (projectIdx !== -1) {
    const snippet = normalized.slice(projectIdx, projectIdx + 600);
    proudProject = snippet
      .replace(/PROJECTS|FEATURED PROJECTS|KEY PROJECTS|EXPERIENCE/i, '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 20 && !l.includes('@') && !l.includes('http'))
      .slice(0, 4)
      .join(' ')
      .trim();
  }
  if (!proudProject || proudProject.length < 20) {
    proudProject = `Built full-stack web and AI application using ${skills.slice(0, 4).join(', ')} with real-time API integrations and cloud database.`;
  }

  return {
    fullName,
    headline,
    location,
    phone: phoneMatch ? phoneMatch[0] : undefined,
    linkedinUrl: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : undefined,
    githubUrl: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : undefined,
    portfolioUrl: portfolioMatch ? (portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`) : undefined,
    yearsOfExperience,
    skills,
    targetRoles: Array.from(new Set(targetRoles)),
    bio,
    proudProject,
  };
}
