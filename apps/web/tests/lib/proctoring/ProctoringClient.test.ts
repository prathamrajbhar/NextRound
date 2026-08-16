import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProctoringClient } from '@/lib/proctoring/ProctoringClient';
import { apiClient } from '@/lib/apiClient';
import type { ProctoringEventBuffer } from '@/lib/proctoring/eventBuffer';

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/lib/config', () => ({
  API_BASE_URL: 'http://api.test',
}));

vi.mock('@/lib/media/mediaManager', () => ({
  mediaManager: { acquire: vi.fn() },
}));

vi.mock('@/lib/proctoring/faceDetector', () => ({
  loadFaceDetector: vi.fn().mockResolvedValue(false),
  detectFaces: vi.fn().mockResolvedValue({ ok: false, count: 1, confidence: 0 }),
}));

let startShouldThrow = false;

class MockMediaRecorder {
  static isTypeSupported = vi.fn(() => true);
  static instances: MockMediaRecorder[] = [];
  state = 'inactive';
  mimeType = 'audio/webm;codecs=opus';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  start = vi.fn(() => {
    if (startShouldThrow) throw new Error('NotSupportedError: error starting MediaRecorder');
    this.state = 'recording';
  });
  stop = vi.fn(() => {
    this.state = 'inactive';
  });

  constructor(
    public stream: MediaStream,
    public options?: { mimeType?: string }
  ) {
    if (options?.mimeType) this.mimeType = options.mimeType;
    MockMediaRecorder.instances.push(this);
  }
}

function makeTrack(kind: 'audio' | 'video'): MediaStreamTrack {
  return {
    id: `${kind}-track`,
    kind,
    label: kind,
    stop: vi.fn(),
    onended: null,
    onmute: null,
    onunmute: null,
  } as unknown as MediaStreamTrack;
}

function makeStream(audio = true, video = false): MediaStream {
  const audioTracks = audio ? [makeTrack('audio')] : [];
  const videoTracks = video ? [makeTrack('video')] : [];
  return {
    getAudioTracks: () => audioTracks,
    getVideoTracks: () => videoTracks,
    getTracks: () => [...audioTracks, ...videoTracks],
  } as unknown as MediaStream;
}

type PrivateClient = {
  apiSessionId: string;
  buffer: ProctoringEventBuffer;
  mediaRecorder: MockMediaRecorder | null;
  recordingTickId: ReturnType<typeof setInterval> | null;
  isEnded: boolean;
  isPaused: boolean;
};

const priv = (c: ProctoringClient) => c as unknown as PrivateClient;

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function makeClient(overrides: Record<string, unknown> = {}) {
  return new ProctoringClient({
    sessionId: 'sess-1',
    candidateId: 'cand-1',
    sessionType: 'interview',
    onViolation: vi.fn(),
    ...overrides,
  });
}

function pendingKinds(client: ProctoringClient): string[] {
  return priv(client).buffer.getPendingEvents().map((e) => e.kind);
}

describe('ProctoringClient', () => {
  beforeEach(() => {
    startShouldThrow = false;
    MockMediaRecorder.instances = [];
    MockMediaRecorder.isTypeSupported.mockReturnValue(true);
    vi.mocked(apiClient.post).mockClear();
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    vi.stubGlobal('HTMLMediaElement', { HAVE_CURRENT_DATA: 2 });
    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
    vi.stubGlobal('AudioContext', class {
      createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }));
      createAnalyser = vi.fn(() => ({ getByteFrequencyData: vi.fn(), fftSize: 0, frequencyBinCount: 0 }));
      close = vi.fn(() => Promise.resolve());
    });
    vi.stubGlobal('window', {
      ...globalThis,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      hidden: false,
      fullscreenElement: null,
      documentElement: { requestFullscreen: vi.fn().mockResolvedValue(undefined) },
      createElement: vi.fn(() => ({
        srcObject: null,
        muted: false,
        playsInline: false,
        setAttribute: vi.fn(),
        play: vi.fn(() => Promise.resolve()),
        readyState: 0,
        videoWidth: 0,
        getContext: () => null,
      })),
    });
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    MockMediaRecorder.instances = [];
  });

  it('registers the session on the API and logs session_started on start', async () => {
    const client = makeClient();
    await client.start();

    expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
      '/proctoring/sessions',
      expect.objectContaining({
        id: 'sess-1',
        candidate_id: 'cand-1',
        session_type: 'interview',
      })
    );
    expect(pendingKinds(client)).toContain('session_started');
  });

  it('starts an audio recording with the preferred mime type when an audio track is present', async () => {
    const client = makeClient();
    await client.start();

    client.trackMediaStream(makeStream(true, false));

    const recorder = MockMediaRecorder.instances[0];
    expect(recorder).toBeDefined();
    expect(recorder.mimeType).toBe('audio/webm;codecs=opus');
    expect(recorder.start).toHaveBeenCalledWith(1000);
    expect(client.getRecordingState().active).toBe(true);
    expect(pendingKinds(client)).toContain('recording_started');

    await client.end();
  });

  it('falls back to a default (no mimeType) when no codec is supported', async () => {
    MockMediaRecorder.isTypeSupported.mockReturnValue(false);
    const client = makeClient();
    await client.start();

    client.trackMediaStream(makeStream(true, false));

    const recorder = MockMediaRecorder.instances[0];
    expect(recorder.options).toBeUndefined();
    expect(recorder.start).toHaveBeenCalledWith(1000);

    await client.end();
  });

  it('gracefully disables recording when MediaRecorder.start throws (regression)', async () => {
    startShouldThrow = true;
    const client = makeClient();
    await client.start();

    client.trackMediaStream(makeStream(true, false));

    expect(client.getRecordingState().active).toBe(false);
    expect(priv(client).mediaRecorder).toBeNull();
    expect(priv(client).recordingTickId).toBeNull();
    expect(pendingKinds(client)).toContain('recording_start_failed');
    expect(pendingKinds(client)).not.toContain('recording_started');

    await client.end();
  });

  it('wires face analysis when a video track is present without crashing', async () => {
    const client = makeClient();
    await client.start();

    expect(() => client.trackMediaStream(makeStream(true, true))).not.toThrow();
    expect(MockMediaRecorder.instances[0]).toBeDefined();

    await client.end();
  });

  it('fires the violation callback when a media track ends', async () => {
    const onViolation = vi.fn();
    const client = makeClient({ onViolation });
    await client.start();

    const stream = makeStream(true, false);
    client.trackMediaStream(stream);
    const track = stream.getAudioTracks()[0] as unknown as { onended: (() => void) | null };
    track.onended?.();

    expect(onViolation).toHaveBeenCalledWith('audio_stopped');

    await client.end();
  });

  it('calls pause/resume/end endpoints and cleans up on end', async () => {
    const client = makeClient();
    await client.start();
    const stream = makeStream(true, false);
    client.trackMediaStream(stream);
    const track = stream.getAudioTracks()[0] as MediaStreamTrack;

    await client.pause();
    expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/proctoring/sessions/sess-1/pause');

    await client.resume();
    expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/proctoring/sessions/sess-1/resume');

    await client.end();
    expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/proctoring/sessions/sess-1/end');
    expect(priv(client).isEnded).toBe(true);
    expect(track.stop).toHaveBeenCalled();
    expect(pendingKinds(client)).toContain('session_ended');
  });

  it('suppresses violations when told to', async () => {
    const onViolation = vi.fn();
    const client = makeClient({ onViolation });
    await client.start();

    const handler = (priv(client) as unknown as { handleVisibilityChange: () => void }).handleVisibilityChange;
    (globalThis.document as unknown as { hidden: boolean }).hidden = true;

    handler();
    expect(onViolation).toHaveBeenCalledWith('tab_hidden');

    onViolation.mockClear();
    client.setSuppressViolations(true);
    handler();
    expect(onViolation).not.toHaveBeenCalled();

    await client.end();
    await flushPromises();
  });
});