import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  forVisionTasks: vi.fn(),
  createFromOptions: vi.fn(),
}));

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks: mocks.forVisionTasks },
  FaceDetector: { createFromOptions: mocks.createFromOptions },
}));

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function makeVideo(overrides: Partial<HTMLVideoElement> = {}): HTMLVideoElement {
  return {
    readyState: 4,
    videoWidth: 640,
    videoHeight: 480,
    ...overrides,
  } as unknown as HTMLVideoElement;
}

describe('proctoring/faceDetector', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('HTMLMediaElement', { HAVE_CURRENT_DATA: 2 });
    mocks.forVisionTasks.mockReset();
    mocks.createFromOptions.mockReset();
    mocks.forVisionTasks.mockResolvedValue({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back gracefully (returns false) when the MediaPipe detector cannot be created', async () => {
    mocks.createFromOptions.mockRejectedValue(new Error('WASM failed'));
    const { loadFaceDetector, detectFaces } = await import('@/lib/proctoring/faceDetector');

    expect(await loadFaceDetector()).toBe(false);
    const result = await detectFaces(makeVideo());
    expect(result.ok).toBe(false);
    expect(result.count).toBe(1);
    expect(result.confidence).toBe(0);
  });

  it('reports not-loaded until load resolves', async () => {
    const { detectFaces } = await import('@/lib/proctoring/faceDetector');
    const result = await detectFaces(makeVideo());
    expect(result.ok).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it('returns a safe default when the video element has no frames yet', async () => {
    mocks.createFromOptions.mockResolvedValue({ detectForVideo: vi.fn() });
    const { loadFaceDetector, detectFaces } = await import('@/lib/proctoring/faceDetector');
    await loadFaceDetector();

    const result = await detectFaces(makeVideo({ readyState: 0, videoWidth: 0 }));
    expect(result.ok).toBe(true);
    expect(result.count).toBe(1);
    expect(result.confidence).toBe(0.9);
  });

  it('maps detector detections into count + confidence', async () => {
    const detectForVideo = vi.fn().mockReturnValue({
      detections: [
        { categories: [{ score: 0.91 }] },
        { categories: [{ score: 0.72 }] },
      ],
    });
    mocks.createFromOptions.mockResolvedValue({ detectForVideo });
    const { loadFaceDetector, detectFaces } = await import('@/lib/proctoring/faceDetector');
    await loadFaceDetector();

    const result = await detectFaces(makeVideo());
    expect(result.ok).toBe(true);
    expect(result.count).toBe(2);
    expect(result.confidence).toBe(0.91);
    expect(detectForVideo).toHaveBeenCalledTimes(1);
  });

  it('throttles to one detection per 150ms window', async () => {
    const detectForVideo = vi.fn().mockReturnValue({ detections: [] });
    mocks.createFromOptions.mockResolvedValue({ detectForVideo });
    const { loadFaceDetector, detectFaces } = await import('@/lib/proctoring/faceDetector');
    await loadFaceDetector();

    const first = await detectFaces(makeVideo());
    const second = await detectFaces(makeVideo());
    expect(first.confidence).toBe(0);
    expect(second.confidence).toBe(0);
    expect(detectForVideo).toHaveBeenCalledTimes(1);
  });

  it('caches load success and subsequent loads resolve immediately', async () => {
    mocks.createFromOptions.mockResolvedValue({ detectForVideo: vi.fn() });
    const { loadFaceDetector, isFaceDetectorLoaded } = await import('@/lib/proctoring/faceDetector');

    expect(await loadFaceDetector()).toBe(true);
    expect(isFaceDetectorLoaded()).toBe(true);
    expect(await loadFaceDetector()).toBe(true);
    expect(mocks.createFromOptions).toHaveBeenCalledTimes(1);
    await flushPromises();
  });
});