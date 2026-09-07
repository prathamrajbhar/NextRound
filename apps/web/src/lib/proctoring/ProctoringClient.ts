import { ProctoringEventBuffer } from './eventBuffer';
import { apiClient } from '@/lib/apiClient';
import { API_BASE_URL } from '@/lib/config';
import {
  ProctoringClientConfig,
  ProctoringSeverity,
  ProctoringSource,
  ProctoringEventLogger,
  generateUUID,
  normalizeToUUID,
} from './proctoring.types';
import { ProctoringAudioMonitor } from './ProctoringAudioMonitor';
import { ProctoringFaceMonitor } from './ProctoringFaceMonitor';
import { ProctoringSystemMonitor } from './ProctoringSystemMonitor';
import { ProctoringRecorder } from './ProctoringRecorder';
import { ProctoringSnapshotter } from './ProctoringSnapshotter';
import { ProctoringMediaTracker } from './ProctoringMediaTracker';

export class ProctoringClient implements ProctoringEventLogger {
  private config: ProctoringClientConfig;
  private buffer: ProctoringEventBuffer;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private startTime: number;
  private isPaused = false;
  private isEnded = false;
  private suppressViolations = false;
  private apiSessionId: string;

  private audioMonitor: ProctoringAudioMonitor;
  private faceMonitor: ProctoringFaceMonitor;
  private systemMonitor: ProctoringSystemMonitor;
  private recorder: ProctoringRecorder;
  private snapshotter: ProctoringSnapshotter;
  private mediaTracker: ProctoringMediaTracker;

  constructor(config: ProctoringClientConfig) {
    this.config = config;
    this.apiSessionId = normalizeToUUID(config.sessionId);
    this.buffer = new ProctoringEventBuffer(
      config.sessionId,
      `${API_BASE_URL}/proctoring/sessions/${this.apiSessionId}/events`
    );
    this.startTime = Date.now();

    this.audioMonitor = new ProctoringAudioMonitor(this, () => this.isPaused);
    this.recorder = new ProctoringRecorder(this.apiSessionId, this);
    this.snapshotter = new ProctoringSnapshotter(
      this.apiSessionId,
      this,
      () => this.isPaused || this.isEnded,
      () => this.faceMonitor.getVideoElement()
    );
    this.faceMonitor = new ProctoringFaceMonitor(
      this, config.onViolation, (trigger) => this.snapshotter.capture(trigger), () => this.isPaused
    );
    this.systemMonitor = new ProctoringSystemMonitor(this, config.onViolation, () => ({
      isEnded: this.isEnded, isPaused: this.isPaused, suppressViolations: this.suppressViolations,
    }));
    this.mediaTracker = new ProctoringMediaTracker(this, config.onViolation, () => this.isEnded);
  }

  async start(): Promise<void> {
    this.startTime = Date.now();
    try {
      await apiClient.post('/proctoring/sessions', {
        id: this.apiSessionId,
        candidate_id: this.config.candidateId,
        session_type: this.config.sessionType,
        application_id: this.config.applicationId,
        mock_session_id: this.config.mockSessionId,
        assessment_id: this.config.assessmentId,
        policy_version: this.config.policyVersion || 'assessment-v1',
        consent_version: this.config.consentVersion || 'v1',
      });
    } catch {
      // Non-blocking initial registration
    }

    this.systemMonitor.addEventListeners();
    this.heartbeatIntervalId = setInterval(() => this.sendHeartbeat(), 10000);
    this.logEvent('session_started', 'info', 'system');
  }

  logEvent(
    kind: string,
    severity: ProctoringSeverity,
    source: ProctoringSource,
    payload: Record<string, unknown> = {}
  ): void {
    if (this.isPaused && kind !== 'session_resumed') return;

    this.buffer.addEvent({
      client_event_id: generateUUID(),
      kind,
      severity,
      source,
      client_timestamp: new Date().toISOString(),
      session_elapsed_ms: Date.now() - this.startTime,
      payload_json: payload,
    });
  }

  trackMediaStream(stream: MediaStream): void {
    this.mediaTracker.track(stream);
    if (stream.getAudioTracks().length > 0) {
      this.audioMonitor.start(stream);
      this.recorder.startRecording(stream);
    }
    if (stream.getVideoTracks().length > 0) {
      this.faceMonitor.start(stream);
      this.snapshotter.startLoop();
    }
  }

  setSuppressViolations(suppress: boolean): void {
    this.suppressViolations = suppress;
  }

  getRecordingState(): { active: boolean; durationMs: number } {
    return this.recorder.getRecordingState();
  }

  private async sendHeartbeat(): Promise<void> {
    if (this.isPaused) return;
    this.logEvent('heartbeat', 'info', 'system');
    try {
      await apiClient.post(`/proctoring/sessions/${this.apiSessionId}/heartbeat`);
    } catch {
      // Non-blocking heartbeat failure
    }
  }

  async pause(): Promise<void> {
    if (this.isPaused) return;
    this.isPaused = true;
    this.logEvent('session_paused', 'info', 'system');
    try {
      await apiClient.post(`/proctoring/sessions/${this.apiSessionId}/pause`);
    } catch {
      // Non-blocking pause
    }
  }

  async resume(): Promise<void> {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.logEvent('session_resumed', 'info', 'system');
    try {
      await apiClient.post(`/proctoring/sessions/${this.apiSessionId}/resume`);
    } catch {
      // Non-blocking resume
    }
  }

  async end(): Promise<void> {
    this.isEnded = true;
    this.suppressViolations = true;
    this.systemMonitor.removeEventListeners();

    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
    this.audioMonitor.teardown();
    this.faceMonitor.teardown();
    this.snapshotter.stop();
    this.recorder.finalize(true);
    this.mediaTracker.stopAll();

    this.logEvent('session_ended', 'info', 'system');
    await this.buffer.flush();

    try {
      await apiClient.post(`/proctoring/sessions/${this.apiSessionId}/end`);
    } catch {
      // Non-blocking end
    }
  }

  stop(): void {
    this.isEnded = true;
    this.suppressViolations = true;
    this.systemMonitor.removeEventListeners();

    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
    this.audioMonitor.teardown();
    this.faceMonitor.teardown();
    this.snapshotter.stop();
    this.recorder.finalize(false);
    this.mediaTracker.stopAll();
    this.buffer.flush();
  }
}
