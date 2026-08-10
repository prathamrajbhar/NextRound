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

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    }

    onJoin();
  };

  return (
    <div className="min-h-screen w-full bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-6 animate-in fade-in duration-200 font-sans transition-colors duration-300">
      {/* Steps 1, 2, 3: Clean Centered Verification Status */}
      {step < 4 && (
        <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto animate-in zoom-in-95 duration-150">
          {step === 1 && (
            <>
              <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg">
                <Video className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">Checking camera feed...</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Verifying video resolution &amp; frame rate</p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg">
                <Mic className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">Checking microphone...</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Testing audio input levels</p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg">
                <Wifi className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">Calibrating proctoring engine...</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Preparing full-screen security lock</p>
              </div>
            </>
          )}

          {/* Minimal Progress Line */}
          <div className="w-48 bg-slate-200 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-300 dark:border-slate-800 mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step 4: Final Ready Launcher Card */}
      {step === 4 && (
        <div className="w-full max-w-sm bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-200 backdrop-blur-md">
          <div className="space-y-2">
            <CompanyLogo name={company} size="lg" className="mx-auto shadow-md" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white font-display pt-1">{company}</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{role}</p>
          </div>

          <div className="py-2 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Camera, Mic &amp; System Ready</span>
          </div>

          <div className="space-y-4 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-left select-none">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-500 cursor-pointer h-4 w-4"
              />
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-tight">
                I agree to full-screen proctored session rules.
              </span>
            </label>

            <button
              type="button"
              disabled={!consent}
              onClick={handleLaunch}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-extrabold text-xs tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Maximize2 className="h-4 w-4" />
              <span>Start Interview (Fullscreen)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
