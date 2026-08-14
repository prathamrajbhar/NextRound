import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';

let detectorPromise: Promise<FaceDetector> | null = null;
let resolveWaiters: Array<(ok: boolean) => void> = [];
let loadResult = false;

export interface FaceDetectionResult {
  ok: boolean;
  count: number;
  confidence: number;
}

function notifyWaiters(ok: boolean) {
  loadResult = ok;
  resolveWaiters.forEach((resolve) => resolve(ok));
  resolveWaiters = [];
}

export function isFaceDetectorLoaded(): boolean {
  return loadResult;
}

export function loadFaceDetector(): Promise<boolean> {
  if (detectorPromise) {
    return new Promise<boolean>((resolve) => {
      if (loadResult) return resolve(true);
      resolveWaiters.push(resolve);
    });
  }

  detectorPromise = (async () => {
    const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
    const detector = await FaceDetector.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: '/mediapipe/blaze_face_short_range.tflite',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO' as const,
      minDetectionConfidence: 0.5,
    });
    return detector;
  })();

  detectorPromise
    .then(() => notifyWaiters(true))
    .catch((err) => {
      console.warn('[faceDetector] MediaPipe face detection unavailable, falling back to heuristic:', err);
      detectorPromise = null;
      notifyWaiters(false);
    });

  return new Promise<boolean>((resolve) => {
    if (loadResult) return resolve(true);
    resolveWaiters.push(resolve);
  });
}

let detector: FaceDetector | null = null;
let lastFrameTime = 0;

export async function detectFaces(videoEl: HTMLVideoElement): Promise<FaceDetectionResult> {
  if (!loadResult || !detectorPromise) {
    return { ok: false, count: 1, confidence: 0 };
  }

  if (!detector) {
    detector = await detectorPromise;
  }
  if (!detector) {
    return { ok: false, count: 1, confidence: 0 };
  }

  if (
    !videoEl ||
    videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
    videoEl.videoWidth === 0
  ) {
    return { ok: true, count: 1, confidence: 0.9 };
  }

  const now = performance.now();
  if (now - lastFrameTime < 150) {
    return { ok: true, count: 1, confidence: 0 };
  }
  lastFrameTime = now;

  try {
    const result = detector.detectForVideo(videoEl, now);
    const detections = result.detections ?? [];
    const confidence = detections.length > 0 ? detections[0].categories?.[0]?.score ?? 0 : 0;
    return { ok: true, count: detections.length, confidence };
  } catch (err) {
    console.warn('[faceDetector] Detection error:', err);
    return { ok: true, count: 1, confidence: 0 };
  }
}