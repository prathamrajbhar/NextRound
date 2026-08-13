'use client';

import React, { useRef } from 'react';
import { VideoOff, Mic, MicOff, Video, ShieldCheck, AlertCircle } from '@/lib/lucide-google-icons';
import { useLocalMediaStream } from '@/hooks/useLocalMediaStream';

export type AssessmentTrack = 'aptitude' | 'technical' | 'coding' | 'comprehensive';

interface CalibrationPanelProps {
  company?: string;
  role?: string;
  track?: AssessmentTrack;
  micActive: boolean;
  camActive: boolean;
  micLevel: number;
  isCalibrating?: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
}

export default function CalibrationPanel({
  micActive,
  camActive,
  micLevel: propMicLevel,
  onToggleMic,
  onToggleCam,
}: CalibrationPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  
  const { hasCamPermission, micLevel: realMicLevel } = useLocalMediaStream({
    videoRef,
    camActive,
    micActive,
  });

  const displayMicLevel = micActive ? (hasCamPermission ? realMicLevel : propMicLevel) : 0;
  const activeBars = Math.round((displayMicLevel / 100) * 18);

  const isFullyReady = camActive && micActive && hasCamPermission !== false;
  const isPartiallyReady = (camActive || micActive) && hasCamPermission !== false;

  let badgeColor = '';
  let badgeText = '';
  let BadgeIcon = ShieldCheck;

  if (isFullyReady) {
    badgeColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60';
    badgeText = 'System Ready';
  } else if (isPartiallyReady) {
    badgeColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-900/60';
    badgeText = 'Calibration Required';
    BadgeIcon = AlertCircle;
  } else {
    badgeColor = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/50 dark:border-rose-900/60';
    badgeText = 'Setup Incomplete';
    BadgeIcon = AlertCircle;
  }

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-lg backdrop-blur-md glass-panel space-y-5 transition-colors duration-300">
      
      {}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3.5">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Hardware Setup</h3>
          <p className="text-[11px] text-slate-500 font-medium">Test webcam and microphone readiness</p>
        </div>
        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all duration-300 ${badgeColor}`}>
          <BadgeIcon className="h-3.5 w-3.5" />
          {badgeText}
        </span>
      </div>

      {}
      <div className="relative w-full aspect-video bg-slate-950 rounded-2xl border border-slate-200/20 dark:border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-inner group">
        {camActive ? (
          <div className="relative w-full h-full bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {hasCamPermission === false ? (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-slate-300 p-4 text-center">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-xs font-bold text-slate-200">Camera Permission Required</span>
                <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-normal">
                  Please enable camera access in your browser settings to continue.
                </p>
              </div>
            ) : (
              <>
                {}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[9px] font-extrabold text-white uppercase tracking-wider shadow-sm select-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Preview
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[9px] font-extrabold text-slate-300 shadow-sm select-none">
                  <span>HD FEED (1080p)</span>
                </div>

                {}
                <div className="absolute top-3.5 left-3.5 w-2.5 h-2.5 border-t border-l border-white/40 pointer-events-none group-hover:border-white/70 transition-colors duration-300" />
                <div className="absolute top-3.5 right-3.5 w-2.5 h-2.5 border-t border-r border-white/40 pointer-events-none group-hover:border-white/70 transition-colors duration-300" />
                <div className="absolute bottom-3.5 left-3.5 w-2.5 h-2.5 border-b border-l border-white/40 pointer-events-none group-hover:border-white/70 transition-colors duration-300" />
                <div className="absolute bottom-3.5 right-3.5 w-2.5 h-2.5 border-b border-r border-white/40 pointer-events-none group-hover:border-white/70 transition-colors duration-300" />
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600 p-6 text-center select-none">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 dark:bg-rose-500/5 flex items-center justify-center border border-rose-500/20 mb-2 shadow-sm">
              <VideoOff className="h-5 w-5 text-rose-500" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Camera Feed Disabled</span>
            <p className="text-[10px] text-slate-500 max-w-[200px] leading-normal">Webcam preview is currently turned off.</p>
          </div>
        )}
      </div>

      {}
      <div className="space-y-2 bg-white/50 dark:bg-slate-800/30 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
          <span className="flex items-center gap-1.5">
            <Mic className={`h-3.5 w-3.5 ${micActive ? 'text-emerald-500' : 'text-slate-400'}`} />
            Microphone Volume
          </span>
          <span className={`font-mono font-black ${micActive ? 'text-slate-700 dark:text-slate-200' : 'text-rose-500'}`}>
            {micActive ? `${displayMicLevel}%` : 'Muted'}
          </span>
        </div>
        
        {}
        <div className="flex gap-1 items-center h-3 px-0.5">
          {Array.from({ length: 18 }).map((_, index) => {
            const isActive = micActive && index < activeBars;
            let barColor = 'bg-slate-100 dark:bg-slate-800/80';
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
                  isActive ? 'opacity-100 shadow-[0_0_6px_rgba(16,185,129,0.3)]' : 'opacity-40 dark:opacity-20'
                }`}
              />
            );
          })}
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={onToggleMic}
          className={`py-3 px-4 rounded-xl border text-[11px] font-black tracking-wide uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-50 ${
            micActive
              ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-slate-500'
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:border-rose-350 focus:ring-rose-500'
          }`}
        >
          {micActive ? <Mic className="h-4 w-4 text-emerald-500" /> : <MicOff className="h-4 w-4 text-rose-500 animate-pulse" />}
          <span>{micActive ? 'Mute Mic' : 'Unmute Mic'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleCam}
          className={`py-3 px-4 rounded-xl border text-[11px] font-black tracking-wide uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-50 ${
            camActive
              ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-slate-500'
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:border-rose-350 focus:ring-rose-500'
          }`}
        >
          {camActive ? <Video className="h-4 w-4 text-emerald-500" /> : <VideoOff className="h-4 w-4 text-rose-500 animate-pulse" />}
          <span>{camActive ? 'Stop Video' : 'Start Video'}</span>
        </button>
      </div>

    </div>
  );
}
