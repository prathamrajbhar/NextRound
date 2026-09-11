import { apiClient } from '@/lib/apiClient';
import { ProctoringEventLogger } from './proctoring.types';

export class ProctoringRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordingChunks: Blob[] = [];
  private recordingStartTime = 0;
  private recordingActive = false;
  private recordingDurationMs = 0;
  private recordingTickId: ReturnType<typeof setInterval> | null = null;
  private uploadRecordingOnStop = false;

  constructor(
    private apiSessionId: string,
    private logger: ProctoringEventLogger
  ) {}

  startRecording(stream: MediaStream): void {
    if (typeof window === 'undefined' || (this.mediaRecorder && this.recordingActive)) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', ''].find(
      (t) => !t || (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t))
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
        this.clearTick();
        if (this.uploadRecordingOnStop) {
          this.uploadRecording();
        }
        this.mediaRecorder = null;
      };
      recorder.onerror = () => {
        this.recordingActive = false;
        this.clearTick();
        this.mediaRecorder = null;
      };

      this.mediaRecorder = recorder;
      this.recordingActive = true;
      if (recorder.state === 'inactive') {
        recorder.start(1000);
      }

      this.recordingTickId = setInterval(() => {
        if (this.recordingActive) {
          this.recordingDurationMs = Date.now() - this.recordingStartTime;
        }
      }, 1000);

      this.logger.logEvent('recording_started', 'info', 'system', {
        mimeType: recorder.mimeType || mimeType,
      });
    } catch {
      this.recordingActive = false;
      this.mediaRecorder = null;
    }
  }

  private clearTick(): void {
    if (this.recordingTickId) {
      clearInterval(this.recordingTickId);
      this.recordingTickId = null;
    }
  }

  async uploadRecording(): Promise<void> {
    if (this.recordingChunks.length === 0) {
      this.logger.logEvent('recording_empty', 'warning', 'system');
      return;
    }

    const blob = new Blob(this.recordingChunks, {
      type: this.mediaRecorder?.mimeType || 'audio/webm',
    });
    const durationMs = this.recordingDurationMs || Date.now() - this.recordingStartTime;

    try {
      const formData = new FormData();
      formData.append('file', blob, `proctor-${this.apiSessionId}.webm`);
      formData.append('duration_ms', String(durationMs));
      await apiClient.post(`/proctoring/sessions/${this.apiSessionId}/recording`, formData);
      this.logger.logEvent('recording_uploaded', 'info', 'system', {
        size_bytes: blob.size,
        duration_ms: durationMs,
      });
    } catch {
      this.logger.logEvent('recording_upload_failed', 'high', 'system', {
        size_bytes: blob.size,
      });
    } finally {
      this.recordingChunks = [];
      this.recordingDurationMs = 0;
    }
  }

  finalize(upload: boolean): void {
    this.uploadRecordingOnStop = upload;
    if (this.mediaRecorder && this.recordingActive) {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignored
      }
    } else if (upload) {
      this.uploadRecording();
    }
    this.recordingActive = false;
    this.mediaRecorder = null;
  }

  getRecordingState(): { active: boolean; durationMs: number } {
    return {
      active: this.recordingActive,
      durationMs: this.recordingDurationMs,
    };
  }
}
