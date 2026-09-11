export interface ProctoringPolicy {
  version: string;
  fullscreenRequired: boolean;
  heartbeatIntervalSeconds: number;
  hiddenWarningCount: number;
  hiddenReviewCount: number;
  outsideFullscreenWarningSeconds: number;
  outsideFullscreenReviewSeconds: number;
  heartbeatReviewSeconds: number;
}

export interface ProctoringSummary {
  tabSwitchCount: number;
  totalHiddenDurationMs: number;
  fullscreenExitCount: number;
  totalOutsideFullscreenMs: number;
  maxHeartbeatGapMs: number;
  cameraOffDurationMs: number;
  micOffDurationMs: number;
  totalFaceMissingMs?: number;
  totalMultipleFacesMs?: number;
  multipleVoicesCount?: number;
  backgroundNoiseHighCount?: number;
  copyPasteActivityCount?: number;
  suspiciousBehaviorPattern?: boolean;
}

export interface PolicyViolationResult {
  rule_code: string;
  severity: 'low' | 'medium' | 'high';
  occurrence_count: number;
  first_seen_at: Date;
  last_seen_at: Date;
}

export interface ProctoringEventInput {
  kind: string;
  severity: string;
  client_timestamp: Date;
  session_elapsed_ms: number;
  payload_json: unknown;
}

export const DEFAULT_POLICY: ProctoringPolicy = {
  version: 'assessment-v1',
  fullscreenRequired: true,
  heartbeatIntervalSeconds: 10,
  hiddenWarningCount: 1,
  hiddenReviewCount: 4,
  outsideFullscreenWarningSeconds: 5,
  outsideFullscreenReviewSeconds: 30,
  heartbeatReviewSeconds: 120,
};

export function getPolicy(version?: string): ProctoringPolicy {
  if (version === 'assessment-v1') {
    return DEFAULT_POLICY;
  }
  return DEFAULT_POLICY;
}
