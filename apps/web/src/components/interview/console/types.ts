import type { Message, InterviewPhase } from '@/hooks/useInterviewSession';
import type { ProctoringClient } from '@/lib/proctoring/ProctoringClient';

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

  // Voice & AI session state (for ai-voice and mock-practice)
  messages?: Message[];
  phase?: InterviewPhase;
  isAnalyzing?: boolean;
  proctorTelemetry?: ProctorTelemetry;
  onSubmitAnswer?: (text: string) => void;
  onEndSession: () => void;

  // Proctoring properties (for anti-cheat enforcement)
  strikeCount?: number;
  showWarningModal?: boolean;
  onResumeFullscreen?: () => void;
  onEliminate?: () => void;
  proctoringClient?: ProctoringClient | null;

  // HR Recruiter Evaluation Form (for hr-recruiter mode)
  onCompleteHRRound?: (result: 'pass' | 'fail', notes: string) => void;
}

export { Message, InterviewPhase };
