'use client';

import React, { useEffect, useRef, useState } from 'react';
import { VideoOff, Mic, MicOff, Video, ShieldCheck, AlertCircle } from '@/lib/lucide-google-icons';

export type AssessmentTrack = 'aptitude' | 'technical' | 'coding' | 'comprehensive';

interface CalibrationPanelProps {
  company: string;
  role: string;
  track?: AssessmentTrack;
  micActive: boolean;
  camActive: boolean;
  micLevel: number;
  isCalibrating: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
}

export default function CalibrationPanel({
  company,
  role,
  track = 'technical',
  micActive,
  camActive,
  micLevel: propMicLevel,
  isCalibrating,
  onToggleMic,
  onToggleCam,
}: CalibrationPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamPermission, setHasCamPermission] = useState<boolean | null>(null);
  const [realMicLevel, setRealMicLevel] = useState<number>(40);

  // Initialize Real HTML5 Webcam Stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function setupCamera() {
      if (!camActive) {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
        return;
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: micActive,
        });

        currentStream = mediaStream;
        setStream(mediaStream);
        setHasCamPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Web Audio API for Real Mic Level Sensing
        if (micActive) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(mediaStream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
              if (!currentStream || !currentStream.active) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              const normalized = Math.min(100, Math.max(10, Math.floor((average / 128) * 100)));
              setRealMicLevel(normalized);
              requestAnimationFrame(updateLevel);
            };
            updateLevel();
          } catch (e) {
            console.warn('Audio Context failed:', e);
          }
        }
      } catch (err) {
        console.warn('Webcam permission or device error:', err);
        setHasCamPermission(false);
      }
    }

    setupCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [camActive, micActive]);

  const displayMicLevel = micActive ? (hasCamPermission ? realMicLevel : propMicLevel) : 0;

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel space-y-4">
      
      {/* Clean Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Hardware &amp; Camera Feed</h3>
          <p className="text-[11px] text-slate-500 font-medium">Test webcam and microphone readiness</p>
        </div>
        <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Ready
        </span>
      </div>

      {/* Clean Live Video Frame (No Fancy Badges Overlay) */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-md">
        {camActive ? (
          <div className="relative w-full h-full bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {hasCamPermission === false && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-slate-300 p-4 text-center">
                <AlertCircle className="h-8 w-8 text-amber-500 mb-1" />
                <span className="text-xs font-bold text-slate-200">Camera Permission Required</span>
                <span className="text-[10px] text-slate-400 max-w-xs mt-0.5">
                  Allow camera access in your browser to enable live preview.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 font-medium text-slate-400 p-6 text-center">
            <VideoOff className="h-7 w-7 text-rose-500 mb-1" />
            <span className="text-xs font-bold text-rose-400">Camera Off</span>
          </div>
        )}
      </div>

      {/* Clean Audio Level Progress Bar */}
      <div className="space-y-1 bg-white/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
        <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Mic className={`h-3 w-3 ${micActive ? 'text-emerald-500' : 'text-rose-500'}`} />
            Microphone Volume
          </span>
          <span className={micActive ? 'text-emerald-500 font-mono font-bold' : 'text-rose-500 font-mono font-bold'}>
            {micActive ? `${displayMicLevel}%` : 'Muted'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
            style={{ width: `${displayMicLevel}%` }}
          />
        </div>
      </div>

      {/* Direct Clean Control Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={onToggleMic}
          className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
            micActive
              ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              : 'bg-rose-500 text-white border-rose-600 hover:bg-rose-600'
          }`}
        >
          {micActive ? <Mic className="h-4 w-4 text-emerald-500" /> : <MicOff className="h-4 w-4 text-white" />}
          <span>{micActive ? 'Mute Mic' : 'Unmute Mic'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleCam}
          className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
            camActive
              ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              : 'bg-rose-500 text-white border-rose-600 hover:bg-rose-600'
          }`}
        >
          {camActive ? <Video className="h-4 w-4 text-emerald-500" /> : <VideoOff className="h-4 w-4 text-white" />}
          <span>{camActive ? 'Turn Off Camera' : 'Turn On Camera'}</span>
        </button>
      </div>

    </div>
  );
}
