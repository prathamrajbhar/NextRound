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
  avatar_url?: string | null;
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
  data_consent?: boolean;
  data_consent_at?: string | null;
  created_at: string;
}

export type SocialSource = 'github' | 'linkedin';
export type SocialSyncStatus = 'pending' | 'synced' | 'failed' | 'not_found' | 'removed';

export interface SocialProfileSyncDTO {
  id: string;
  candidateId: string;
  source: SocialSource;
  username: string;
  status: SocialSyncStatus;
  error?: string | null;
  syncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EmbeddingSourceType = 'resume' | 'github' | 'linkedin' | 'profile';

export interface CandidateEmbeddingSection {
  sourceType: EmbeddingSourceType;
  section: string;
  content: string;
}

export interface CandidateInterviewContext {
  candidateId: string;
  dataConsent: boolean;
  candidate: {
    fullName?: string | null;
    headline?: string | null;
    location?: string | null;
    timezone?: string | null;
    yearsOfExperience?: number | null;
    targetRoles: string[];
    bio?: string | null;
    proudProject?: string | null;
  };
  resume: {
    rawText?: string | null;
    parsed?: Record<string, unknown> | null;
    sections: CandidateEmbeddingSection[];
  };
  social: {
    github?: Record<string, unknown> | null;
    linkedin?: Record<string, unknown> | null;
  };
  skills: string[];
  experience: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  education: Array<Record<string, unknown>>;
  achievements: Array<Record<string, unknown>>;
  job: {
    title: string;
    description: string;
    location?: string | null;
    experienceLevel?: string | null;
    skills?: string[];
    rubric?: Record<string, unknown>;
    thresholds?: Record<string, unknown>;
  };
  interviewFocus: CandidateEmbeddingSection[];
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

export interface AptitudeQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
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
  status: 'completed' | 'unavailable';
  source: 'audio';
  audioUrl: string;
  overall: {
    tone: 'calm' | 'steady' | 'anxious' | 'stressed';
    stressScore: number;
    confidenceScore: number;
    clarityScore: number;
  };
  audio: {
    speakingRateWpm: number;
    avgPauseDurationSec: number;
    pausesPerMinute: number;
    longPauseCount: number;
    pitchMeanHz: number;
    pitchStdDevHz: number;
    tremorPercent: number;
    steadyPercent: number;
    durationSec: number;
  };
  journey: Array<{
    timeLabel: string;
    minute: number;
    confidence: number;
    stress: number;
    hesitation: number;
    emotionLabel: 'Confident' | 'Neutral' | 'Hesitant' | 'Stressed';
  }>;
  summaryNarrative: string;
}

export interface HRAnalyticsOverviewDTO {
  kpis: {
    totalApplications: number;
    activeJobs: number;
    avgTimeToHireDays: number;
    offerAcceptanceRatePercent: number;
  };
  weeklyFunnel: Array<{ week: string; applied: number; screened: number; interviewed: number; offered: number }>;
  stageConversionRates: Record<string, number>;
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
  similarityScore: number | null;
  isBookmarked: boolean;
  bookmarkId?: string | null;
  lastActive: string;
}
