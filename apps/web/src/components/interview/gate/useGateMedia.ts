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

  const runFaceCheckRef = useRef<() => void>(() => {});
  const runFaceCheck = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    if (video.readyState < 2) {
      setTimeout(() => runFaceCheckRef.current(), 300);
      return;
    }

    const loaded = await loadFaceDetector();
    if (!loaded) {
      setFaceStatus('pass');
      setFaceCount(1);
      return;
    }

    const result = await detectFaces(video);
    if (!result.ok) {
      setFaceStatus('pass');
      setFaceCount(1);
      return;
    }

    setFaceCount(result.count);
    if (result.count === 0) {
      setFaceStatus('fail');
    } else if (result.count >= 2) {
      setFaceStatus('fail');
      setError('More than one person detected in the camera frame. Please ensure only you are visible.');
    } else {
      setFaceStatus('pass');
    }
  }, []);

  useEffect(() => {
    runFaceCheckRef.current = runFaceCheck;
  }, [runFaceCheck]);

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
    if (faceStatus === 'fail') {
      const timer = setTimeout(runFaceCheck, 2000);
      return () => clearTimeout(timer);
    }
  }, [faceStatus, runFaceCheck]);

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
