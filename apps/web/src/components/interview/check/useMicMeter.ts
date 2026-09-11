import { useState, useRef, useCallback } from 'react';

export function useMicMeter() {
  const [micLevel, setMicLevel] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopMicMeter = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setMicLevel(0);
  }, []);

  const startMicMeter = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(an);
      audioCtxRef.current = ctx;
      analyserRef.current = an;
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buf);
        const avg = buf.reduce((s, v) => s + v, 0) / buf.length;
        setMicLevel(Math.round((avg / 255) * 100));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Ignored
    }
  }, []);

  return { micLevel, startMicMeter, stopMicMeter };
}
