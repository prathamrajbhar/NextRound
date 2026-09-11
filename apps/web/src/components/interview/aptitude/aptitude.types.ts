import type { AptitudeQuestion } from './useAptitudeQuestions';
import type { ProctoringClient } from '@/lib/proctoring/ProctoringClient';

export interface UseAptitudeSessionOptions {
  questions?: AptitudeQuestion[];
  applicationId?: string;
  sessionId?: string;
  role: string;
  company: string;
  onComplete: (score: number) => void;
  disableProctoring?: boolean;
}

export interface AptitudeTestConsoleProps {
  questions?: AptitudeQuestion[];
  companyName?: string;
  company?: string;
  role?: string;
  roleTitle?: string;
  companyLogoUrl?: string;
  onComplete: (score: number) => void;
  applicationId?: string;
  sessionId?: string;
  proctoringClient?: ProctoringClient | null;
  strikeCount?: number;
  showWarningModal?: boolean;
  onResumeFullscreen?: () => void;
  recordingActive?: boolean;
  recordingDurationMs?: number;
}
