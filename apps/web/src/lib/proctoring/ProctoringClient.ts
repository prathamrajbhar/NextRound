import { ProctoringEventBuffer } from './eventBuffer';
import { apiClient } from '@/lib/apiClient';

interface ProctoringClientConfig {
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

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Simple UUID v4 fallback for unsecured contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export class ProctoringClient {
  private config: ProctoringClientConfig;
  private buffer: ProctoringEventBuffer;
  private heartbeatIntervalId: any = null;
  private startTime: number;
  private isPaused = false;
  private activeTracks: MediaStreamTrack[] = [];

  constructor(config: ProctoringClientConfig) {
    this.config = config;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const apiBase = process.env.NEXT_PUBLIC_API_URL || `${origin}/api/v1`;
    this.buffer = new ProctoringEventBuffer(
      config.sessionId,
      `${apiBase}/proctoring/sessions/${config.sessionId}/events`
    );
    this.startTime = Date.now();
  }

  async start() {
    this.startTime = Date.now();
    try {
      // Create session on server
      await apiClient.post('/proctoring/sessions', {
        id: this.config.sessionId,
        candidate_id: this.config.candidateId,
        session_type: this.config.sessionType,
        application_id: this.config.applicationId,
        mock_session_id: this.config.mockSessionId,
        assessment_id: this.config.assessmentId,
        policy_version: this.config.policyVersion || 'assessment-v1',
        consent_version: this.config.consentVersion || 'v1',
      });
    } catch (err) {
      console.error('[ProctoringClient] Failed to register session on API:', err);
    }

    this.addEventListeners();

    // Start sending heartbeat check-ins every 10 seconds
    this.heartbeatIntervalId = setInterval(() => this.sendHeartbeat(), 10000);

    this.logEvent('session_started', 'info', 'system');
  }

  private addEventListeners() {
    if (typeof window === 'undefined') return;

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    window.addEventListener('focus', this.handleFocus);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private removeEventListeners() {
    if (typeof window === 'undefined') return;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    window.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  logEvent(
    kind: string,
    severity: 'info' | 'warning' | 'low' | 'medium' | 'high',
    source: 'browser' | 'system',
    payload: any = {}
  ) {
    if (this.isPaused && kind !== 'session_resumed') return;

    const event = {
      client_event_id: generateUUID(),
      kind,
      severity,
      source,
      client_timestamp: new Date().toISOString(),
      session_elapsed_ms: Date.now() - this.startTime,
      payload_json: payload,
    };

    this.buffer.addEvent(event);
  }

  trackMediaStream(stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      // Check if we are already tracking this specific track ID
      if (this.activeTracks.some((t) => t.id === track.id)) return;
      this.activeTracks.push(track);

      this.logEvent(`${track.kind}_started`, 'info', 'browser', {
        trackId: track.id,
        label: track.label,
      });

      track.onended = () => {
        this.logEvent(`${track.kind}_stopped`, 'warning', 'browser', {
          trackId: track.id,
          label: track.label,
        });
        this.config.onViolation(`${track.kind}_stopped`);
      };

      // Watch for mute/unmute events
      track.onmute = () => {
        this.logEvent(`${track.kind}_muted`, 'warning', 'browser', {
          trackId: track.id,
        });
      };
      track.onunmute = () => {
        this.logEvent(`${track.kind}_unmuted`, 'info', 'browser', {
          trackId: track.id,
        });
      };
    });
  }

  private handleVisibilityChange = () => {
    const isHidden = document.hidden;
    const kind = isHidden ? 'tab_hidden' : 'tab_visible';
    const severity = isHidden ? 'warning' : 'info';
    this.logEvent(kind, severity, 'browser');
    if (isHidden) {
      this.config.onViolation('tab_hidden');
    }
  };

  private handleFullscreenChange = () => {
    const isFS = !!document.fullscreenElement;
    const kind = isFS ? 'fullscreen_enter' : 'fullscreen_exit';
    const severity = isFS ? 'info' : 'warning';
    this.logEvent(kind, severity, 'browser');
    if (!isFS) {
      this.config.onViolation('fullscreen_exit');
    }
  };

  private handleFocus = () => {
    this.logEvent('window_focus', 'info', 'browser');
  };

  private handleBlur = () => {
    this.logEvent('window_blur', 'warning', 'browser');
    this.config.onViolation('window_blur');
  };

  private handleOnline = () => {
    this.logEvent('network_reconnected', 'info', 'system');
  };

  private handleOffline = () => {
    this.logEvent('network_disconnected', 'high', 'system');
    this.config.onViolation('network_disconnected');
  };

  private async sendHeartbeat() {
    if (this.isPaused) return;
    this.logEvent('heartbeat', 'info', 'system');
    try {
      await apiClient.post(`/proctoring/sessions/${this.config.sessionId}/heartbeat`);
    } catch (err) {
      console.warn('[ProctoringClient] Heartbeat check failed:', err);
    }
  }

  async pause() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.logEvent('session_paused', 'info', 'system');
    try {
      await apiClient.post(`/proctoring/sessions/${this.config.sessionId}/pause`);
    } catch (err) {
      console.error('[ProctoringClient] Server pause failed:', err);
    }
  }

  async resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.logEvent('session_resumed', 'info', 'system');
    try {
      await apiClient.post(`/proctoring/sessions/${this.config.sessionId}/resume`);
    } catch (err) {
      console.error('[ProctoringClient] Server resume failed:', err);
    }
  }

  async end() {
    this.removeEventListeners();
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
    this.logEvent('session_ended', 'info', 'system');
    // Flush event buffer to server synchronously before ending session
    await this.buffer.flush();
    try {
      await apiClient.post(`/proctoring/sessions/${this.config.sessionId}/end`);
    } catch (err) {
      console.error('[ProctoringClient] Server end failed:', err);
    }
  }

  stop() {
    this.removeEventListeners();
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
    this.buffer.flush();
  }
}
