'use client';

import React, { useState, useEffect } from 'react';
import { Mic } from '@/lib/lucide-google-icons';
import { useSafeMediaStream } from '@/hooks/useSafeMediaStream';

export function SetupMicPrecheckCard() {
  const [micTesting, setMicTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const { start, stop } = useSafeMediaStream({
    constraints: { audio: true },
    enabled: micTesting,
  });

  useEffect(() => {
    return () => {
      setMicTesting(false);
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (!micTesting) {
      stop();
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
          setAudioLevel(Math.floor((average / 255) * 100));
          rafId = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      })
      .catch(() => {
        setAudioLevel(0);
      });

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (audioContext && audioContext.state !== 'closed') void audioContext.close();
      stop();
      setAudioLevel(0);
    };
  }, [micTesting, start, stop]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-md p-6 shadow-md space-y-4">
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none border-b border-slate-200/80 dark:border-white/5 pb-3">
        <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-white">
          <Mic
            className={`h-4 w-4 ${
              micTesting ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          />
          Microphone Pre-Check
        </span>
        <span
          className={`font-mono font-black ${
            micTesting ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'
          }`}
        >
          {micTesting ? `${audioLevel}%` : 'Muted'}
        </span>
      </div>

      <div className="flex gap-1 items-center h-3 px-0.5 my-2">
        {Array.from({ length: 18 }).map((_, index) => {
          const activeBars = Math.round((audioLevel / 100) * 18);
          const isActive = micTesting && index < activeBars;
          let barColor = 'bg-slate-200 dark:bg-slate-800/80';
          if (isActive) {
            if (index > 14) {
              barColor = 'bg-rose-500 dark:bg-rose-400';
            } else if (index > 11) {
              barColor = 'bg-amber-500 dark:bg-amber-400';
            } else {
              barColor = 'bg-emerald-500 dark:bg-emerald-400';
            }
          }
          return (
            <div
              key={index}
              className={`h-full flex-1 rounded-[1.5px] transition-all duration-75 ${barColor} ${
                isActive
                  ? 'opacity-100 shadow-[0_0_6px_rgba(16,185,129,0.3)]'
                  : 'opacity-40 dark:opacity-20'
              }`}
            />
          );
        })}
      </div>

      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
        {micTesting
          ? audioLevel > 5
            ? 'Signal detected — your microphone is working.'
            : 'Listening… speak to test your microphone.'
          : 'Test your microphone hardware before starting the call.'}
      </p>

      <button
        type="button"
        onClick={() => setMicTesting(!micTesting)}
        className={`w-full py-2.5 px-4 rounded-xl border text-[11px] font-black tracking-wide uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-50 ${
          micTesting
            ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-350 focus:ring-slate-500'
            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:border-emerald-350 focus:ring-emerald-500'
        }`}
      >
        <Mic className="h-3.5 w-3.5" />
        {micTesting ? 'Stop Test' : 'Test Microphone'}
      </button>
    </div>
  );
}
