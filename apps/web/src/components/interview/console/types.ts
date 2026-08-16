import type { ProctoringClient } from '@/lib/proctoring/ProctoringClient';






export interface Message {
  id: string;
  role: 'ai' | 'candidate';
  content: string;
  timestamp: string;
  analysis?: {
    action?: string;
    target_skill?: string;
    answer_summary?: string;
    evidence_used?: string[];
  } | null;
  turnRecord?: {
    turn?: number;
    question?: string;
    answer?: string;
    answer_summary?: string;
    action?: string;
    target_skill?: string;
    evaluated_skills?: string[];
    remaining_skills?: string[];
    evidence_used?: string[];
    stage?: string;
  } | null;
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

  
  messages?: Message[];
  phase?: InterviewPhase;
  isAnalyzing?: boolean;
  proctorTelemetry?: ProctorTelemetry;
  onSubmitAnswer?: (text: string) => void;
  onEndSession: () => void;

  
  strikeCount?: number;
  showWarningModal?: boolean;
  onResumeFullscreen?: () => void;
  onEliminate?: () => void;
  proctoringClient?: ProctoringClient | null;

  
  onCompleteHRRound?: (result: 'pass' | 'fail', notes: string) => void;
}
