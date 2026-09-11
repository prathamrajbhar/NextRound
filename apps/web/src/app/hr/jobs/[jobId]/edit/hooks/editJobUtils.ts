import { Job } from '@/types';

export type PipelineStage = 'screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision';

export interface AssessmentConfig {
  mcqCount: number;
  codingProblemId: string;
  passingScore: number;
  mcqDistribution?: Record<string, number>;
}

export function normalizeLocationType(loc?: string): string {
  if (!loc) return 'Remote';
  if (loc.toLowerCase().includes('hybrid')) return 'Hybrid';
  if (loc.toLowerCase().includes('site') || loc.toLowerCase().includes('office')) return 'On-site';
  return 'Remote';
}

export function parseSalaryRange(salaryStr?: string): { minSalary: number; maxSalary: number } {
  if (!salaryStr) return { minSalary: 1300000, maxSalary: 1800000 };
  const matches = salaryStr.match(/(\d+(?:\.\d+)?)/g);
  if (matches && matches.length >= 2) {
    const minVal = parseFloat(matches[0]);
    const maxVal = parseFloat(matches[1]);
    const isLPA = salaryStr.toLowerCase().includes('l') || minVal < 100;
    return {
      minSalary: isLPA ? Math.round(minVal * 100000) : Math.round(minVal),
      maxSalary: isLPA ? Math.round(maxVal * 100000) : Math.round(maxVal),
    };
  }
  return { minSalary: 1300000, maxSalary: 1800000 };
}

export function normalizeExperienceLevel(rawExp?: string): string {
  if (!rawExp) return 'Senior (5-8 Yrs)';
  if (rawExp.includes('Entry') || rawExp.includes('0-2')) return 'Entry-Level (0-2 Yrs)';
  if (rawExp.includes('Mid') || rawExp.includes('2-5')) return 'Mid-Level (2-5 Yrs)';
  if (rawExp.includes('Senior') || rawExp.includes('5-8') || rawExp.includes('5+')) return 'Senior (5-8 Yrs)';
  if (rawExp.includes('Lead') || rawExp.includes('Staff') || rawExp.includes('8+')) return 'Lead / Staff (8+ Yrs)';
  if (rawExp.includes('Director') || rawExp.includes('VP')) return 'Director / VP';
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
