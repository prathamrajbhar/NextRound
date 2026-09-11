import { mediaManager } from '@/lib/media/mediaManager';
import { ProctoringEventLogger } from './proctoring.types';

export class ProctoringMediaTracker {
  private activeTracks: MediaStreamTrack[] = [];

  constructor(
    private logger: ProctoringEventLogger,
    private onViolation: (kind: string) => void,
    private isEndedGetter: () => boolean
  ) {}

  track(stream: MediaStream): void {
    mediaManager.acquire(stream);

    stream.getTracks().forEach((track) => {
      if (this.activeTracks.some((t) => t.id === track.id)) return;
      this.activeTracks.push(track);

      this.logger.logEvent(`${track.kind}_started`, 'info', 'browser', {
        trackId: track.id,
        label: track.label,
      });

      track.onended = () => {
        if (this.isEndedGetter()) return;
        this.logger.logEvent(`${track.kind}_stopped`, 'warning', 'browser', {
          trackId: track.id,
          label: track.label,
        });
        this.onViolation(`${track.kind}_stopped`);
      };

      track.onmute = () => {
        this.logger.logEvent(`${track.kind}_muted`, 'warning', 'browser', {
          trackId: track.id,
        });
      };
      track.onunmute = () => {
        this.logger.logEvent(`${track.kind}_unmuted`, 'info', 'browser', {
          trackId: track.id,
        });
      };
    });
  }

  stopAll(): void {
    for (const track of this.activeTracks) {
      try {
        track.stop();
      } catch {
        // Ignored
      }
    }
    this.activeTracks = [];
  }
}
