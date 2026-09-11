import {
  Rec,
  isObject,
  asStringArray,
  statusToStage,
  candidateName,
  candidateEmail,
  orgName,
  toIso,
  toDatePart,
} from './serializers.common';
import {
  firstEvaluation,
  serializeScores,
  serializeInterview,
  serializeTranscript,
  type InterviewLike,
} from './serializers.interview';

export * from './serializers.interview';

interface ParsedExperienceRecord {
  company?: string;
  role?: string;
  duration?: string;
  description?: string;
}

interface AssessmentRecord {
  id: string;
  application_id?: string;
  test_type?: string;
  status?: string;
  created_at?: string | Date;
  score?: number;
}

export function serializeApplication(app: Rec, options?: { scheduledSlots?: string[] }): Rec {
  const candidate = isObject(app.candidate) ? app.candidate : undefined;
  const job = isObject(app.job) ? app.job : undefined;
  const evalFirst = firstEvaluation(app.evaluations);
  const interview = isObject(app.interview) ? (app.interview as InterviewLike & Rec) : undefined;

  const decision =
    evalFirst?.decision === 'hire'
      ? 'hire'
      : evalFirst?.decision === 'reject'
      ? 'reject'
      : evalFirst?.decision === 'hold_for_review'
      ? 'hold'
      : undefined;

  const parsedResume = isObject(candidate?.parsed_resume) ? (candidate!.parsed_resume as Rec) : undefined;
  const rawExperienceList = Array.isArray(parsedResume?.experience) ? (parsedResume!.experience as unknown[]) : [];
  const workExperience = rawExperienceList
    .filter(isObject)
    .map((experienceItem) => {
      const exp = experienceItem as ParsedExperienceRecord;
      return {
        company: typeof exp.company === 'string' ? exp.company : '',
        role: typeof exp.role === 'string' ? exp.role : '',
        duration: typeof exp.duration === 'string' ? exp.duration : '',
        description: typeof exp.description === 'string' ? exp.description : '',
      };
    });

  const rawAssessmentsList = Array.isArray(app.assessments) ? (app.assessments as unknown[]) : [];
  const assessments = rawAssessmentsList
    .filter(isObject)
    .map((assessmentItem) => {
      const assessmentRecord = assessmentItem as unknown as AssessmentRecord;
      return {
        id: assessmentRecord.id,
        applicationId: assessmentRecord.application_id || '',
        assessmentName: assessmentRecord.test_type === 'aptitude' ? 'Aptitude Assessment' : 'Coding Assessment',
        category: assessmentRecord.test_type === 'aptitude' ? 'aptitude' : 'coding',
        status: assessmentRecord.status === 'in_progress'
          ? 'in_progress'
          : assessmentRecord.status === 'completed'
          ? 'completed'
          : 'not_started',
        completedDate: assessmentRecord.created_at ? new Date(assessmentRecord.created_at).toISOString() : undefined,
        overallScore: typeof assessmentRecord.score === 'number' ? assessmentRecord.score : undefined,
      };
    });

  return {
    id: app.id,
    candidateName: candidateName(candidate),
    candidateEmail: candidateEmail(candidate),
    candidateAvatar: (isObject(app.candidate) && typeof app.candidate.avatar_url === 'string' && app.candidate.avatar_url)
      ? (app.candidate.avatar_url as string)
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(candidateName(candidate))}`,
    jobId: job?.id || app.job_id,
    jobTitle: typeof job?.title === 'string' ? job.title : '',
    orgName: orgName(job),
    status: app.status,
    stage: statusToStage(typeof app.status === 'string' ? app.status : undefined),
    hrRoundStatus: typeof app.hr_round_status === 'string' ? app.hr_round_status.toUpperCase() : undefined,
    hrRoundScheduledAt: toIso(app.hr_round_scheduled_at),
    hrRoundCompletedAt: toIso(app.hr_round_completed_at),
    appliedDate: toDatePart(app.applied_at) || new Date().toISOString().split('T')[0],
    resumeUrl: isObject(app.candidate) && typeof app.candidate.resume_url === 'string' ? app.candidate.resume_url : '',
    skills: asStringArray(candidate?.skills),
    targetRoles: asStringArray(candidate?.target_roles),
    yearsOfExperience: typeof candidate?.years_of_experience === 'number' ? candidate.years_of_experience : undefined,
    location: typeof candidate?.location === 'string' ? candidate.location : undefined,
    noticePeriod: typeof candidate?.notice_period === 'string' ? candidate.notice_period : undefined,
    expectedSalary: typeof candidate?.expected_salary === 'number' ? candidate.expected_salary : undefined,
    workExperience: workExperience.length > 0 ? workExperience : undefined,
    scores: serializeScores(evalFirst),
    decision,
    reasoning: typeof evalFirst?.reasoning === 'string' ? evalFirst.reasoning : undefined,
    transcript: serializeTranscript(interview),
    audioUrl: interview?.audio_url || undefined,
    proctorFlags: serializeInterview(interview)?.proctorFlags,
    engagementSignal: serializeInterview(interview)?.engagementSignal,
    assessments: assessments.length > 0 ? assessments : undefined,
    scheduledSlots:
      options?.scheduledSlots && options.scheduledSlots.length > 0 ? options.scheduledSlots : undefined,
  };
}

export function serializeApplicationList(applications: Rec[]): Rec[] {
  return (applications || []).map((applicationRecord) => serializeApplication(applicationRecord));
}

export function serializeOffer(offerRaw: Rec, application?: Rec): Rec {
  const job = isObject(application?.job) ? application.job : undefined;
  const candidate = isObject(application?.candidate) ? application.candidate : undefined;
  const salary = typeof offerRaw.salary === 'number' ? offerRaw.salary : 0;
  const status =
    typeof offerRaw.status === 'string'
      ? offerRaw.status === 'pending' || offerRaw.status === 'negotiating'
        ? 'sent'
        : offerRaw.status
      : 'draft';

  return {
    id: offerRaw.id,
    applicationId: application?.id,
    candidateName: candidateName(candidate),
    candidateAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(candidateName(candidate))}`,
    jobId: job?.id,
    jobTitle: typeof job?.title === 'string' ? job.title : '',
    orgName: orgName(job),
    status,
    baseSalary: salary ? `$${salary.toLocaleString('en-US')}` : 'Competitive',
    bonus: '10%',
    equity: typeof offerRaw.equity === 'string' ? offerRaw.equity : '0%',
    joiningDate: toDatePart(offerRaw.start_date),
    expiryDate: toDatePart(offerRaw.valid_until),
    benefits: [],
    negotiationHistory: [],
    letterUrl: '',
  };
}
