import type { ProctoringClient } from '@/lib/proctoring/ProctoringClient';

export interface CodingConsoleProps {
  company?: string;
  role?: string;
  applicationId?: string;
  sessionId?: string;
  onComplete: (score: number) => void;
  proctoringClient?: ProctoringClient | null;
  strikeCount?: number;
  showWarningModal?: boolean;
  onResumeFullscreen?: () => void;
  recordingActive?: boolean;
  recordingDurationMs?: number;
}
