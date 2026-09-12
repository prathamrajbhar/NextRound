'use client';

import React, { useState } from 'react';
import {
  Video,
  Loader2,
  Shield,
  Users,
  RefreshCw,
} from '@/lib/lucide-google-icons';
import { CompanyLogo } from '@/components/ui';
import { useGateMedia } from './gate/useGateMedia';
import { GateChecklist } from './gate/GateChecklist';

interface ProctoringGateProps {
  company?: string;
  role?: string;
  onProceed: (stream: MediaStream) => void;
}

export function ProctoringGate({ company, role, onProceed }: ProctoringGateProps) {
  const {
    videoRef,
    error,
    setError,
    checking,
    setChecking,
    faceStatus,
    faceCount,
    handoff,
  } = useGateMedia();

  const [consented, setConsented] = useState(false);

  const handleProceed = () => {
    const stream = handoff();
    if (stream) {
      onProceed(stream);
    }
  };

  const canProceed = faceStatus === 'pass' && consented && !checking;

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto transition-colors duration-300">
      <div className="min-h-full flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CompanyLogo name={company || 'NextRound'} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate font-display">{company || 'NextRound'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{role || 'Candidate'}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <Shield className="h-3 w-3" />
              Live Proctoring
            </span>
          </div>

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className="h-full w-full object-cover"
              />

              {checking && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-slate-300">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Activating camera</span>
                </div>
              )}

              {!checking && faceStatus === 'checking' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-slate-300">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Verifying single person</span>
                </div>
              )}

              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1">
                {faceStatus === 'fail' ? (
                  <Users className="h-3.5 w-3.5 text-rose-400" />
                ) : (
                  <Video className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span className="text-[10px] font-bold text-slate-200">
                  {faceCount === 0
                    ? 'No person detected'
                    : faceCount !== null && faceCount > 1
                    ? 'Multiple people detected'
                    : faceCount === 1
                    ? '1 person verified'
                    : 'Detecting…'}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed">
                {error}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setChecking(true);
                    window.location.reload();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry Setup
                </button>
              </div>
            )}

          </div>

          <GateChecklist
            faceStatus={faceStatus}
            consented={consented}
            canProceed={canProceed}
            onConsentChange={setConsented}
            onProceed={handleProceed}
          />
        </div>
      </div>
    </div>
  );
}
