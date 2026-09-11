type RafId = number;

interface TrackedAudioContext {
  ctx: AudioContext;
  source: MediaStreamAudioSourceNode | null;
  analyser: AnalyserNode | null;
  rafId: RafId | null;
}

class MediaManager {
  private streams = new Set<MediaStream>();
  private tracks = new Set<MediaStreamTrack>();
  private audioContexts = new Map<MediaStream, TrackedAudioContext>();
  private standaloneAudioContexts = new Set<AudioContext>();
  private blobUrls = new Set<string>();
  private unloadBound = false;

  acquire(stream: MediaStream) {
    if (!this.streams.has(stream)) {
      this.streams.add(stream);
      stream.getTracks().forEach((track) => {
        this.tracks.add(track);
        track.addEventListener(
          'ended',
          () => {
            this.tracks.delete(track);
            this.removeTrack(stream);
          },
          { once: true }
        );
      });
    }
    this.bindUnloadGuard();
  }

  acquireTrack(track: MediaStreamTrack) {
    this.tracks.add(track);
    track.addEventListener(
      'ended',
      () => {
        this.tracks.delete(track);
      },
      { once: true }
    );
    this.bindUnloadGuard();
  }

  release(stream: MediaStream) {
    this.releaseAudioContext(stream);
    this.streams.delete(stream);
    stream.getTracks().forEach((track) => {
      this.tracks.delete(track);
      track.stop();
    });
  }

  stopAll() {
    for (const track of Array.from(this.tracks)) {
      try {
        track.stop();
      } catch {}
    }
    this.tracks.clear();

    for (const stream of Array.from(this.streams)) {
      this.release(stream);
    }
    this.streams.clear();

    for (const ctx of Array.from(this.standaloneAudioContexts)) {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }
    this.standaloneAudioContexts.clear();

    this.releaseAllBlobUrls();
  }

  stopAllTracksOnly() {
    this.stopAll();
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

  trackStandaloneAudioContext(ctx: AudioContext) {
    this.standaloneAudioContexts.add(ctx);
  }

  untrackStandaloneAudioContext(ctx: AudioContext) {
    this.standaloneAudioContexts.delete(ctx);
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
      } catch {}
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
