import { Application } from './applications.types';
import { Job } from './jobs.types';

export interface CandidateProfileData {
  id: string;
  user_id: string;
  full_name?: string | null;
  headline?: string | null;
  phone?: string | null;
  location?: string | null;
  timezone?: string | null;
  avatar_url?: string | null;
  resume_url?: string | null;
  raw_resume_text?: string | null;
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

export interface MockSession {
  id: string;
  targetCompany: string;
  targetRole: string;
  difficulty: 'junior' | 'mid' | 'senior';
  rubric: { technical: number; communication: number; cultureFit: number };
  score: number;
  date: string;
  feedback: string;
  transcript: { question: string; answer: string; feedback: string }[];
}

export interface Notification {
  id: string;
  type: 'pipeline' | 'decision' | 'alert' | 'interview' | 'offer' | 'shortlist' | 'system';
  text: string;
  time: string;
  link: string;
  read: boolean;
}

export interface CandidateDashboardData {
  activeApplications: Application[];
  upcomingInterviews: { id: string; jobTitle: string; date: string; type: string }[];
  recentMockSessions: MockSession[];
  recommendedJobs: Job[];
}

export interface HRDashboardData {
  activeJobsCount: number;
  totalApplicationsCount: number;
  decisionsCount: { hire: number; hold: number; reject: number };
  recentApplications: Application[];
  pipelineSummary: { stage: string; count: number }[];
}
