import { detectFaces, loadFaceDetector } from './faceDetector';
import { detectBlobsFromCanvas } from './faceBlobDetector';
import { ProctoringEventLogger } from './proctoring.types';

export class ProctoringFaceMonitor {
  private faceVideoEl: HTMLVideoElement | null = null;
  private faceCanvasEl: HTMLCanvasElement | null = null;
  private faceIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastFaceCount = 1;
  private multiFacePersistStart: number | null = null;
  private multiFacePersistFired = false;

  constructor(
    private logger: ProctoringEventLogger,
    private onViolation: (kind: string) => void,
    private captureSnapshotTrigger: (kind: string) => void,
    private isPausedGetter: () => boolean
  ) {}

  getVideoElement(): HTMLVideoElement | null {
    return this.faceVideoEl;
  }

  start(stream: MediaStream): void {
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
        this.logger.logEvent('face_detector_engine', 'info', 'system', {
          engine: loaded ? 'mediapipe' : 'heuristic_fallback',
        });
      });

      this.faceIntervalId = setInterval(async () => {
        if (this.isPausedGetter() || !this.faceVideoEl) return;

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
    } catch {
      // Non-blocking face detection fallback
    }
  }

  private runHeuristicFaceAnalysis(): void {
    if (typeof window === 'undefined' || !this.faceVideoEl) return;

    if ('FaceDetector' in window) {
      try {
        const faceDetector = new (window as typeof window & {
          FaceDetector: new (config?: { maxDetectedFaces?: number; fastMode?: boolean }) => {
            detect: (el: HTMLVideoElement) => Promise<unknown[]>;
          };
        }).FaceDetector({ maxDetectedFaces: 5, fastMode: true });

        faceDetector
          .detect(this.faceVideoEl)
          .then((detectedFaces) => {
            this.processFaceCount(detectedFaces.length, 0.95);
          })
          .catch(() => {
            this.heuristicBlobDetection();
          });
        return;
      } catch {
        // Fall through to blob detection
      }
    }

    this.heuristicBlobDetection();
  }

  private heuristicBlobDetection(): void {
    if (!this.faceCanvasEl || !this.faceVideoEl) return;
    const blobs = detectBlobsFromCanvas(this.faceVideoEl, this.faceCanvasEl);
    this.processFaceCount(blobs, 0.7);
  }

  private processFaceCount(faceCount: number, confidence: number): void {
    if (faceCount !== this.lastFaceCount) {
      this.logger.logEvent('face_count_changed', 'info', 'browser', {
        confidence,
        prevFaceCount: this.lastFaceCount,
        newFaceCount: faceCount,
      });

      if (faceCount === 0) {
        this.logger.logEvent('no_face_detected', 'warning', 'browser', { confidence });
        this.onViolation('no_face_detected');
        this.captureSnapshotTrigger('no_face');
      } else if (faceCount >= 2) {
        this.logger.logEvent('multiple_faces_detected', 'warning', 'browser', { confidence });
        this.onViolation('multiple_faces_detected');
        this.captureSnapshotTrigger('multiple_faces');
      }
      this.lastFaceCount = faceCount;
    }
  }

  private trackMultiFacePersistence(faceCount: number): void {
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
        this.logger.logEvent('multiple_faces_persistent', 'high', 'browser', {
          duration_ms: now - this.multiFacePersistStart,
        });
        this.onViolation('multiple_faces_persistent');
        this.captureSnapshotTrigger('multiple_faces_persistent');
      }
    } else {
      this.multiFacePersistStart = null;
      this.multiFacePersistFired = false;
    }
  }

  teardown(): void {
    if (this.faceIntervalId) {
      clearInterval(this.faceIntervalId);
      this.faceIntervalId = null;
    }
    if (this.faceVideoEl) {
      this.faceVideoEl.srcObject = null;
      this.faceVideoEl = null;
    }
    this.faceCanvasEl = null;
  }
}
