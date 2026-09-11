import { Job } from '@/types';

export type PipelineStage = 'screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision';

export interface AssessmentConfig {
  mcqCount: number;
  codingProblemId: string;
  passingScore: number;
  mcqDistribution?: Record<string, number>;
}

export function normalizeExperienceLevel(rawExp?: string): string {
  if (!rawExp) return 'Senior (5+ Years)';
  if (rawExp.includes('Senior')) return 'Senior (5+ Years)';
  if (rawExp.includes('Lead')) return 'Lead / Principal';
  if (rawExp.includes('Mid')) return 'Mid-Level';
  if (rawExp.includes('Junior') || rawExp.includes('Entry')) return 'Entry-Level';
  return rawExp;
}

export function buildAssessmentConfig(config?: Partial<AssessmentConfig>): AssessmentConfig {
  if (!config) {
    return {
      mcqCount: 20,
      codingProblemId: 'virtualized-list',
      passingScore: 80,
      mcqDistribution: {
        'Quantitative Aptitude': 5,
        'Logical Reasoning': 5,
        'Verbal Ability': 5,
        'Data Interpretation': 5,
      },
    };
  }

  const mcqCount = config.mcqCount || 20;
  if (!config.mcqDistribution) {
    const base = Math.floor(mcqCount / 4);
    const remainder = mcqCount % 4;
    return {
      mcqCount,
      codingProblemId: config.codingProblemId || 'virtualized-list',
      passingScore: config.passingScore ?? 80,
      mcqDistribution: {
        'Quantitative Aptitude': base + (remainder > 0 ? 1 : 0),
        'Logical Reasoning': base + (remainder > 1 ? 1 : 0),
        'Verbal Ability': base + (remainder > 2 ? 1 : 0),
        'Data Interpretation': base,
      },
    };
  }

  return {
    mcqCount,
    codingProblemId: config.codingProblemId || 'virtualized-list',
    passingScore: config.passingScore ?? 80,
    mcqDistribution: config.mcqDistribution,
  };
}
