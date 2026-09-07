import { Rec, isObject, orgName, orgLogo } from './serializers.common';

function applicantsCountOf(job: Rec): number {
  const count = job._count;
  if (isObject(count) && typeof count.applications === 'number') return count.applications;
  if (Array.isArray(job.applications)) return job.applications.length;
  return 0;
}

function defaultRubric(): Rec {
  return { technical: 25, communication: 25, problemSolving: 25, experience: 25 };
}

function defaultThresholds(): Rec {
  return { minScore: 70, autoOffer: false };
}

function defaultAssessmentConfig(): Rec {
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

const DEFAULT_STAGES = ['screening', 'assessment', 'voice_screen', 'decision'];

function jobStages(job: Rec): string[] {
  if (Array.isArray(job.stages)) {
    const stringStages = job.stages.filter((stage): stage is string => typeof stage === 'string');
    if (stringStages.length > 0) return stringStages;
  }
  return DEFAULT_STAGES;
}

export function serializeJob(job: Rec): Rec {
  const rubric = isObject(job.rubric) ? job.rubric : defaultRubric();
  const thresholds = isObject(job.thresholds) ? job.thresholds : defaultThresholds();
  const assessmentConfig = isObject(job.assessmentConfig) ? job.assessmentConfig : defaultAssessmentConfig();
  const createdDate = typeof job.created_at === 'string' || job.created_at instanceof Date
    ? new Date(job.created_at).toISOString()
    : new Date().toISOString();

  return {
    id: job.id,
    orgId: job.org_id,
    orgName: job.orgName || orgName(job),
    orgLogo: job.orgLogo || orgLogo(job),
    title: job.title,
    description: job.description,
    rubric,
    thresholds,
    status: job.status || 'active',
    location: job.location || 'Remote',
    department: job.department || '',
    salary: job.salary || 'Competitive',
    experienceLevel: job.experienceLevel || 'Mid-level',
    postedDate: createdDate,
    applicantsCount: applicantsCountOf(job),
    stages: jobStages(job),
    assessmentConfig,
  };
}

export function serializeJobList(jobs: Rec[]): Rec[] {
  return (jobs || []).map((jobRecord) => serializeJob(jobRecord));
}
