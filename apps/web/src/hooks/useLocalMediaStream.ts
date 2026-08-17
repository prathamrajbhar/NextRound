'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { mediaManager } from '@/lib/media/mediaManager';

interface UseLocalMediaStreamOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  camActive: boolean;
  micActive: boolean;
  selectedVideoDeviceId?: string;
  selectedAudioDeviceId?: string;
  enabled?: boolean;
  onStreamCreated?: (stream: MediaStream) => void;
}

export function useLocalMediaStream({
  videoRef,
  camActive,
  micActive,
  selectedVideoDeviceId,
  selectedAudioDeviceId,
  enabled = true,
  onStreamCreated,
}: UseLocalMediaStreamOptions) {
  const streamRef = useRef<MediaStream | null>(null);
  const setupGenerationRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [hasCamPermission, setHasCamPermission] = useState<boolean | null>(null);
  const [micLevel, setMicLevel] = useState<number>(45);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const onStreamCreatedRef = useRef(onStreamCreated);
  useEffect(() => {
    onStreamCreatedRef.current = onStreamCreated;
  }, [onStreamCreated]);

  const stopLocalStream = useCallback(() => {

    setupGenerationRef.current += 1;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch((err) => {
        console.error('Failed to close audio context:', err);
      });
      audioCtxRef.current = null;
    }

    const stream = streamRef.current;
    if (stream) {
      mediaManager.release(stream);
      streamRef.current = null;
      setLocalStream(null);
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

        const videoConstraints = camActive
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              ...(selectedVideoDeviceId ? { deviceId: { exact: selectedVideoDeviceId } } : {}),
            }
          : false;

        const audioConstraints = micActive
          ? {
              ...(selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : {}),
            }
          : false;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        });

        if (gen !== setupGenerationRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setLocalStream(stream);
        setHasCamPermission(true);
        mediaManager.acquire(stream);
        onStreamCreatedRef.current?.(stream);

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
          } catch {}
        }
      } catch {
        setHasCamPermission(false);
      }
    }

    setup();

    return () => {
      stopLocalStream();
    };
  }, [
    camActive,
    micActive,
    enabled,
    stopLocalStream,
    videoRef,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
  ]);

  useEffect(() => {
    const onPageHide = () => stopLocalStream();
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [stopLocalStream]);

  return { stopLocalStream, hasCamPermission, micLevel, localStream };
}
