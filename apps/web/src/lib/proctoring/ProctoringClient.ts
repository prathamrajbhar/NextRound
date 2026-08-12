import { ProctoringEventBuffer } from './eventBuffer';
import { apiClient } from '@/lib/apiClient';
import { API_BASE_URL } from '@/lib/config';

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

/**
 * Strips any non-UUID prefix (e.g. 'session-') from a session identifier so the
 * value always satisfies the API's `z.string().uuid()` validator and resolves
 * correctly in event-batch route paths.
 */
const normalizeToUUID = (id: string): string => {
  const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = UUID_RE.exec(id);
  return match ? match[0] : id;
};

export class ProctoringClient {
  private config: ProctoringClientConfig;
  private buffer: ProctoringEventBuffer;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private startTime: number;
  private isPaused = false;
  private activeTracks: MediaStreamTrack[] = [];
  /** Normalized pure UUID derived from config.sessionId — safe for API routes. */
  private apiSessionId: string;
  
  // Sound Analysis properties
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private audioIntervalId: ReturnType<typeof setInterval> | null = null;
  private backgroundNoiseFloor = 0;
  private lastAudioVolume = 0;
  private voiceActivityStreak = 0;
  private silenceStreak = 0;

  // Face Analysis properties
  private faceVideoEl: HTMLVideoElement | null = null;
  private faceCanvasEl: HTMLCanvasElement | null = null;
  private faceIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastFaceCount = 1;

  constructor(config: ProctoringClientConfig) {
    this.config = config;
    this.apiSessionId = normalizeToUUID(config.sessionId);
    this.buffer = new ProctoringEventBuffer(
      config.sessionId,
      `${API_BASE_URL}/proctoring/sessions/${this.apiSessionId}/events`
    );
    this.startTime = Date.now();
  }

  async start() {
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
    document.addEventListener('copy', this.handleCopy);
    document.addEventListener('paste', this.handlePaste);
    window.addEventListener('focus', this.handleFocus);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  private removeEventListeners() {
    if (typeof window === 'undefined') return;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('paste', this.handlePaste);
    window.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  logEvent(
    kind: string,
    severity: 'info' | 'warning' | 'low' | 'medium' | 'high',
    source: 'browser' | 'system',
    payload: Record<string, unknown> = {}
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
    if (stream.getAudioTracks().length > 0) {
      this.startAudioAnalysis(stream);
    }
    if (stream.getVideoTracks().length > 0) {
      this.startFaceAnalysis(stream);
    }

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

  private startAudioAnalysis(stream: MediaStream) {
    if (typeof window === 'undefined') return;
    if (this.audioIntervalId) return; // Already analyzing audio

    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 512;
      source.connect(this.audioAnalyser);

      const bufferLength = this.audioAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      this.audioIntervalId = setInterval(() => {
        if (this.isPaused || !this.audioAnalyser) return;
        this.audioAnalyser.getByteFrequencyData(dataArray);

        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += dataArray[i];
        }
        const averageVolume = total / bufferLength;

        if (this.backgroundNoiseFloor === 0) {
          this.backgroundNoiseFloor = averageVolume;
        } else {
          this.backgroundNoiseFloor = this.backgroundNoiseFloor * 0.95 + averageVolume * 0.05;
        }

        let voiceBandEnergy = 0;
        let voiceBandCount = 0;
        const voiceStartBin = 2; // ~85Hz
        const voiceEndBin = 35;  // ~3000Hz (speech range)
        for (let i = voiceStartBin; i <= voiceEndBin; i++) {
          voiceBandEnergy += dataArray[i];
          voiceBandCount++;
        }
        const avgVoiceEnergy = voiceBandEnergy / voiceBandCount;

        const signalToNoise = avgVoiceEnergy - this.backgroundNoiseFloor;
        const isVoicePresent = signalToNoise > 15 && avgVoiceEnergy > 20;

        if (isVoicePresent) {
          this.voiceActivityStreak++;
          this.silenceStreak = 0;
          if (this.voiceActivityStreak === 3) {
            this.logEvent('voice_activity_detected', 'info', 'browser', {
              confidence: 0.85,
              voiceEnergy: avgVoiceEnergy,
              noiseFloor: this.backgroundNoiseFloor,
            });
          }
        } else {
          this.silenceStreak++;
          this.voiceActivityStreak = 0;
        }

        const volumeDiff = averageVolume - this.lastAudioVolume;
        if (volumeDiff > 35 && this.lastAudioVolume > 5) {
          this.logEvent('sudden_noise_spike', 'warning', 'browser', {
            confidence: 0.9,
            prevVolume: this.lastAudioVolume,
            newVolume: averageVolume,
          });
        }
        this.lastAudioVolume = averageVolume;

        let peakCount = 0;
        for (let i = 2; i < bufferLength - 2; i++) {
          if (dataArray[i] > 30 && dataArray[i] > dataArray[i - 1] && dataArray[i] > dataArray[i + 1]) {
            peakCount++;
          }
        }

        if (isVoicePresent && peakCount >= 8) {
          this.logEvent('multiple_voices_detected', 'warning', 'browser', {
            confidence: 0.75,
            peakCount,
            voiceEnergy: avgVoiceEnergy,
          });
        }

        if (!isVoicePresent && averageVolume > this.backgroundNoiseFloor + 25) {
          this.logEvent('background_noise_high', 'info', 'browser', {
            confidence: 0.7,
            volume: averageVolume,
            noiseFloor: this.backgroundNoiseFloor,
          });
        }
      }, 1000);
    } catch (err) {
      console.warn('[ProctoringClient] Web Audio VAD initialization failed:', err);
    }
  }

  private startFaceAnalysis(stream: MediaStream) {
    if (typeof window === 'undefined') return;
    if (this.faceIntervalId) return; // Already analyzing video

    try {
      this.faceVideoEl = document.createElement('video');
      this.faceVideoEl.srcObject = stream;
      this.faceVideoEl.muted = true;
      this.faceVideoEl.playsInline = true;
      this.faceVideoEl.setAttribute('autoplay', 'true');
      this.faceVideoEl.play().catch(() => {});

      this.faceCanvasEl = document.createElement('canvas');
      this.faceCanvasEl.width = 160;
      this.faceCanvasEl.height = 120;

      this.faceIntervalId = setInterval(async () => {
        if (this.isPaused || !this.faceVideoEl) return;

        // Try Shape Detection API if supported
        if ('FaceDetector' in window) {
          try {
            const faceDetector = new (window as typeof window & { FaceDetector: new (config?: { maxDetectedFaces?: number; fastMode?: boolean }) => { detect: (el: HTMLVideoElement) => Promise<unknown[]> } }).FaceDetector({ maxDetectedFaces: 5, fastMode: true });
            const detectedFaces = await faceDetector.detect(this.faceVideoEl);
            const faceCount = detectedFaces.length;
            this.processFaceCount(faceCount, 0.95);
            return;
          } catch {
            // Fallback to canvas blob heuristic
          }
        }

        // Heuristic Canvas fallback: YCbCr skin tone + motion-contour blobs
        const ctx = this.faceCanvasEl?.getContext('2d');
        if (!ctx || !this.faceVideoEl || this.faceVideoEl.paused || this.faceVideoEl.ended) return;

        ctx.drawImage(this.faceVideoEl, 0, 0, 160, 120);
        const imgData = ctx.getImageData(0, 0, 160, 120);
        const data = imgData.data;

        const gridCols = 8;
        const gridRows = 6;
        const cellWidth = 20;
        const cellHeight = 20;
        const grid = Array(gridRows).fill(0).map(() => Array(gridCols).fill(0));

        for (let y = 0; y < 120; y += 2) {
          for (let x = 0; x < 160; x += 2) {
            const idx = (y * 160 + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const Y = 0.299 * r + 0.587 * g + 0.114 * b;
            const Cb = -0.1687 * r - 0.3313 * g + 0.5 * b + 128;
            const Cr = 0.5 * r - 0.4187 * g - 0.0813 * b + 128;

            if (Y > 40 && Cb > 85 && Cb < 135 && Cr > 135 && Cr < 180) {
              const col = Math.floor(x / cellWidth);
              const row = Math.floor(y / cellHeight);
              if (col < gridCols && row < gridRows) {
                grid[row][col]++;
              }
            }
          }
        }

        const threshold = 30;
        const visited = Array(gridRows).fill(0).map(() => Array(gridCols).fill(false));
        let blobs = 0;

        for (let r = 0; r < gridRows; r++) {
          for (let c = 0; c < gridCols; c++) {
            if (grid[r][c] >= threshold && !visited[r][c]) {
              blobs++;
              const queue = [[r, c]];
              visited[r][c] = true;
              while (queue.length > 0) {
                const [currR, currC] = queue.shift()!;
                const directions = [
                  [-1, 0], [1, 0], [0, -1], [0, 1]
                ];
                for (const [dr, dc] of directions) {
                  const newR = currR + dr;
                  const newC = currC + dc;
                  if (
                    newR >= 0 && newR < gridRows &&
                    newC >= 0 && newC < gridCols &&
                    grid[newR][newC] >= threshold &&
                    !visited[newR][newC]
                  ) {
                    visited[newR][newC] = true;
                    queue.push([newR, newC]);
                  }
                }
              }
            }
          }
        }

        const faceCount = blobs;
        this.processFaceCount(faceCount, 0.70);
      }, 4000);

    } catch (err) {
      console.warn('[ProctoringClient] Canvas Face Detection initialization failed:', err);
    }
  }

  private processFaceCount(faceCount: number, confidence: number) {
    if (faceCount !== this.lastFaceCount) {
      this.logEvent('face_count_changed', 'info', 'browser', {
        confidence,
        prevFaceCount: this.lastFaceCount,
        newFaceCount: faceCount,
      });

      if (faceCount === 0) {
        this.logEvent('no_face_detected', 'warning', 'browser', { confidence });
        this.config.onViolation('no_face_detected');
      } else if (faceCount >= 2) {
        this.logEvent('multiple_faces_detected', 'warning', 'browser', { confidence });
        this.config.onViolation('multiple_faces_detected');
      }
      this.lastFaceCount = faceCount;
    }
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
      await apiClient.post(`/proctoring/sessions/${this.apiSessionId}/heartbeat`);
    } catch (err) {
      console.warn('[ProctoringClient] Heartbeat check failed:', err);
    }
  }

  async pause() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.logEvent('session_paused', 'info', 'system');
    try {
      await apiClient.post(`/proctoring/sessions/${this.apiSessionId}/pause`);
    } catch (err) {
      console.error('[ProctoringClient] Server pause failed:', err);
    }
  }

  async resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.logEvent('session_resumed', 'info', 'system');
    try {
      await apiClient.post(`/proctoring/sessions/${this.apiSessionId}/resume`);
    } catch (err) {
      console.error('[ProctoringClient] Server resume failed:', err);
    }
  }

  async end() {
    this.removeEventListeners();
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
    if (this.audioIntervalId) {
      clearInterval(this.audioIntervalId);
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
    }
    if (this.faceIntervalId) {
      clearInterval(this.faceIntervalId);
    }
    if (this.faceVideoEl) {
      this.faceVideoEl.srcObject = null;
      this.faceVideoEl = null;
    }
    this.logEvent('session_ended', 'info', 'system');
    // Flush event buffer to server synchronously before ending session
    await this.buffer.flush();
    try {
      await apiClient.post(`/proctoring/sessions/${this.apiSessionId}/end`);
    } catch (err) {
      console.error('[ProctoringClient] Server end failed:', err);
    }
  }

  private handleCopy = () => {
    this.logEvent('copy_activity', 'info', 'browser', {
      timestamp: new Date().toISOString(),
    });
  };

  private handlePaste = () => {
    this.logEvent('paste_activity', 'warning', 'browser', {
      timestamp: new Date().toISOString(),
    });
    this.config.onViolation('paste_activity');
  };

  private handleBeforeUnload = () => {
    this.logEvent('session_unload_attempt', 'warning', 'browser', {
      timestamp: new Date().toISOString(),
    });
  };

  stop() {
    this.removeEventListeners();
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
    if (this.audioIntervalId) {
      clearInterval(this.audioIntervalId);
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
    }
    if (this.faceIntervalId) {
      clearInterval(this.faceIntervalId);
    }
    if (this.faceVideoEl) {
      this.faceVideoEl.srcObject = null;
      this.faceVideoEl = null;
    }
    this.buffer.flush();
  }
}
