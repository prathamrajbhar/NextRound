'use client';

import { useCallback, useEffect, useRef } from 'react';
import { mediaManager } from '@/lib/media/mediaManager';

interface UseSafeMediaStreamOptions {
  constraints: MediaStreamConstraints;
  enabled?: boolean;
  onStream?: (stream: MediaStream) => void;
}

export function useSafeMediaStream({ constraints, enabled = true, onStream }: UseSafeMediaStreamOptions) {
  const cancelledRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const enabledRef = useRef(enabled);
  const constraintsRef = useRef(constraints);
  const onStreamRef = useRef(onStream);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    constraintsRef.current = constraints;
  }, [constraints]);

  useEffect(() => {
    onStreamRef.current = onStream;
  }, [onStream]);

  const start = useCallback(async (): Promise<MediaStream | null> => {
    if (!enabledRef.current || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return null;
    }

    cancelledRef.current = false;
    const stream = await navigator.mediaDevices.getUserMedia(constraintsRef.current);

    if (cancelledRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return null;
    }

    streamRef.current = stream;
    mediaManager.acquire(stream);
    onStreamRef.current?.(stream);
    return stream;
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (streamRef.current) {
      mediaManager.release(streamRef.current);
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
    }
    return () => {
      cancelledRef.current = true;
      if (streamRef.current) {
        mediaManager.release(streamRef.current);
        streamRef.current = null;
      }
    };
  }, [enabled, stop]);

  return { start, stop, getStream: () => streamRef.current };
}
