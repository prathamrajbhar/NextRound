export interface EvidenceRecording {
  url: string;
  duration_ms?: number | null;
  size_bytes?: number | null;
}

export interface EvidenceSnapshot {
  id: string;
  kind: string;
  mime_type: string;
  url: string;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  duration_ms?: number | null;
  captured_at: string;
  payload_json?: Record<string, unknown>;
}

export interface ProctoringSummary {
  tabSwitchCount?: number;
  totalHiddenDurationMs?: number;
  fullscreenExitCount?: number;
  totalOutsideFullscreenMs?: number;
  maxHeartbeatGapMs?: number;
  cameraOffDurationMs?: number;
  micOffDurationMs?: number;
  totalFaceMissingMs?: number;
  totalMultipleFacesMs?: number;
  multipleVoicesCount?: number;
  backgroundNoiseHighCount?: number;
  copyPasteActivityCount?: number;
  suspiciousBehaviorPattern?: boolean;
}

export const fmtMs = (ms?: number | null) => {
  if (!ms && ms !== 0) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, '0')}s`;
};

export const fmtBytes = (bytes?: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const riskColor = (score: number) => {
  if (score >= 60) return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
  if (score >= 30) return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
  return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
};

export const riskBar = (score: number) => {
  if (score >= 60) return 'bg-rose-500';
  if (score >= 30) return 'bg-amber-500';
  return 'bg-emerald-500';
};
