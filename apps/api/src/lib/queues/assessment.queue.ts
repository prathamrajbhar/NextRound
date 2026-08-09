import { assessmentQueue, DEFAULT_JOB_OPTIONS } from '../bullmq';

export interface AptitudeAnswer {
  questionId: string;
  category: 'Logical' | 'Numerical' | 'Verbal' | 'Spatial';
  selectedOptionIndex: number;
  timeTakenSeconds?: number;
}

export interface AssessmentJobPayload {
  applicationId: string;
  answers: AptitudeAnswer[];
  totalTimeSeconds?: number;
  tabSwitchCount?: number;
}

export async function enqueueAssessment(
  applicationId: string,
  answers: AptitudeAnswer[],
  extra?: { totalTimeSeconds?: number; tabSwitchCount?: number }
) {
  const payload: AssessmentJobPayload = {
    applicationId,
    answers,
    totalTimeSeconds: extra?.totalTimeSeconds,
    tabSwitchCount: extra?.tabSwitchCount,
  };

  const job = await assessmentQueue.add('score_aptitude', payload, DEFAULT_JOB_OPTIONS);

  return job;
}
