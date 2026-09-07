export interface ProctoringViolation {
  id: string;
  rule_code: string;
  severity: 'low' | 'medium' | 'high';
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  status: string;
  reviewer_id?: string | null;
  review_reason?: string | null;
}

export interface ProctoringEvent {
  id: string;
  kind: string;
  severity: 'info' | 'warning' | 'low' | 'medium' | 'high';
  source: string;
  client_timestamp: string;
  session_elapsed_ms: number;
  payload_json?: Record<string, unknown>;
}

export interface ProctoringReport {
  session: {
    id: string;
    session_type: string;
    status: string;
    started_at: string;
    ended_at: string | null;
    last_heartbeat_at: string | null;
    candidate_email: string;
  };
  risk_score?: number | null;
  summary?: {
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
  } | null;
  recording?: {
    url: string;
    duration_ms?: number | null;
    size_bytes?: number | null;
  } | null;
  evidence?: Array<{
    id: string;
    kind: string;
    mime_type: string;
    url: string;
    size_bytes?: number | null;
    width?: number | null;
    height?: number | null;
    captured_at: string;
    payload_json?: Record<string, unknown>;
  }>;
  violations: ProctoringViolation[];
  events: ProctoringEvent[];
}

export const SEVERITY_COLORS: Record<string, string> = {
  high: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  low: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  warning: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  info: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
};

export function getRuleName(code: string): string {
  switch (code) {
    case 'repeated_tab_switch':
      return 'Tab Switch Detection';
    case 'fullscreen_exit_review':
      return 'Fullscreen Breach (Critical)';
    case 'fullscreen_exit_warning':
      return 'Fullscreen Breach (Warning)';
    case 'heartbeat_gap':
      return 'Telemetry Gap / Reconnects';
    case 'media_track_disabled':
      return 'Media Track Interruption';
    default:
      return code.replace(/_/g, ' ');
  }
}
