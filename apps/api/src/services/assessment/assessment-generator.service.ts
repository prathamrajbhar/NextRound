import { generateText } from '../llm/llm.service';
import { logger } from '../../lib/logger';
import { buildAssessmentQuestionGenPrompt } from '../../prompts/assessment-generator.prompts';

export interface GeneratedAssessmentQuestion {
  id: string;
  difficulty: 'easy' | 'intermediate' | 'advanced';
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GenerateAssessmentQuestionsInput {
  title?: string;
  description: string;
  skills?: string[];
  experienceLevel?: string;
  countPerTier?: number;
}

function extractJsonPayload(text: string): Record<string, any> {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();

  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');
  if (firstOpen === -1 || lastClose === -1 || lastClose <= firstOpen) {
    throw new Error('AI model did not return a valid JSON object');
  }

  const jsonStr = cleaned.slice(firstOpen, lastClose + 1);
  return JSON.parse(jsonStr);
}

export async function generateJdAssessmentQuestions(
  input: GenerateAssessmentQuestionsInput
): Promise<GeneratedAssessmentQuestion[]> {
  const { description, countPerTier = 4 } = input;
  if (!description || description.trim().length < 15) {
    throw new Error('Job description is required to generate assessment questions');
  }

  const prompt = buildAssessmentQuestionGenPrompt({
    ...input,
    countPerTier,
  });

  try {
    const rawResponse = await generateText(prompt);
    const parsed = extractJsonPayload(rawResponse);
    const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];

    const validatedQuestions: GeneratedAssessmentQuestion[] = [];
    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i];
      if (!q || typeof q.question !== 'string' || !Array.isArray(q.options) || q.options.length < 2) {
        continue;
      }

      let diff: 'easy' | 'intermediate' | 'advanced' = 'intermediate';
      const rawDiff = String(q.difficulty || '').toLowerCase();
      if (rawDiff.includes('easy')) diff = 'easy';
      else if (rawDiff.includes('adv')) diff = 'advanced';

      const correct = Number(q.correctIndex);
      const safeCorrectIndex = Number.isInteger(correct) && correct >= 0 && correct < q.options.length ? correct : 0;

      validatedQuestions.push({
        id: typeof q.id === 'string' && q.id.trim() ? q.id.trim() : `q_${diff}_${i + 1}`,
        difficulty: diff,
        category: typeof q.category === 'string' && q.category.trim() ? q.category.trim() : 'General Technical',
        question: q.question.trim(),
        options: q.options.map((opt: unknown) => String(opt || '').trim()).filter(Boolean),
        correctIndex: safeCorrectIndex,
        explanation: typeof q.explanation === 'string' ? q.explanation.trim() : '',
      });
    }

    if (validatedQuestions.length === 0) {
      throw new Error('AI model produced no valid assessment questions.');
    }

    return validatedQuestions;
  } catch (err) {
    logger.child('AssessmentGenerator').error('Failed to generate assessment questions from JD:', err);
    throw err instanceof Error ? err : new Error('Assessment question generation failed');
  }
}
