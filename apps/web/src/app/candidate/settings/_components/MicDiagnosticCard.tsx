'use client';

import React from 'react';
import { Mic, ChevronDown } from '@/lib/lucide-google-icons';

interface MicDiagnosticCardProps {
  micTesting: boolean;
  setMicTesting: (val: boolean) => void;
  micLevel: number;
  audioDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string;
  setSelectedAudioDeviceId: (id: string) => void;
}

export function MicDiagnosticCard({
  micTesting,
  setMicTesting,
  micLevel,
  audioDevices,
  selectedAudioDeviceId,
  setSelectedAudioDeviceId,
}: MicDiagnosticCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Mic className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Microphone Diagnostics
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMicTesting(!micTesting)}
          className={`px-3 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
            micTesting
              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20'
              : 'bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white shadow-sm'
          }`}
        >
          {micTesting ? 'Mute Mic' : 'Test Mic'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="h-6 rounded-xl bg-slate-950/80 border border-slate-200/10 dark:border-slate-800 px-3.5 flex items-center w-full">
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-amber-500 dark:from-orange-500 dark:to-orange-400 transition-all duration-75"
              style={{ width: `${micTesting ? micLevel : 0}%` }}
            />
          </div>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
          {micTesting
            ? `🎤 Audio Input Level: ${micLevel}% (listening...)`
            : 'Click "Test Mic" to check your sound levels.'}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
          Microphone Source Device
        </label>
        {audioDevices.length > 0 ? (
          <div className="relative">
            <select
              value={selectedAudioDeviceId}
              onChange={(e) => setSelectedAudioDeviceId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 appearance-none cursor-pointer"
            >
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId} className="dark:bg-slate-900">
                  {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 font-bold">No microphone hardware detected.</p>
        )}
      </div>
    </div>
  );
}
