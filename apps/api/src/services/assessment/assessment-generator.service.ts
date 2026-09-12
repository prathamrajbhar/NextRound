import { generateText } from '../llm/llm.service';
import { logger } from '../../lib/logger';
import {
  buildAssessmentQuestionGenPrompt,
  AssessmentDifficulty,
  AssessmentDifficultyDistribution,
} from '../../prompts/assessment-generator.prompts';

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
  difficulty?: AssessmentDifficulty;
  categoryDistribution?: Record<string, number>;
  distribution?: Partial<AssessmentDifficultyDistribution>;
  totalCount?: number;
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
  const { description } = input;
  if (!description || description.trim().length < 15) {
    throw new Error('Job description is required to generate assessment questions');
  }

  const difficulty: AssessmentDifficulty =
    input.difficulty === 'easy' || input.difficulty === 'intermediate' || input.difficulty === 'advanced'
      ? input.difficulty
      : 'intermediate';

  const categoryDistribution = input.categoryDistribution;

  let difficultyDistribution: AssessmentDifficultyDistribution | undefined;
  if (!categoryDistribution || Object.keys(categoryDistribution).length === 0) {
    const requestedDist = input.distribution || {};
    const easy = Math.max(0, Number(requestedDist.easy) || 0);
    const intermediate = Math.max(0, Number(requestedDist.intermediate) || 0);
    const advanced = Math.max(0, Number(requestedDist.advanced) || 0);

    if (easy + intermediate + advanced > 0) {
      difficultyDistribution = { easy, intermediate, advanced };
    } else {
      const total = Math.max(1, Math.min(30, Number(input.totalCount) || 8));
      const tierBase = Math.floor(total / 3);
      const remainder = total % 3;
      difficultyDistribution = {
        easy: tierBase + (remainder > 0 ? 1 : 0),
        intermediate: tierBase + (remainder > 1 ? 1 : 0),
        advanced: tierBase,
      };
    }
  }

  const prompt = buildAssessmentQuestionGenPrompt({
    title: input.title,
    description: input.description,
    skills: input.skills,
    experienceLevel: input.experienceLevel,
    difficulty,
    categoryDistribution,
    difficultyDistribution,
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

      const VALID_CATS = ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation'];
      let cat = typeof q.category === 'string' && q.category.trim() ? q.category.trim() : 'Logical Reasoning';
      if (!VALID_CATS.includes(cat)) {
        const lower = cat.toLowerCase();
        if (lower.includes('quant') || lower.includes('math') || lower.includes('arithmetic')) cat = 'Quantitative Aptitude';
        else if (lower.includes('logic') || lower.includes('reason') || lower.includes('deduction')) cat = 'Logical Reasoning';
        else if (lower.includes('verbal') || lower.includes('english') || lower.includes('grammar')) cat = 'Verbal Ability';
        else if (lower.includes('data') || lower.includes('chart') || lower.includes('graph') || lower.includes('interpretation')) cat = 'Data Interpretation';
        else cat = 'Logical Reasoning';
      }

      validatedQuestions.push({
        id: typeof q.id === 'string' && q.id.trim() ? q.id.trim() : `q_${diff}_${i + 1}`,
        difficulty: diff,
        category: cat,
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
