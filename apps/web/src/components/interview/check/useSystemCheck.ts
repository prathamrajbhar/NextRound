import { useState, useRef, useCallback, useEffect } from 'react';
import { useSafeMediaStream } from '@/hooks/useSafeMediaStream';
import { StepKey, StepState, ConnectionResult } from './types';
import {
  queryPerm,
  apiOrigin,
  measureLatency,
  measureDownload,
  deriveConnectionQuality,
} from './checkHelpers';
import { useMicMeter } from './useMicMeter';

export function useSystemCheck() {
  const [steps, setSteps] = useState<Record<StepKey, StepState>>({
    mic: { status: 'idle', label: '', error: '' },
    camera: { status: 'idle', label: '', error: '' },
    connection: { status: 'idle', label: '', error: '' },
  });

  const [connResult, setConnResult] = useState<ConnectionResult | null>(null);
  const [allPassed, setAllPassed] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const { micLevel, startMicMeter, stopMicMeter } = useMicMeter();

  const { start: audioStart, stop: audioStop } = useSafeMediaStream({
    constraints: { audio: true },
    enabled: true,
  });
  const { start: camStart, stop: camStop } = useSafeMediaStream({
    constraints: { video: true, audio: false },
    enabled: true,
  });

  const cleanup = useCallback(() => {
    stopMicMeter();
    audioStop();
    camStop();
    streamRef.current = null;
  }, [stopMicMeter, audioStop, camStop]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const setStep = useCallback((key: StepKey, patch: Partial<StepState>) => {
    setSteps((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  const checkMic = useCallback(async (): Promise<boolean> => {
    setStep('mic', { status: 'checking', error: '' });
    const perm = await queryPerm('microphone');
    if (perm === 'denied') {
      setStep('mic', {
        status: 'fail',
        error: 'Microphone is blocked. Click the lock icon in the address bar, allow mic, then retry.',
      });
      return false;
    }

    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopMicMeter();

      const stream = await audioStart();
      if (!stream) {
        setStep('mic', {
          status: 'fail',
          error: 'Microphone access denied. Allow it in your browser, then retry.',
        });
        return false;
      }
      streamRef.current = stream;
      startMicMeter(stream);

      const deviceLabel = stream.getAudioTracks()[0]?.label || 'Default microphone';
      setStep('mic', { status: 'pass', label: deviceLabel, error: '' });
      return true;
    } catch (e) {
      const name = e instanceof DOMException ? e.name : '';
      setStep('mic', {
        status: 'fail',
        error:
          name === 'NotFoundError'
            ? 'No microphone found. Plug one in and retry.'
            : 'Microphone access denied. Allow it in your browser, then retry.',
      });
      return false;
    }
  }, [setStep, startMicMeter, stopMicMeter, audioStart]);

  const checkCamera = useCallback(async (): Promise<boolean> => {
    setStep('camera', { status: 'checking', error: '' });
    const perm = await queryPerm('camera');
    if (perm === 'denied') {
      setStep('camera', {
        status: 'fail',
        error: 'Camera is blocked. Click the lock icon in the address bar, allow camera, then retry.',
      });
      return false;
    }

    try {
      const stream = await camStart();
      if (!stream) {
        setStep('camera', {
          status: 'fail',
          error: 'Camera access denied. Allow it in your browser, then retry.',
        });
        return false;
      }
      const cfg = stream.getVideoTracks()[0]?.getSettings() ?? {};
      stream.getTracks().forEach((t) => t.stop());

      const label = `${cfg.width ?? '?'}×${cfg.height ?? '?'} @ ${Math.round(cfg.frameRate ?? 0)} fps`;
      setStep('camera', { status: 'pass', label, error: '' });
      return true;
    } catch (e) {
      const name = e instanceof DOMException ? e.name : '';
      setStep('camera', {
        status: 'fail',
        error:
          name === 'NotFoundError'
            ? 'No camera found. Connect a webcam and retry.'
            : 'Camera access denied. Allow it in your browser, then retry.',
      });
      return false;
    }
  }, [setStep, camStart]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setStep('connection', { status: 'checking', error: '' });
    setConnResult(null);

    const origin = apiOrigin();
    const [latencyMs, downloadMbps] = await Promise.all([
      measureLatency(origin),
      measureDownload(origin),
    ]);

    if (latencyMs === 9999 && downloadMbps === 0) {
      setStep('connection', {
        status: 'fail',
        error: 'Cannot reach the NextRound server. Make sure the API is running, then retry.',
      });
      return false;
    }

    const quality = deriveConnectionQuality(downloadMbps, latencyMs);
    setConnResult({ downloadMbps, latencyMs, quality });
    setStep('connection', {
      status: 'pass',
      label: `${downloadMbps} Mbps · ${latencyMs} ms · ${quality}`,
      error: '',
    });
    return true;
  }, [setStep]);

  const runAll = useCallback(
    async (from: StepKey = 'mic') => {
      const order: StepKey[] = ['mic', 'camera', 'connection'];
      const runners: Record<StepKey, () => Promise<boolean>> = {
        mic: checkMic,
        camera: checkCamera,
        connection: checkConnection,
      };

      for (let i = order.indexOf(from); i < order.length; i++) {
        const key = order[i];
        const ok = await runners[key]();
        if (!ok) return;
        await new Promise((r) => setTimeout(r, 300));
      }
      setAllPassed(true);
    },
    [checkMic, checkCamera, checkConnection]
  );

  useEffect(() => {
    runAll();
  }, [runAll]);

  return {
    steps,
    micLevel,
    connResult,
    allPassed,
    runAll,
    cleanup,
  };
}
