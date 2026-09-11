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

    let tech = Math.max(10, Math.min(80, Number(parsed.rubric?.technical) || 30));
    let comm = Math.max(10, Math.min(80, Number(parsed.rubric?.communication) || 20));
    let prob = Math.max(10, Math.min(80, Number(parsed.rubric?.problemSolving) || 25));
    let exp = Math.max(10, Math.min(80, Number(parsed.rubric?.experience) || 25));
    const sum = tech + comm + prob + exp;
    if (sum !== 100) {
      exp = Math.max(10, 100 - (tech + comm + prob));
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
