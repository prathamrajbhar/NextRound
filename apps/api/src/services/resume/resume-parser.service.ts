import { generateText } from '../llm/llm.service';
import { logger } from '../../lib/logger';
import type { ParsedResumeData } from './resume-heuristic.service';
import { sanitizeParsedData } from './resume-heuristic.service';
import { buildResumeFieldPrompt, buildResumeParserPrompt } from '../../prompts';

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
    const prompt = buildResumeFieldPrompt({ field, combinedContext });
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

  const prompt = buildResumeParserPrompt(rawText);

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
