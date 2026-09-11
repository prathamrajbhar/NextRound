import React from 'react';
import { Mic, Video, CheckCircle2, Maximize2 } from '@/lib/lucide-google-icons';
import { FaceStatus } from './useGateMedia';

interface GateChecklistProps {
  faceStatus: FaceStatus;
  consented: boolean;
  canProceed: boolean;
  onConsentChange: (checked: boolean) => void;
  onProceed: () => void;
}

export function GateChecklist({
  faceStatus,
  consented,
  canProceed,
  onConsentChange,
  onProceed,
}: GateChecklistProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel space-y-3">
      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
        Secured Assessment Checklist
      </div>

      <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <Mic className="h-4 w-4 text-emerald-500" />
        <span>Microphone active — speech, noise &amp; background sound are analyzed</span>
        <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto flex-shrink-0" />
      </div>

      <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <Video className="h-4 w-4 text-emerald-500" />
        <span>Camera active — exactly one person must remain in frame</span>
        <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto flex-shrink-0" />
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1 border-t border-slate-200/60 dark:border-slate-800">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => onConsentChange(e.target.checked)}
          className="mt-0.5 rounded border-slate-600 bg-slate-800 text-orange-500 h-4 w-4 cursor-pointer flex-shrink-0"
        />
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          I consent to camera &amp; microphone streaming, full-screen mode, automated proctoring, and audio recording of this assessment session for integrity verification.
        </span>
      </label>

      <button
        disabled={!canProceed}
        onClick={onProceed}
        className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
      >
        <Maximize2 className="h-4 w-4" />
        {faceStatus === 'fail' ? 'Waiting for Single-Person Verification' : 'Start Secured Assessment'}
      </button>
    </div>
  );
}
