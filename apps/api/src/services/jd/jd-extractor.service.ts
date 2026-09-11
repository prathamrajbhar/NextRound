import { generateText } from '../llm/llm.service';
import { logger } from '../../lib/logger';
import { buildJdRequirementsPrompt } from '../../prompts';

export interface RubricSuggestion {
  technical: number;
  communication: number;
  problemSolving: number;
  experience: number;
  [key: string]: number;
}

export interface ExtractedRequirements {
  skills: string[];
  softSkills: string[];
  cultureKeywords: string[];
  rubric: RubricSuggestion;
  enhancedDescription: string;
}

export async function extractRequirementsFromJd(
  description: string,
  title?: string
): Promise<ExtractedRequirements> {
  if (description.trim().length <= 15) {
    throw new Error('Job description too short for requirement extraction');
  }

  const prompt = buildJdRequirementsPrompt({ description, title });

  try {
    const text = await generateText(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI model did not return a valid JSON object for job requirements');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const parseDim = (val: unknown, defaultVal: number): number => {
      const n = Number(val);
      if (val !== undefined && val !== null && !isNaN(n)) {
        return Math.max(10, Math.min(80, n));
      }
      return defaultVal;
    };

    let tech = parseDim(parsed.rubric?.technical, 30);
    let comm = parseDim(parsed.rubric?.communication, 20);
    let prob = parseDim(parsed.rubric?.problemSolving, 25);
    let exp = parseDim(parsed.rubric?.experience, 25);
    const sum = tech + comm + prob + exp;
    if (sum !== 100) {
      exp = 100 - (tech + comm + prob);
      if (exp < 10) {
        const excess = 10 - exp;
        exp = 10;
        if (tech >= comm && tech >= prob) tech -= excess;
        else if (comm >= prob) comm -= excess;
        else prob -= excess;
      }
    }

    return {
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        : [],
      softSkills: Array.isArray(parsed.softSkills)
        ? parsed.softSkills.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        : [],
      cultureKeywords: Array.isArray(parsed.cultureKeywords)
        ? parsed.cultureKeywords.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        : [],
      rubric: { technical: tech, communication: comm, problemSolving: prob, experience: exp },
      enhancedDescription: typeof parsed.enhancedDescription === 'string' ? parsed.enhancedDescription : undefined,
    };
  } catch (err) {
    logger.child('JDExtractor').error('JD requirement extraction error:', err);
    throw err instanceof Error ? err : new Error('Failed to extract job requirements from AI model');
  }
}

export interface GenerateJdInput {
  prompt?: string;
  title?: string;
  department?: string;
  experienceLevel?: string;
  locationType?: string;
  keySkills?: string;
  objectives?: string;
  tone?: string;
}

export interface GeneratedJdOutput {
  description: string;
  detectedTitle?: string;
  skills: string[];
  softSkills: string[];
  cultureKeywords: string[];
  rubric: RubricSuggestion;
}

export async function generateProfessionalJd(
  input: GenerateJdInput
): Promise<GeneratedJdOutput> {
  const userText = (input.prompt || input.title || '').trim();
  if (userText.length === 0) {
    throw new Error('Please enter some details or keywords about the job you want to generate.');
  }

  const { buildGenerateJdPrompt } = await import('../../prompts/jd.prompts');
  const prompt = buildGenerateJdPrompt(input);

  try {
    const text = await generateText(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI model did not return a valid JSON object for generated job description');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const parseDim = (val: unknown, defaultVal: number): number => {
      const n = Number(val);
      if (val !== undefined && val !== null && !isNaN(n)) {
        return Math.max(10, Math.min(80, n));
      }
      return defaultVal;
    };

    let tech = parseDim(parsed.rubric?.technical, 30);
    let comm = parseDim(parsed.rubric?.communication, 20);
    let prob = parseDim(parsed.rubric?.problemSolving, 25);
    let exp = parseDim(parsed.rubric?.experience, 25);
    const sum = tech + comm + prob + exp;
    if (sum !== 100) {
      exp = 100 - (tech + comm + prob);
      if (exp < 10) {
        const excess = 10 - exp;
        exp = 10;
        if (tech >= comm && tech >= prob) tech -= excess;
        else if (comm >= prob) comm -= excess;
        else prob -= excess;
      }
    }

    return {
      description: typeof parsed.description === 'string' ? parsed.description : '',
      detectedTitle: typeof parsed.detectedTitle === 'string' ? parsed.detectedTitle : undefined,
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        : [],
      softSkills: Array.isArray(parsed.softSkills)
        ? parsed.softSkills.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        : [],
      cultureKeywords: Array.isArray(parsed.cultureKeywords)
        ? parsed.cultureKeywords.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        : [],
      rubric: { technical: tech, communication: comm, problemSolving: prob, experience: exp },
    };
  } catch (err) {
    logger.child('JDExtractor').error('Generate professional JD error:', err);
    throw err instanceof Error ? err : new Error('Failed to generate professional job description');
  }
}


