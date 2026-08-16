import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProctoringEventBuffer } from '@/lib/proctoring/eventBuffer';

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    client_event_id: 'evt-1',
    kind: 'heartbeat',
    severity: 'info' as const,
    source: 'system' as const,
    client_timestamp: new Date().toISOString(),
    session_elapsed_ms: 100,
    payload_json: {},
    ...overrides,
  };
}

describe('ProctoringEventBuffer', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('assigns monotonically increasing client_sequence per buffered event', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockRejectedValue(new Error('offline'));
    const buffer = new ProctoringEventBuffer('sess-1', 'http://api/proctoring/sessions/sess-1/events');

    buffer.addEvent(makeEvent({ client_event_id: 'a' }));
    buffer.addEvent(makeEvent({ client_event_id: 'b' }));
    buffer.addEvent(makeEvent({ client_event_id: 'c' }));

    const pending = buffer.getPendingEvents();
    expect(pending.map((e) => e.client_sequence)).toEqual([1, 2, 3]);
    expect(pending.map((e) => e.client_event_id)).toEqual(['a', 'b', 'c']);
    expect(fetchMock).not.toHaveBeenCalled(); // batch capture is deferred to the next microtask
  });

  it('uploads all buffered events in one batch and clears the buffer on success', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, status: 200, statusText: 'OK' } as Response)
    );
    const buffer = new ProctoringEventBuffer('sess-1', 'http://api/proctoring/sessions/sess-1/events');

    buffer.addEvent(makeEvent({ client_event_id: 'a', kind: 'tab_hidden' }));
    buffer.addEvent(makeEvent({ client_event_id: 'b', kind: 'window_blur' }));

    await flushPromises();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api/proctoring/sessions/sess-1/events');
    const body = JSON.parse(init.body);
    expect(body.events).toHaveLength(2);
    expect(body.events[0].client_sequence).toBe(1);
    expect(body.events[1].client_sequence).toBe(2);
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(buffer.getPendingEvents()).toHaveLength(0);
  });

  it('retains events and retries when an upload fails', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const buffer = new ProctoringEventBuffer('sess-1', 'http://api/proctoring/sessions/sess-1/events');
    buffer.addEvent(makeEvent({ client_event_id: 'a' }));

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(buffer.getPendingEvents()).toHaveLength(1);

    // the retry (setTimeout 5000) fires and eventually succeeds
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' } as Response);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(0);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(buffer.getPendingEvents()).toHaveLength(0);
  });

  it('does not start a second upload while one is in flight', async () => {
    let resolveFetch!: (v: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { resolveFetch = resolve; }));
    vi.stubGlobal('fetch', fetchMock);

    const buffer = new ProctoringEventBuffer('sess-1', 'http://api/proctoring/sessions/sess-1/events');
    buffer.addEvent(makeEvent({ client_event_id: 'a' }));
    buffer.addEvent(makeEvent({ client_event_id: 'b' }));

    // both events added before the batch is captured -> coalesced into one upload
    expect(fetchMock).toHaveBeenCalledTimes(0);
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch({ ok: true, status: 200, statusText: 'OK' } as Response);
    await flushPromises();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(buffer.getPendingEvents()).toHaveLength(0);
  });

  it('flush posts the current buffer and clears it on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const buffer = new ProctoringEventBuffer('sess-1', 'http://api/proctoring/sessions/sess-1/events');
    buffer.addEvent(makeEvent({ client_event_id: 'a' }));
    // wait for the automatic upload to settle (buffer now empty)
    await flushPromises();
    await flushPromises();
    expect(buffer.getPendingEvents()).toHaveLength(0);

    // buffer a fresh event and flush manually
    buffer.addEvent(makeEvent({ client_event_id: 'b' }));
    await buffer.flush();
    expect(buffer.getPendingEvents()).toHaveLength(0);
  });

  it('flush keeps events when the upload fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'ERR' } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const buffer = new ProctoringEventBuffer('sess-1', 'http://api/proctoring/sessions/sess-1/events');
    buffer.addEvent(makeEvent({ client_event_id: 'a' }));
    await flushPromises();
    await flushPromises();

    expect(buffer.getPendingEvents()).toHaveLength(1);
  });
});