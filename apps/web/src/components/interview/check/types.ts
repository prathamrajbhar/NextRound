export type StepKey = 'mic' | 'camera' | 'connection';
export type StepStatus = 'idle' | 'checking' | 'pass' | 'fail';

export interface StepState {
  status: StepStatus;
  label: string;
  error: string;
}

export interface ConnectionResult {
  downloadMbps: number;
  latencyMs: number;
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface InterviewCheckProps {
  company: string;
  role: string;
  camActive?: boolean;
  onJoin: () => void;
}
