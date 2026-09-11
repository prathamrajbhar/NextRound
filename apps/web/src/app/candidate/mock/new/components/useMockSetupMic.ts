'use client';

import { useState, useEffect } from 'react';
import { useSafeMediaStream } from '@/hooks/useSafeMediaStream';

export function useMockSetupMic(micActive: boolean) {
  const [micLevel, setMicLevel] = useState(0);

  const { start, stop } = useSafeMediaStream({
    constraints: { audio: true },
    enabled: micActive,
  });

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (!micActive) {
      stop();
      setMicLevel(0);
      return;
    }
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let rafId: number | null = null;
    let active = true;

    start()
      .then((stream) => {
        if (!stream || !active) return;
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!analyser || !active) return;
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setMicLevel(Math.floor((average / 255) * 100));
          rafId = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      })
      .catch(() => {
        setMicLevel(0);
      });

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (audioContext && audioContext.state !== 'closed') void audioContext.close();
      stop();
      setMicLevel(0);
    };
  }, [micActive, start, stop]);

  return micLevel;
}
