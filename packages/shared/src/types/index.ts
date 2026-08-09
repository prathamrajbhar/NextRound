import { UserRole, ApplicationStatus, DecisionType, InterviewType, AssessmentCategory, JobStatus } from '../enums';

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  } | string;
}

export interface UserPublic {
  id: string;
  email: string;
  role: 'hr' | 'candidate';
  org_id?: string | null;
  created_at: string;
}

export interface AuthResponse {
  user: UserPublic;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  org_id?: string | null;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  logo_url?: string | null;
  industry?: string | null;
  size?: string | null;
  settings?: Record<string, unknown>;
  created_at: string;
}

export interface JobRubric {
  technical: number;
  communication: number;
  problemSolving: number;
  experience: number;
}

export interface JobThresholds {
  minScore: number;
  autoOffer: boolean;
}

export interface Job {
  id: string;
  org_id: string;
  title: string;
  description: string;
  location?: string;
  salary?: string;
  experienceLevel?: string;
  skills?: string[];
  rubric?: JobRubric;
  thresholds?: JobThresholds;
  pipelineToggles?: Record<string, boolean>;
  stages?: string[];
  status: JobStatus;
  created_at: string;
}

export interface CandidateProfile {
  id: string;
  user_id: string;
  full_name?: string | null;
  headline?: string | null;
  phone?: string | null;
  location?: string | null;
  timezone?: string | null;
  resume_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  bio?: string | null;
  skills: string[];
  target_roles: string[];
  years_of_experience?: number | null;
  work_mode?: string | null;
  current_ctc?: number | null;
  target_locations: string[];
  expected_salary?: number | null;
  notice_period?: string | null;
  work_authorization?: string | null;
  proud_project?: string | null;
  work_values: string[];
  availability?: Record<string, unknown>;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  status: ApplicationStatus;
  scores?: {
    composite: number;
    technical: number;
    communication: number;
    problemSolving: number;
    experience: number;
  };
  created_at: string;
}

export interface Evaluation {
  id: string;
  application_id: string;
  composite_score: number;
  confidence: number;
  bias_report?: Record<string, unknown>;
  decision: DecisionType;
  created_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  type: InterviewType;
  transcript?: Array<{ question: string; answer: string; score?: number; feedback?: string }>;
  proctor_flags?: Record<string, unknown>;
  engagement_signal?: number;
  audio_url?: string;
  created_at: string;
}

export interface MockSession {
  id: string;
  candidate_id: string;
  topic: string;
  difficulty?: string;
  feedback?: Record<string, unknown>;
  score?: number;
  created_at: string;
}

export interface PrepContent {
  id: string;
  org_id?: string;
  job_id?: string;
  content_type: string;
  content: Record<string, unknown>;
  created_at: string;
}

// Canonical aptitude question shape — matches packages/shared/data/aptitude-questions.json.
// The `source` field distinguishes AI-generated questions from canonical fallback questions:
//   "ai-generated"  — produced by the Gemini / Ollama LLM chain
//   "fallback"      — sourced verbatim from the shared static bank
export interface AptitudeQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Full question stem (same value as `text`; both fields are kept in sync). */
  question: string;
  /** Alias for `question`; kept for API backward-compat with the web console. */
  text: string;
  options: string[];
  /** Zero-based index of the correct option. Stripped server-side before delivery to candidates. */
  correctIndex: number;
  explanation?: string;
  /** Origin indicator: "ai-generated" when produced by an LLM, "fallback" when from the static bank. */
  source: 'ai-generated' | 'fallback';
}

export interface NotificationDTO {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface HRDashboardData {
  kpis: {
    activeJobs: number;
    totalApplicants: number;
    avgTimeToHireDays: number;
    pendingInterviews: number;
  };
  stageDistribution: Record<string, number>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface HRAnalyticsData {
  weeklyFunnel: Array<{ week: string; applied: number; screened: number; interviewed: number; offered: number }>;
  stageConversionRates: Record<string, number>;
  biasReportSummary: {
    totalAudited: number;
    biasFlagsTriggered: number;
    cleanRatePercent: number;
  };
}

export interface CandidateDashboardData {
  kpis: {
    totalApplications: number;
    activeInterviews: number;
    offersReceived: number;
  };
  applications: Application[];
  nextInterview?: {
    id: string;
    jobTitle: string;
    companyName: string;
    scheduledAt: string;
  } | null;
}

export interface SentimentReportDTO {
  interviewId: string;
  overallTone: 'confident' | 'hesitant' | 'stressed' | 'enthusiastic' | 'neutral';
  overallStressLevel: 'low' | 'moderate' | 'high';
  speechPaceWpm: number;
  pitchVarianceHz: number;
  emotionalJourney: Array<{
    turnNumber: number;
    speaker: 'interviewer' | 'candidate';
    text: string;
    sentiment: string;
    confidence: number;
    stressIndicator: number; // 0-100
  }>;
  stressPeakMoments: Array<{
    timestamp?: string;
    turnIndex: number;
    questionText: string;
    candidateResponseSnippet: string;
    stressScore: number;
    reason: string;
  }>;
  summaryNarrative: string;
}

export interface HRAnalyticsOverviewDTO {
  kpis: {
    totalApplications: number;
    activeJobs: number;
    avgTimeToHireDays: number;
    offerAcceptanceRatePercent: number;
    biasCleanRatePercent: number;
  };
  weeklyFunnel: Array<{ week: string; applied: number; screened: number; interviewed: number; offered: number }>;
  stageConversionRates: Record<string, number>;
  biasStabilityTrend: Array<{ week: string; totalAudited: number; flagsTriggered: number; cleanRatePercent: number }>;
  dropoffAnalysis: Array<{ stage: string; dropCount: number; percentage: number }>;
}

export interface TalentBookmarkDTO {
  id: string;
  orgId: string;
  candidateId: string;
  jobId?: string | null;
  notes?: string | null;
  createdAt: string;
  candidate: CandidateProfile & {
    user: { id: string; email: string };
  };
  job?: { id: string; title: string } | null;
}

export interface TalentPoolCandidateDTO {
  candidateId: string;
  userId: string;
  name: string;
  email: string;
  skills: string[];
  targetRoles: string[];
  resumeUrl?: string | null;
  similarityScore: number | null; // 0-100, or null when no real semantic match was available
  isBookmarked: boolean;
  bookmarkId?: string | null;
  lastActive: string;
}
