'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface UseLocalMediaStreamOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  camActive: boolean;
  micActive: boolean;
  /** Set to false to fully release the stream (e.g. gate acquisition on a stage). Default true. */
  enabled?: boolean;
}

/**
 * Owns the local getUserMedia stream lifecycle with an async-generation guard.
 *
 * Fixes the StrictMode / fast-toggle race where a stale in-flight getUserMedia resolves
 * after the effect cleanup and leaks the camera/mic (the browser indicator stays on after
 * an interview ends). Any stale resolve self-stops its tracks; the live stream lives in a
 * ref so unmount cleanup, the `pagehide` handler, and `stopLocalStream()` can always stop it.
 */
export function useLocalMediaStream({
  videoRef,
  camActive,
  micActive,
  enabled = true,
}: UseLocalMediaStreamOptions) {
  const streamRef = useRef<MediaStream | null>(null);
  const setupGenerationRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [hasCamPermission, setHasCamPermission] = useState<boolean | null>(null);
  const [micLevel, setMicLevel] = useState<number>(45);

  const stopLocalStream = useCallback(() => {
    // Invalidate any in-flight getUserMedia so it self-stops when it resolves.
    setupGenerationRef.current += 1;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [videoRef]);

  useEffect(() => {
    async function setup() {
      if (!enabled || (!camActive && !micActive)) {
        stopLocalStream();
        return;
      }

      const gen = ++setupGenerationRef.current;
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setHasCamPermission(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: camActive ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          audio: micActive,
        });

        // Stale: a newer setup ran (toggle), or stopLocalStream() fired (cleanup/pagehide/unmount).
        if (gen !== setupGenerationRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setHasCamPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if (micActive) {
          try {
            const AudioCtxClass =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtxClass) {
              const audioCtx = new AudioCtxClass();
              audioCtxRef.current = audioCtx;
              const source = audioCtx.createMediaStreamSource(stream);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              source.connect(analyser);

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const updateLevel = () => {
                if (streamRef.current !== stream || !stream.active) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;
                setMicLevel(Math.min(100, Math.max(15, Math.floor((avg / 128) * 100))));
                rafRef.current = requestAnimationFrame(updateLevel);
              };
              rafRef.current = requestAnimationFrame(updateLevel);
            }
          } catch {
            // Audio context fallback
          }
        }
      } catch {
        setHasCamPermission(false);
      }
    }

    setup();

    return () => {
      stopLocalStream();
    };
  }, [camActive, micActive, enabled, stopLocalStream, videoRef]);

  // Belt-and-suspenders for tab close / back-forward (bfcache), where React unmount cleanup does
  // not reliably fire. NOT visibilitychange — briefly switching tabs must keep the feed alive.
  useEffect(() => {
    const onPageHide = () => stopLocalStream();
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [stopLocalStream]);

  return { stopLocalStream, hasCamPermission, micLevel };
}
