import type { ProctoringClient } from '@/lib/proctoring/ProctoringClient';

// ---------------------------------------------------------------------------
// Shared interview types — the single source of truth for these shapes.
// useInterviewSession re-exports from here; all console components import here.
// ---------------------------------------------------------------------------

export interface Message {
  id: string;
  role: 'ai' | 'candidate';
  content: string;
  timestamp: string;
}

export type InterviewPhase = 'Introduction' | 'Core Vetting' | 'Deep-Dive' | 'Wrap-up';

export type InterviewConsoleMode =
  | 'ai-voice'
  | 'mock-practice'
  | 'hr-candidate'
  | 'hr-recruiter';

export interface ProctorTelemetry {
  faceCount: number | null;
  gazeCentered: boolean | null;
  engagementIndex: number | null;
}

export interface UnifiedInterviewConsoleProps {
  applicationId?: string;
  mode: InterviewConsoleMode;
  companyName: string;
  jobTitle: string;
  candidateName?: string;
  avatarUrl?: string;
  timeRemaining?: number;
  callDuration?: number;

  // Voice & AI session state (for ai-voice and mock-practice modes)
  messages?: Message[];
  phase?: InterviewPhase;
  isAnalyzing?: boolean;
  proctorTelemetry?: ProctorTelemetry;
  onSubmitAnswer?: (text: string) => void;
  onEndSession: () => void;

  // Proctoring (anti-cheat enforcement)
  strikeCount?: number;
  showWarningModal?: boolean;
  onResumeFullscreen?: () => void;
  onEliminate?: () => void;
  proctoringClient?: ProctoringClient | null;

  // HR Recruiter Evaluation Form (hr-recruiter mode only)
  onCompleteHRRound?: (result: 'pass' | 'fail', notes: string) => void;
}
