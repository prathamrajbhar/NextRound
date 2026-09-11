import type { ProctoringEventInput } from './proctoring-policy.types';

export interface AggregatedTelemetry {
  sortedEvents: ProctoringEventInput[];
  sessionStart: Date;
  sessionEnd: Date;
  tabSwitchCount: number;
  totalHiddenDurationMs: number;
  fullscreenExitCount: number;
  totalOutsideFullscreenMs: number;
  maxHeartbeatGapMs: number;
  cameraOffDurationMs: number;
  micOffDurationMs: number;
  totalFaceMissingMs: number;
  faceMissingCount: number;
  totalMultipleFacesMs: number;
  multipleFacesCount: number;
  multipleVoicesCount: number;
  backgroundNoiseHighCount: number;
  copyPasteActivityCount: number;
  hasRapidWarnings: boolean;
}
