import { useRef, useState, useEffect, useCallback } from 'react';
import { detectFaces, loadFaceDetector } from '@/lib/proctoring/faceDetector';

export type FaceStatus = 'checking' | 'pass' | 'fail';

export function useGateMedia() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>('checking');
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const handedOffRef = useRef(false);

  const stopStream = useCallback(() => {
    if (handedOffRef.current) return;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const samplesRef = useRef<number[]>([]);

  const runFaceCheck = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || handedOffRef.current) return;
    if (video.readyState < 2 || video.paused) return;

    const loaded = await loadFaceDetector();
    if (!loaded) {
      setFaceStatus('pass');
      setFaceCount(1);
      setError(null);
      return;
    }

    const result = await detectFaces(video);
    if (!result.ok) {
      return;
    }

    const currentCount = result.count;
    samplesRef.current.push(currentCount);
    if (samplesRef.current.length > 4) {
      samplesRef.current.shift();
    }

    // Determine consensus count from recent samples
    const counts = samplesRef.current;
    const countOccurrences = new Map<number, number>();
    for (const c of counts) {
      countOccurrences.set(c, (countOccurrences.get(c) || 0) + 1);
    }
    let consensusCount = currentCount;
    let maxOccurs = 0;
    for (const [c, occurs] of countOccurrences.entries()) {
      if (occurs > maxOccurs) {
        maxOccurs = occurs;
        consensusCount = c;
      }
    }

    setFaceCount(consensusCount);

    if (consensusCount === 1) {
      setFaceStatus('pass');
      setError(null);
    } else if (consensusCount === 0) {
      setFaceStatus('fail');
      setError('No person detected in frame. Please face the camera directly in good lighting.');
    } else {
      setFaceStatus('fail');
      setError('Multiple people detected in the camera frame. Please ensure only you are visible.');
    }
  }, []);



  useEffect(() => {
    let cancelled = false;

    async function acquire() {
      setChecking(true);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera & microphone are not available in this browser.');
          setChecking(false);
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        await videoRef.current?.play().catch(() => {});
        setChecking(false);
        runFaceCheck();
      } catch (err) {
        const name = err instanceof DOMException ? err.name : '';
        setError(
          name === 'NotFoundError'
            ? 'No camera or microphone found. Connect them and retry.'
            : 'Camera & microphone access is required for the secured assessment. Please allow them and retry.'
        );
        setChecking(false);
      }
    }

    acquire();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [runFaceCheck, stopStream]);

  useEffect(() => {
    if (checking || handedOffRef.current) return;
    const interval = setInterval(() => {
      runFaceCheck();
    }, 500);
    return () => clearInterval(interval);
  }, [checking, runFaceCheck]);


  const handoff = () => {
    handedOffRef.current = true;
    return streamRef.current;
  };

  return {
    videoRef,
    error,
    setError,
    checking,
    setChecking,
    faceStatus,
    faceCount,
    handoff,
  };
}
