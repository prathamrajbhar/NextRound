export interface ProctoringClientConfig {
  sessionId: string;
  candidateId: string;
  sessionType: 'aptitude' | 'coding' | 'video' | 'interview';
  applicationId?: string;
  mockSessionId?: string;
  assessmentId?: string;
  policyVersion?: string;
  consentVersion?: string;
  onViolation: (kind: string) => void;
}

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const normalizeToUUID = (id: string): string => {
  const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = UUID_RE.exec(id);
  return match ? match[0] : id;
};

export type ProctoringSeverity = 'info' | 'warning' | 'low' | 'medium' | 'high';
export type ProctoringSource = 'browser' | 'system';

export interface ProctoringEventLogger {
  logEvent: (
    kind: string,
    severity: ProctoringSeverity,
    source: ProctoringSource,
    payload?: Record<string, unknown>
  ) => void;
}
