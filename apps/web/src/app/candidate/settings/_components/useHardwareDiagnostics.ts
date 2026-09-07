'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocalMediaStream } from '@/hooks/useLocalMediaStream';

export function useHardwareDiagnostics() {
  const [micTesting, setMicTesting] = useState(false);
  const [camTesting, setCamTesting] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('');

  const [screenShareVerified, setScreenShareVerified] = useState<
    'idle' | 'checking' | 'verified' | 'failed'
  >('idle');
  const [screenShareError, setScreenShareError] = useState('');

  const [latencyStatus, setLatencyStatus] = useState<
    'idle' | 'checking' | 'passed' | 'failed'
  >('idle');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [jitterMs, setJitterMs] = useState<number | null>(null);

  useEffect(() => {
    async function enumerateDevices() {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          await navigator.mediaDevices
            .getUserMedia({ audio: true, video: true })
            .then((stream) => stream.getTracks().forEach((track) => track.stop()))
            .catch(() => {});

          const devices = await navigator.mediaDevices.enumerateDevices();
          const vDevices = devices.filter((d) => d.kind === 'videoinput');
          const aDevices = devices.filter((d) => d.kind === 'audioinput');

          setVideoDevices(vDevices);
          setAudioDevices(aDevices);

          if (vDevices.length > 0) setSelectedVideoDeviceId(vDevices[0].deviceId);
          if (aDevices.length > 0) setSelectedAudioDeviceId(aDevices[0].deviceId);
        }
      } catch {
        // Non-blocking device enumeration
      }
    }
    enumerateDevices();
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { hasCamPermission, micLevel } = useLocalMediaStream({
    videoRef,
    camActive: camTesting,
    micActive: micTesting,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    enabled: camTesting || micTesting,
  });

  const handleScreenShareTest = async () => {
    setScreenShareVerified('checking');
    setScreenShareError('');
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        setScreenShareVerified('verified');
      } else {
        throw new Error('Screen sharing API is not supported in this browser.');
      }
    } catch (err) {
      setScreenShareVerified('failed');
      setScreenShareError(
        err instanceof Error ? err.message : 'Screen sharing permission denied.'
      );
    }
  };

  const handleLatencyTest = async () => {
    setLatencyStatus('checking');
    setLatencyMs(null);
    setJitterMs(null);

    const samples: number[] = [];
    const pingTimes = 4;

    try {
      for (let i = 0; i < pingTimes; i++) {
        const t0 = Date.now();
        await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
        const duration = Date.now() - t0;
        samples.push(duration);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const avgLatency = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
      let jitterSum = 0;
      for (let i = 1; i < samples.length; i++) {
        jitterSum += Math.abs(samples[i] - samples[i - 1]);
      }
      const calculatedJitter = Math.round(jitterSum / (samples.length - 1));

      setLatencyMs(avgLatency);
      setJitterMs(calculatedJitter);
      setLatencyStatus(avgLatency < 250 ? 'passed' : 'failed');
    } catch {
      setLatencyStatus('failed');
    }
  };

  return {
    micTesting,
    setMicTesting,
    camTesting,
    setCamTesting,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    setSelectedVideoDeviceId,
    selectedAudioDeviceId,
    setSelectedAudioDeviceId,
    screenShareVerified,
    screenShareError,
    latencyStatus,
    latencyMs,
    jitterMs,
    videoRef,
    hasCamPermission,
    micLevel,
    handleScreenShareTest,
    handleLatencyTest,
  };
}
