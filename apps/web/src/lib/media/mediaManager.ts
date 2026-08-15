type RafId = number;

interface TrackedAudioContext {
  ctx: AudioContext;
  source: MediaStreamAudioSourceNode | null;
  analyser: AnalyserNode | null;
  rafId: RafId | null;
}

class MediaManager {
  private streams = new Set<MediaStream>();
  private audioContexts = new Map<MediaStream, TrackedAudioContext>();
  private blobUrls = new Set<string>();
  private unloadBound = false;

  acquire(stream: MediaStream) {
    if (!this.streams.has(stream)) {
      this.streams.add(stream);
      stream.getTracks().forEach((track) => {
        track.addEventListener('ended', () => this.removeTrack(stream), { once: true });
      });
    }
    this.bindUnloadGuard();
  }

  release(stream: MediaStream) {
    this.releaseAudioContext(stream);
    this.streams.delete(stream);
    stream.getTracks().forEach((track) => track.stop());
  }

  stopAll() {
    for (const stream of Array.from(this.streams)) {
      this.release(stream);
    }
    this.streams.clear();
    this.releaseAllBlobUrls();
  }

  stopAllTracksOnly() {
    for (const stream of Array.from(this.streams)) {
      this.releaseAudioContext(stream);
      stream.getTracks().forEach((track) => track.stop());
    }
    this.streams.clear();
    this.releaseAllBlobUrls();
  }

  trackAudioContext(
    stream: MediaStream,
    ctx: AudioContext,
    source: MediaStreamAudioSourceNode | null,
    analyser: AnalyserNode | null,
    rafId: RafId | null
  ) {
    const existing = this.audioContexts.get(stream);
    if (existing) {
      if (existing.rafId !== null) cancelAnimationFrame(existing.rafId);
      existing.ctx.close().catch(() => {});
    }
    this.audioContexts.set(stream, { ctx, source, analyser, rafId });
  }

  trackBlobUrl(url: string) {
    if (url.startsWith('blob:')) this.blobUrls.add(url);
  }

  private releaseAudioContext(stream: MediaStream) {
    const entry = this.audioContexts.get(stream);
    if (!entry) return;
    if (entry.rafId !== null) cancelAnimationFrame(entry.rafId);
    entry.ctx.close().catch(() => {});
    this.audioContexts.delete(stream);
  }

  private releaseAllBlobUrls() {
    for (const url of this.blobUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
    this.blobUrls.clear();
  }

  private removeTrack(stream: MediaStream) {
    if (stream.getTracks().length === 0) {
      this.streams.delete(stream);
      this.releaseAudioContext(stream);
    }
  }

  private bindUnloadGuard() {
    if (this.unloadBound || typeof window === 'undefined') return;
    this.unloadBound = true;
    const stop = () => this.stopAll();
    window.addEventListener('pagehide', stop);
    window.addEventListener('beforeunload', stop);
  }
}

export const mediaManager = new MediaManager();
