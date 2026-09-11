import { apiClient } from '@/lib/apiClient';
import { ProctoringEventLogger } from './proctoring.types';

export class ProctoringSnapshotter {
  private snapshotIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastSnapshotAt = 0;

  constructor(
    private apiSessionId: string,
    private logger: ProctoringEventLogger,
    private isPausedOrEndedGetter: () => boolean,
    private getVideoElement: () => HTMLVideoElement | null
  ) {}

  startLoop(): void {
    if (typeof window === 'undefined' || this.snapshotIntervalId) return;
    this.lastSnapshotAt = Date.now();

    this.snapshotIntervalId = setInterval(() => {
      if (this.isPausedOrEndedGetter()) return;
      if (Date.now() - this.lastSnapshotAt >= 30000) {
        this.capture('periodic');
      }
    }, 10000);
  }

  async capture(trigger: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const videoEl = this.getVideoElement();
    if (!videoEl || videoEl.readyState < 2) return;
    if (Date.now() - this.lastSnapshotAt < 5000) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoEl, 0, 0, 480, 360);

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
      this.logger.logEvent('snapshot_captured', 'info', 'system', {
        trigger,
        size_bytes: blob.size,
      });
    } catch {
      // Non-blocking snapshot failure
    }
  }

  stop(): void {
    if (this.snapshotIntervalId) {
      clearInterval(this.snapshotIntervalId);
      this.snapshotIntervalId = null;
    }
  }
}
