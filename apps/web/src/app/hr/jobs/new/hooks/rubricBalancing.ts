import { AssessmentQuestion } from '@/types/assessment-question';

export interface RubricWeights {
  technical: number;
  communication: number;
  problemSolving: number;
  experience: number;
}

export interface AssessmentConfig {
  mcqCount: number;
  codingProblemId: string;
  passingScore: number;
  mcqDistribution?: Record<string, number>;
  customQuestions?: AssessmentQuestion[];
}

export const DEFAULT_ASSESSMENT_CONFIG: AssessmentConfig = {
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

export function rebalanceRubric(
  rubric: RubricWeights,
  key: keyof RubricWeights,
  newValue: number
): RubricWeights {
  const keys: (keyof RubricWeights)[] = ['technical', 'communication', 'problemSolving', 'experience'];
  const otherKeys = keys.filter((k) => k !== key);
  const diff = newValue - rubric[key];
  const tempRubric: RubricWeights = { ...rubric, [key]: newValue };
  let remainingDiff = diff;

  const eligibleKeys = otherKeys.filter((k) => (diff > 0 ? rubric[k] > 0 : rubric[k] < 100));

  if (eligibleKeys.length > 0) {
    const share = Math.round(diff / eligibleKeys.length);
    eligibleKeys.forEach((k, idx) => {
      const change = idx === eligibleKeys.length - 1 ? remainingDiff : share;
      const targetVal = Math.max(0, Math.min(100, rubric[k] - change));
      tempRubric[k] = targetVal;
      remainingDiff -= rubric[k] - targetVal;
    });
  }

  const finalSum =
    tempRubric.technical +
    tempRubric.communication +
    tempRubric.problemSolving +
    tempRubric.experience;
  if (finalSum !== 100) {
    const adjustKey = otherKeys[0];
    tempRubric[adjustKey] = Math.max(0, Math.min(100, tempRubric[adjustKey] + (100 - finalSum)));
  }

  return tempRubric;
}
