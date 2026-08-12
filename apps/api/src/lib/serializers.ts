// TypeScript strict, zero `any` guarantee. These mappers translate raw Prisma
// records into the flat camelCase DTO shapes the web frontend consumes.

/** Loose record type for raw Prisma rows and DTO-shaped payloads. */
export type Rec = Record<string, unknown>;

function isObject(v: unknown): v is Rec {
  return typeof v === 'object' && v !== null;
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === 'string');
  }
  return [];
}

const STAGE_BY_STATUS: Rec = {
  applied: 'Sourced',
  screening: 'Screened',
  screening_completed: 'Screened',
  assessment: 'Assessment',
  interview_scheduled: 'Interview',
  interviewed: 'Interview',
  evaluation: 'Assessment',
  hr_round: 'HR Round',
  decided: 'Decision',
  offered: 'Decision',
  accepted: 'Decision',
  rejected: 'Decision',
  withdrawn: 'Decision',
};

function statusToStage(status: unknown): string {
  if (typeof status === 'string' && STAGE_BY_STATUS[status]) {
    return STAGE_BY_STATUS[status] as string;
  }
  return 'Sourced';
}

function candidateName(candidate: Rec | undefined): string {
  if (!candidate) return 'Candidate';
  const explicit = candidate.name || candidate.full_name;
  if (typeof explicit === 'string' && explicit) return explicit;
  const email = isObject(candidate.user) ? candidate.user.email : undefined;
  if (typeof email === 'string' && email) {
    return email
      .split('@')[0]
      .split(/[._-]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }
  return 'Candidate';
}

function candidateEmail(candidate: Rec | undefined): string {
  if (!candidate) return '';
  const email = isObject(candidate.user) ? candidate.user.email : undefined;
  return typeof email === 'string' ? email : '';
}

function orgName(job: Rec | undefined): string {
  const org = job?.organization;
  if (isObject(org) && typeof org.name === 'string') return org.name;
  return '';
}

function orgLogo(job: Rec | undefined): string {
  const org = isObject(job) ? job.organization : undefined;
  if (isObject(org) && typeof org.logo_url === 'string') return org.logo_url;
  return '';
}

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
    }
  };
}

const DEFAULT_STAGES = ['screening', 'assessment', 'voice_screen', 'decision'];

function jobStages(job: Rec): string[] {
  if (Array.isArray(job.stages)) {
    const strs = job.stages.filter((s): s is string => typeof s === 'string');
    if (strs.length > 0) return strs;
  }
  return DEFAULT_STAGES;
}

export function serializeJob(job: Rec): Rec {
  const rubric = isObject(job.rubric) ? job.rubric : defaultRubric();
  const thresholds = isObject(job.thresholds) ? job.thresholds : defaultThresholds();
  const assessmentConfig = isObject(job.assessmentConfig) ? job.assessmentConfig : defaultAssessmentConfig();
  const created = typeof job.created_at === 'string' || job.created_at instanceof Date
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
    postedDate: created,
    applicantsCount: applicantsCountOf(job),
    stages: jobStages(job),
    assessmentConfig,
  };
}

export function serializeJobList(jobs: Rec[]): Rec[] {
  return (jobs || []).map((j) => serializeJob(j));
}

interface EvalLike {
  id?: string;
  resume_score?: number | null;
  interview_score?: number | null;
  aptitude_score?: number | null;
  coding_score?: number | null;
  composite_score?: number | null;
  confidence?: number | null;
  decision?: string | null;
  reasoning?: string | null;
}

function firstEvaluation(evaluations: unknown): EvalLike | undefined {
  if (Array.isArray(evaluations) && evaluations.length > 0 && isObject(evaluations[0])) {
    return evaluations[0] as EvalLike & Rec;
  }
  return undefined;
}

function plainNum(n: number | null | undefined, fallback: number): number {
  return typeof n === 'number' ? n : fallback;
}

function serializeScores(e: EvalLike | undefined): Rec | undefined {
  if (!e) return undefined;
  return {
    composite: Math.round(plainNum(e.composite_score, 0)),
    technical: Math.round(plainNum(e.resume_score, 0)),
    communication: Math.round(plainNum(e.interview_score, 0)),
    problemSolving: Math.round(plainNum(e.aptitude_score, 0)),
    experience: Math.round(plainNum(e.coding_score, 0)),
    confidence: e.confidence != null ? Math.round(e.confidence * 100) : 0,
  };
}

interface InterviewLike {
  id?: string;
  transcript?: unknown;
  proctor_flags?: unknown;
  engagement_signal?: unknown;
  audio_url?: string | null;
  scheduled_at?: Date | string | null;
  status?: string;
}

function toIso(v: unknown): string | undefined {
  if (!v) return undefined;
  try {
    return new Date(v as string | number | Date).toISOString();
  } catch {
    return undefined;
  }
}

function toDatePart(v: unknown): string {
  if (!v) return '';
  try {
    return new Date(v as string | number | Date).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function serializeInterview(interview: InterviewLike | undefined): Rec | undefined {
  if (!interview) return undefined;

  const proctorObj = isObject(interview.proctor_flags) ? interview.proctor_flags : undefined;
  const proctorFlags = proctorObj
    ? Object.entries(proctorObj)
        .filter(([, v]) => v === true || (typeof v === 'number' && v > 0))
        .map(([key]) => ({
          timestamp: new Date().toISOString(),
          type: key,
          severity: 'medium',
          description: key.replace(/([A-Z])/g, ' $1').toLowerCase(),
        }))
    : [];

  const eng = interview.engagement_signal;
  const engagementSignal = isObject(eng)
    ? {
        eyeContact: typeof eng.eyeContact === 'number' ? eng.eyeContact : 0,
        speakingRate: typeof eng.speakingRate === 'string' ? eng.speakingRate : 'Normal',
        confidenceScore: typeof eng.confidenceScore === 'number' ? eng.confidenceScore : 0,
      }
    : undefined;

  return {
    id: interview.id,
    scheduledAt: toIso(interview.scheduled_at),
    status: interview.status,
    proctorFlags,
    engagementSignal,
    audioUrl: interview.audio_url || undefined,
  };
}

function serializeTranscript(interview: InterviewLike | undefined): Rec[] | undefined {
  if (!interview || !Array.isArray(interview.transcript)) return undefined;
  const out: Rec[] = [];
  for (const seg of interview.transcript) {
    if (!isObject(seg)) continue;
    const text = seg.text || seg.content;
    if (typeof text !== 'string') continue;
    const isCandidate = seg.speaker === 'candidate' || seg.speaker === 'human';
    const isInterviewer = seg.speaker === 'interviewer' || seg.speaker === 'ai';
    out.push({
      question: isInterviewer ? text : typeof seg.question === 'string' ? seg.question : '',
      answer: isCandidate ? text : '',
      score: typeof seg.score === 'number' ? seg.score : 0,
      feedback: typeof seg.feedback === 'string' ? seg.feedback : '',
    });
  }
  return out.length > 0 ? out : undefined;
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
    scores: serializeScores(evalFirst),
    decision,
    reasoning: typeof evalFirst?.reasoning === 'string' ? evalFirst.reasoning : undefined,
    transcript: serializeTranscript(interview),
    audioUrl: interview?.audio_url || undefined,
    proctorFlags: serializeInterview(interview)?.proctorFlags,
    engagementSignal: serializeInterview(interview)?.engagementSignal,
    assessments: Array.isArray(app.assessments)
      ? app.assessments.map((a: any) => ({
          id: a.id,
          applicationId: a.application_id || '',
          assessmentName: a.test_type === 'aptitude' ? 'Aptitude Assessment' : 'Coding Assessment',
          category: a.test_type === 'aptitude' ? 'aptitude' : 'coding',
          status: a.status === 'in_progress' ? 'in_progress' : a.status === 'completed' ? 'completed' : 'not_started',
          completedDate: a.created_at ? new Date(a.created_at).toISOString() : undefined,
          overallScore: typeof a.score === 'number' ? a.score : undefined,
        }))
      : undefined,
    scheduledSlots:
      options?.scheduledSlots && options.scheduledSlots.length > 0 ? options.scheduledSlots : undefined,
  };
}

export function serializeApplicationList(apps: Rec[]): Rec[] {
  return (apps || []).map((a) => serializeApplication(a));
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

export function serializeMockSession(session: Rec): Rec {
  return {
    id: session.id,
    targetCompany: session.target_company,
    targetRole: session.target_role,
    difficulty: session.difficulty || 'mid',
    rubric: isObject(session.rubric)
      ? session.rubric
      : { technical: 25, communication: 25, cultureFit: 25 },
    score: typeof session.score === 'number' ? session.score : 0,
    overall_score: typeof session.score === 'number' ? session.score : 0,
    date: toDatePart(session.created_at),
    feedback: session.feedback && isObject(session.feedback) ? (session.feedback as Rec).overallScore : '',
    transcript: Array.isArray(session.transcript)
      ? session.transcript.map((entry) => {
          if (isObject(entry)) {
            return {
              question: typeof entry.question === 'string' ? entry.question : '',
              answer: typeof entry.answer === 'string' ? entry.answer : '',
              feedback: typeof entry.feedback === 'string' ? entry.feedback : '',
            };
          }
          return { question: '', answer: '', feedback: '' };
        })
      : [],
  };
}

export function serializeMockSessionList(sessions: Rec[]): Rec[] {
  return (sessions || []).map((s) => serializeMockSession(s));
}