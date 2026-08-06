'use client';

import React, { useState, useEffect } from 'react';
import { CompanyLogo } from '@/components/ui';
import {
  Video,
  Mic,
  Maximize2,
  Wifi,
  CheckCircle2,
} from '@/lib/lucide-google-icons';

interface InterviewCheckScreenProps {
  company: string;
  role: string;
  camActive?: boolean;
  onJoin: () => void;
}

export default function InterviewCheckScreen({
  company,
  role,
  onJoin,
}: InterviewCheckScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [progress, setProgress] = useState(0);
  const [consent, setConsent] = useState(true);

  // Automated step progress sequence
  useEffect(() => {
    if (step === 1 || step === 2 || step === 3) {
      const stepInc = step === 3 ? 25 : 20;
      const nextStep = (step + 1) as 2 | 3 | 4;
      const int = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(int);
            setTimeout(() => {
              setProgress(0);
              setStep(nextStep);
            }, 300);
            return 100;
          }
          return prev + stepInc;
        });
      }, 100);
      return () => clearInterval(int);
    }
  }, [step]);

  const handleLaunch = () => {
    if (!consent) return;

    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}

    onJoin();
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 animate-in fade-in duration-200">
      {/* Steps 1, 2, 3: Clean Icon + Text Only (Zero Fancy Backgrounds or Containers) */}
      {step < 4 && (
        <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-xs mx-auto animate-in zoom-in-95 duration-150">
          {/* Step 1: Camera */}
          {step === 1 && (
            <>
              <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                <Video className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white font-display">Checking camera...</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Verifying video input</p>
              </div>
            </>
          )}

          {/* Step 2: Microphone */}
          {step === 2 && (
            <>
              <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                <Mic className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white font-display">Checking microphone...</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Testing audio level</p>
              </div>
            </>
          )}

          {/* Step 3: System */}
          {step === 3 && (
            <>
              <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                <Wifi className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white font-display">Verifying system...</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Connecting AI engine</p>
              </div>
            </>
          )}

          {/* Minimal 2px Progress Line */}
          <div className="w-48 bg-slate-900 rounded-full h-1 overflow-hidden mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step 4: Compact Clean Popup Modal */}
      {step === 4 && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95 duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 text-center">
            {/* Header */}
            <div className="flex flex-col items-center gap-2">
              <CompanyLogo name={company} size="lg" />
              <div>
                <h2 className="text-lg font-extrabold text-white font-display tracking-tight">{company}</h2>
                <p className="text-xs text-slate-400 font-medium">{role}</p>
              </div>
            </div>

            {/* Simple Readiness Badge */}
            <div className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Camera, Mic &amp; System Ready</span>
            </div>

            {/* Consent & Launch Action */}
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-left">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 cursor-pointer h-4 w-4"
                />
                <span className="text-xs text-slate-300 font-medium">
                  I agree to full-screen proctored session.
                </span>
              </label>

              <button
                onClick={handleLaunch}
                disabled={!consent}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                <Maximize2 className="h-4 w-4" />
                <span>Start Interview (Fullscreen)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
