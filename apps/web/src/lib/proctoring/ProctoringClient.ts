import { ProctoringEventBuffer } from './eventBuffer';
import { apiClient } from '@/lib/apiClient';
import { API_BASE_URL } from '@/lib/config';
import { detectFaces, loadFaceDetector } from './faceDetector';
import { mediaManager } from '@/lib/media/mediaManager';

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
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};






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
  private isEnded = false;
  private suppressViolations = false;
  private activeTracks: MediaStreamTrack[] = [];
  
  private apiSessionId: string;
  
  
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private audioIntervalId: ReturnType<typeof setInterval> | null = null;
  private audioStream: MediaStream | null = null;
  private backgroundNoiseFloor = 0;
  private lastAudioVolume = 0;
  private voiceActivityStreak = 0;
  private silenceStreak = 0;

  
  private faceVideoEl: HTMLVideoElement | null = null;
  private faceCanvasEl: HTMLCanvasElement | null = null;
  private faceIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastFaceCount = 1;

  private mediaRecorder: MediaRecorder | null = null;
  private recordingChunks: Blob[] = [];
  private recordingStartTime = 0;
  private recordingActive = false;
  private recordingDurationMs = 0;
  private recordingTickId: ReturnType<typeof setInterval> | null = null;
  private uploadRecordingOnStop = false;

  private snapshotIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastSnapshotAt = 0;
  private lastSnapshotFaceCount = 1;
  private multiFacePersistStart: number | null = null;
  private multiFacePersistFired = false;

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
    mediaManager.acquire(stream);
    if (stream.getAudioTracks().length > 0) {
      this.startAudioAnalysis(stream);
      this.startRecording(stream);
    }
    if (stream.getVideoTracks().length > 0) {
      this.startFaceAnalysis(stream);
      this.startSnapshotLoop();
    }

    stream.getTracks().forEach((track) => {
      
      if (this.activeTracks.some((t) => t.id === track.id)) return;
      this.activeTracks.push(track);

      this.logEvent(`${track.kind}_started`, 'info', 'browser', {
        trackId: track.id,
        label: track.label,
      });

      track.onended = () => {
        if (this.isEnded) return;
        this.logEvent(`${track.kind}_stopped`, 'warning', 'browser', {
          trackId: track.id,
          label: track.label,
        });
        this.config.onViolation(`${track.kind}_stopped`);
      };

      
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

    if (this.audioIntervalId && this.audioStream === stream) return;
    if (this.audioIntervalId && this.audioStream && this.audioStream !== stream) {
      this.teardownAudioAnalysis();
    }

    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 512;
      source.connect(this.audioAnalyser);
      this.audioStream = stream;

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
        const voiceStartBin = 2; 
        const voiceEndBin = 35;  
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

  private teardownAudioAnalysis() {
    if (this.audioIntervalId) {
      clearInterval(this.audioIntervalId);
      this.audioIntervalId = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.audioAnalyser = null;
    this.audioStream = null;
    this.backgroundNoiseFloor = 0;
    this.lastAudioVolume = 0;
  }

  private startFaceAnalysis(stream: MediaStream) {
    if (typeof window === 'undefined') return;

    if (this.faceVideoEl) {
      this.faceVideoEl.srcObject = stream;
      this.faceVideoEl.play().catch(() => {});
      return;
    }

    if (this.faceIntervalId) return;

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

      loadFaceDetector().then((loaded) => {
        this.logEvent('face_detector_engine', 'info', 'system', {
          engine: loaded ? 'mediapipe' : 'heuristic_fallback',
        });
      });

      this.faceIntervalId = setInterval(async () => {
        if (this.isPaused || !this.faceVideoEl) return;

        const mpResult = await detectFaces(this.faceVideoEl);
        let faceCount: number | null = null;
        if (!mpResult.ok) {
          this.runHeuristicFaceAnalysis();
        } else if (mpResult.confidence > 0) {
          faceCount = mpResult.count;
          this.processFaceCount(mpResult.count, mpResult.confidence);
        }

        this.trackMultiFacePersistence(faceCount ?? this.lastFaceCount);
      }, 1000);

    } catch (err) {
      console.warn('[ProctoringClient] MediaPipe Face Detection initialization failed:', err);
    }
  }

  private runHeuristicFaceAnalysis() {
    if (typeof window === 'undefined' || !this.faceVideoEl) return;

    if ('FaceDetector' in window) {
      try {
        const faceDetector = new (window as typeof window & { FaceDetector: new (config?: { maxDetectedFaces?: number; fastMode?: boolean }) => { detect: (el: HTMLVideoElement) => Promise<unknown[]> } }).FaceDetector({ maxDetectedFaces: 5, fastMode: true });
        faceDetector.detect(this.faceVideoEl).then((detectedFaces) => {
          this.processFaceCount(detectedFaces.length, 0.95);
        }).catch(() => {
          this.heuristicBlobDetection();
        });
        return;
      } catch {}
    }

    this.heuristicBlobDetection();
  }

  private heuristicBlobDetection() {
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

    this.processFaceCount(blobs, 0.70);
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
        this.captureSnapshot('no_face');
      } else if (faceCount >= 2) {
        this.logEvent('multiple_faces_detected', 'warning', 'browser', { confidence });
        this.config.onViolation('multiple_faces_detected');
        this.captureSnapshot('multiple_faces');
      }
      this.lastFaceCount = faceCount;
      this.lastSnapshotFaceCount = faceCount;
    }
  }

  private trackMultiFacePersistence(faceCount: number) {
    const now = Date.now();

    if (faceCount >= 2) {
      if (this.multiFacePersistStart === null) {
        this.multiFacePersistStart = now;
        this.multiFacePersistFired = false;
      } else if (
        !this.multiFacePersistFired &&
        now - this.multiFacePersistStart >= 5000
      ) {
        this.multiFacePersistFired = true;
        this.logEvent('multiple_faces_persistent', 'high', 'browser', {
          duration_ms: now - this.multiFacePersistStart,
        });
        this.config.onViolation('multiple_faces_persistent');
        this.captureSnapshot('multiple_faces_persistent');
      }
    } else {
      this.multiFacePersistStart = null;
      this.multiFacePersistFired = false;
    }
  }

  public setSuppressViolations(suppress: boolean) {
    this.suppressViolations = suppress;
  }

  private startRecording(stream: MediaStream) {
    if (typeof window === 'undefined') return;
    if (this.mediaRecorder && this.recordingActive) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', ''].find(
      (t) => !t || typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)
    );

    try {
      this.recordingChunks = [];
      this.recordingStartTime = Date.now();
      this.recordingDurationMs = 0;
      this.uploadRecordingOnStop = false;

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordingChunks.push(e.data);
        }
      };
      recorder.onstop = () => {
        this.recordingActive = false;
        if (this.recordingTickId) {
          clearInterval(this.recordingTickId);
          this.recordingTickId = null;
        }
        if (this.uploadRecordingOnStop) {
          this.uploadRecording();
        }
        this.mediaRecorder = null;
      };
      recorder.onerror = () => {
        this.recordingActive = false;
        if (this.recordingTickId) {
          clearInterval(this.recordingTickId);
          this.recordingTickId = null;
        }
        this.mediaRecorder = null;
      };

      this.mediaRecorder = recorder;
      this.recordingActive = true;
      try {
        if (recorder.state === 'inactive') {
          recorder.start(1000);
        }
      } catch (err) {
        this.recordingActive = false;
        this.mediaRecorder = null;
        if (this.recordingTickId) {
          clearInterval(this.recordingTickId);
          this.recordingTickId = null;
        }
        console.warn('[ProctoringClient] MediaRecorder start failed; recording disabled for this session:', err);
        this.logEvent('recording_start_failed', 'warning', 'system', {
          mimeType: mimeType || 'default',
        });
        return;
      }

      this.recordingTickId = setInterval(() => {
        if (this.recordingActive) {
          this.recordingDurationMs = Date.now() - this.recordingStartTime;
        }
      }, 1000);

      this.logEvent('recording_started', 'info', 'browser', {
        mimeType: mimeType || 'default',
        trackId: audioTrack.id,
      });
    } catch (err) {
      console.warn('[ProctoringClient] MediaRecorder initialization failed:', err);
      this.recordingActive = false;
    }
  }

  private async uploadRecording() {
    if (this.recordingChunks.length === 0) {
      this.logEvent('recording_empty', 'warning', 'system');
      return;
    }

    const blob = new Blob(this.recordingChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
    const durationMs = this.recordingDurationMs || (Date.now() - this.recordingStartTime);

    try {
      const formData = new FormData();
      formData.append('file', blob, `proctor-${this.apiSessionId}.webm`);
      formData.append('duration_ms', String(durationMs));
      await apiClient.post(`/proctoring/sessions/${this.apiSessionId}/recording`, formData);
      this.logEvent('recording_uploaded', 'info', 'system', {
        size_bytes: blob.size,
        duration_ms: durationMs,
      });
    } catch (err) {
      console.error('[ProctoringClient] Recording upload failed:', err);
      this.logEvent('recording_upload_failed', 'high', 'system', {
        size_bytes: blob.size,
      });
    } finally {
      this.recordingChunks = [];
      this.recordingDurationMs = 0;
    }
  }

  private startSnapshotLoop() {
    if (typeof window === 'undefined') return;
    if (this.snapshotIntervalId) return;
    this.lastSnapshotAt = Date.now();

    this.snapshotIntervalId = setInterval(() => {
      if (this.isPaused || this.isEnded) return;
      if (Date.now() - this.lastSnapshotAt >= 30000) {
        this.captureSnapshot('periodic');
      }
    }, 10000);
  }

  private async captureSnapshot(trigger: string) {
    if (typeof window === 'undefined') return;
    if (!this.faceVideoEl || this.faceVideoEl.readyState < 2) return;
    if (Date.now() - this.lastSnapshotAt < 5000) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(this.faceVideoEl, 0, 0, 480, 360);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.7)
      );
      if (!blob) return;

      const formData = new FormData();
      formData.append('file', blob, `proctor-${this.apiSessionId}-snap.jpg`);
      formData.append('width', '480');
      formData.append('height', '360');

      await apiClient.post(`/proctoring/sessions/${this.apiSessionId}/evidence`, formData);
      this.lastSnapshotAt = Date.now();
      this.logEvent('snapshot_captured', 'info', 'system', {
        trigger,
        size_bytes: blob.size,
      });
    } catch (err) {
      console.warn('[ProctoringClient] Snapshot capture failed:', err);
    }
  }

  public getRecordingState() {
    return {
      active: this.recordingActive,
      durationMs: this.recordingDurationMs,
    };
  }

  private handleVisibilityChange = () => {
    if (this.isEnded || this.isPaused || this.suppressViolations) return;
    const isHidden = document.hidden;
    const kind = isHidden ? 'tab_hidden' : 'tab_visible';
    const severity = isHidden ? 'warning' : 'info';
    this.logEvent(kind, severity, 'browser');
    if (isHidden) {
      this.config.onViolation('tab_hidden');
    }
  };

  private handleFullscreenChange = () => {
    if (this.isEnded || this.isPaused || this.suppressViolations) return;
    const isFS = !!document.fullscreenElement;
    const kind = isFS ? 'fullscreen_enter' : 'fullscreen_exit';
    const severity = isFS ? 'info' : 'warning';
    this.logEvent(kind, severity, 'browser');
    if (!isFS) {
      this.config.onViolation('fullscreen_exit');
    }
  };

  private handleFocus = () => {
    if (this.isEnded || this.isPaused || this.suppressViolations) return;
    this.logEvent('window_focus', 'info', 'browser');
  };

  private handleBlur = () => {
    if (this.isEnded || this.isPaused || this.suppressViolations) return;
    this.logEvent('window_blur', 'warning', 'browser');
    this.config.onViolation('window_blur');
  };

  private handleOnline = () => {
    if (this.isEnded) return;
    this.logEvent('network_reconnected', 'info', 'system');
  };

  private handleOffline = () => {
    if (this.isEnded || this.suppressViolations) return;
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

  private stopTrackedMedia() {
    for (const track of this.activeTracks) {
      try {
        track.stop();
      } catch {}
    }
    this.activeTracks = [];
  }

  async end() {
    this.isEnded = true;
    this.suppressViolations = true;
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
    if (this.snapshotIntervalId) {
      clearInterval(this.snapshotIntervalId);
    }
    this.finalizeRecording(true);
    this.stopTrackedMedia();
    if (this.faceVideoEl) {
      this.faceVideoEl.srcObject = null;
      this.faceVideoEl = null;
    }
    this.logEvent('session_ended', 'info', 'system');
    
    await this.buffer.flush();
    try {
      await apiClient.post(`/proctoring/sessions/${this.apiSessionId}/end`);
    } catch (err) {
      console.error('[ProctoringClient] Server end failed:', err);
    }
  }

  private finalizeRecording(upload: boolean) {
    this.uploadRecordingOnStop = upload;
    if (this.mediaRecorder && this.recordingActive) {
      try {
        this.mediaRecorder.stop();
      } catch (err) {
        console.warn('[ProctoringClient] Recorder stop failed:', err);
      }
    } else if (upload) {
      this.uploadRecording();
    }
    this.recordingActive = false;
    this.mediaRecorder = null;
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
    this.isEnded = true;
    this.suppressViolations = true;
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
    if (this.snapshotIntervalId) {
      clearInterval(this.snapshotIntervalId);
    }
    this.finalizeRecording(false);
    this.stopTrackedMedia();
    if (this.faceVideoEl) {
      this.faceVideoEl.srcObject = null;
      this.faceVideoEl = null;
    }
    this.buffer.flush();
  }
}
