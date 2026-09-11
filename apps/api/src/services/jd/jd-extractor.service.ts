import { generateText } from '../llm/llm.service';
import { logger } from '../../lib/logger';

export interface ExtractedRequirements {
  skills: string[];
  softSkills: string[];
  cultureKeywords: string[];
  rubric: {
    technical: number;
    communication: number;
    problemSolving: number;
    experience: number;
  };
  enhancedDescription?: string;
}

export async function extractRequirementsFromJd(
  description: string,
  title?: string
): Promise<ExtractedRequirements> {
  if (description.trim().length <= 15) {
    throw new Error('Job description too short for requirement extraction');
  }

  const prompt = `You are an expert AI recruiter and technical talent architect.
Analyze the following job title and job description text. Extract real, precise requirements directly present or implied in the text.

JOB TITLE: ${title || 'Not specified'}
JOB DESCRIPTION:
${description.slice(0, 12000)}

DIRECTIVES:
1. "skills": Extract 3-10 core technical skills, programming languages, frameworks, vector databases, AI/ML tools, APIs, cloud platforms, or domain tools mentioned or directly implied.
2. "softSkills": Extract 2-5 soft skills, interpersonal traits, or leadership capabilities mentioned or implied (e.g., "Stakeholder Management", "Cross-functional Collaboration", "Analytical Thinking").
3. "cultureKeywords": Extract 2-5 company culture, mindset, or work value keywords (e.g., "Innovation", "Fast Execution", "Quality Focus", "Customer Obsessed").
4. "rubric": Suggest balanced evaluation weights percentage (technical, communication, problemSolving, experience) summing to EXACTLY 100 based on the job role type.
5. "enhancedDescription": Provide a clean, structured, ATS-friendly markdown job description with headers (Role Overview, Responsibilities, Requirements, Preferred Qualifications).

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
