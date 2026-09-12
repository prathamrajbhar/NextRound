import { logger } from '../../lib/logger';
import {
  selectAptitudeQuestions,
  buildAptitudeDistribution,
} from '../questions/question-bank.service';
import { generateJdAssessmentQuestions } from '../assessment/assessment-generator.service';

export interface StoredAptitudeQuestion {
  id: string;
  category: string;
  question: string;
  text: string;
  options: string[];
  difficulty: string;
  correct_index?: number;
  correctIndex?: number;
}

const VALID_CATEGORIES = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
] as const;

export function normalizeAptitudeCategory(rawCategory?: string): string {
  if (!rawCategory || !rawCategory.trim()) return 'Logical Reasoning';
  const trimmed = rawCategory.trim();
  if ((VALID_CATEGORIES as readonly string[]).includes(trimmed as typeof VALID_CATEGORIES[number])) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes('quant') || lower.includes('math') || lower.includes('arithmetic')) return 'Quantitative Aptitude';
  if (lower.includes('logic') || lower.includes('reason') || lower.includes('deduction')) return 'Logical Reasoning';
  if (lower.includes('verbal') || lower.includes('english') || lower.includes('grammar')) return 'Verbal Ability';
  if (lower.includes('data') || lower.includes('chart') || lower.includes('graph') || lower.includes('interpretation')) return 'Data Interpretation';
  return 'Logical Reasoning';
}

interface ResolveQuestionsParams {
  assessmentConfig: Record<string, unknown>;
  jobTitle?: string;
  jobDescription?: string;
}

export async function resolveAptitudeQuestions(
  params: ResolveQuestionsParams
): Promise<StoredAptitudeQuestion[]> {
  const { assessmentConfig, jobTitle, jobDescription } = params;
  const rawCustomQuestions = Array.isArray(assessmentConfig.customQuestions)
    ? (assessmentConfig.customQuestions as Record<string, unknown>[])
    : [];

  if (rawCustomQuestions.length > 0) {
    return rawCustomQuestions.map((cq, idx) => {
      const qText = String(cq.question || cq.text || '').trim();
      const options = Array.isArray(cq.options) ? cq.options.map(String) : [];
      const correctIdx = typeof cq.correctIndex === 'number'
        ? cq.correctIndex
        : typeof cq.correct_index === 'number'
        ? cq.correct_index
        : 0;

      return {
        id: String(cq.id || `custom_q_${idx + 1}`),
        category: normalizeAptitudeCategory(typeof cq.category === 'string' ? cq.category : undefined),
        question: qText,
        text: qText,
        options,
        difficulty: String(cq.difficulty || 'intermediate'),
        correct_index: correctIdx,
        correctIndex: correctIdx,
      };
    });
  }

  const mcqDistribution = assessmentConfig.mcqDistribution as Record<string, number> | undefined;
  const totalCount = mcqDistribution
    ? Object.values(mcqDistribution).reduce((sum, val) => sum + Number(val), 0)
    : Math.max(1, Math.min(100, Number(assessmentConfig.mcqCount) || 20));

  const distribution = buildAptitudeDistribution(totalCount, mcqDistribution);
  const selected = await selectAptitudeQuestions({ distribution });

  if (selected.length > 0) {
    return selected.map((q) => ({
      id: q.id,
      category: normalizeAptitudeCategory(q.category),
      question: q.question,
      text: q.question,
      options: q.options,
      difficulty: q.difficulty,
      correct_index: q.correct_index,
      correctIndex: q.correct_index,
    }));
  }

  // Fallback to AI generation if DB question bank has 0 matching questions
  if (jobDescription && jobDescription.trim().length >= 15) {
    try {
      logger.child('AptitudeResolver').info('Question bank returned 0 questions. Generating via AI...');
      const generated = await generateJdAssessmentQuestions({
        title: jobTitle,
        description: jobDescription,
        categoryDistribution: distribution,
      });

      return generated.map((gq) => ({
        id: gq.id,
        category: normalizeAptitudeCategory(gq.category),
        question: gq.question,
        text: gq.question,
        options: gq.options,
        difficulty: gq.difficulty,
        correct_index: gq.correctIndex,
        correctIndex: gq.correctIndex,
      }));
    } catch (aiErr) {
      logger.child('AptitudeResolver').error('AI question generation failed during resolver:', aiErr);
    }
  }

  return [];
}
