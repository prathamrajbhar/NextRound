'use client';

import React from 'react';
import { Video, VideoOff, ChevronDown } from '@/lib/lucide-google-icons';

interface WebcamDiagnosticCardProps {
  camTesting: boolean;
  setCamTesting: (val: boolean) => void;
  hasCamPermission: boolean | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoDevices: MediaDeviceInfo[];
  selectedVideoDeviceId: string;
  setSelectedVideoDeviceId: (id: string) => void;
}

export function WebcamDiagnosticCard({
  camTesting,
  setCamTesting,
  hasCamPermission,
  videoRef,
  videoDevices,
  selectedVideoDeviceId,
  setSelectedVideoDeviceId,
}: WebcamDiagnosticCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Video className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Webcam Diagnostics</span>
        </div>
        <button
          type="button"
          onClick={() => setCamTesting(!camTesting)}
          className={`px-3 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
            camTesting
              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20'
              : 'bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white shadow-sm'
          }`}
        >
          {camTesting ? 'Stop Camera' : 'Preview Cam'}
        </button>
      </div>

      <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border border-slate-200/20 dark:border-slate-800 flex items-center justify-center">
        {camTesting && hasCamPermission !== false ? (
          <>
            <video
              ref={videoRef as React.RefObject<HTMLVideoElement>}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-md text-[9px] font-bold text-emerald-400 tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Preview
            </div>
          </>
        ) : (
          <div className="text-center p-4 space-y-2">
            <VideoOff className="h-6 w-6 text-slate-500 mx-auto" />
            <div>
              <span className="text-xs font-bold text-slate-300 block">Webcam Feed Inactive</span>
              <span className="text-[10px] text-slate-500 block max-w-[200px] mx-auto mt-0.5">
                Click &quot;Preview Cam&quot; to check your hardware feed.
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
          Camera Source Device
        </label>
        {videoDevices.length > 0 ? (
          <div className="relative">
            <select
              value={selectedVideoDeviceId}
              onChange={(e) => setSelectedVideoDeviceId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 appearance-none cursor-pointer"
            >
              {videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId} className="dark:bg-slate-900">
                  {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 font-bold">No camera hardware detected.</p>
        )}
      </div>
    </div>
  );
}
