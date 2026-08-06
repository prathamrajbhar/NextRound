'use client';

import React from 'react';
import { Activity, VideoOff, Mic, MicOff, Video, CheckCircle2, ShieldCheck } from '@/lib/lucide-google-icons';
import { getCompanyCultureNotes } from '@/lib/mockSetupHelpers';
import { CompanyLogo } from '@/components/ui';

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

const trackWeightMap: Record<AssessmentTrack, { primaryName: string; primaryVal: number; secondaryName: string; secondaryVal: number }> = {
  aptitude: { primaryName: 'Quantitative & Logic', primaryVal: 60, secondaryName: 'Problem Solving Speed', secondaryVal: 40 },
  technical: { primaryName: 'Technical Architecture & Stack', primaryVal: 55, secondaryName: 'Communication & System Thinking', secondaryVal: 45 },
  coding: { primaryName: 'Code Efficiency & Logic', primaryVal: 65, secondaryName: 'Data Structures & Algorithms', secondaryVal: 35 },
  comprehensive: { primaryName: 'Full Technical & Aptitude Assessment', primaryVal: 70, secondaryName: 'Communication & Problem Solving', secondaryVal: 30 },
};

export default function CalibrationPanel({
  company,
  track = 'technical',
  micActive,
  camActive,
  micLevel,
  isCalibrating,
  onToggleMic,
  onToggleCam,
}: CalibrationPanelProps) {
  const companyCulture = getCompanyCultureNotes(company);
  const trackWeights = trackWeightMap[track] || trackWeightMap.technical;

  return (
    <div className="h-full rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel flex flex-col justify-between space-y-6">
      <div className="space-y-5">
        <div className="border-b border-slate-200/60 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display tracking-tight flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
              Hardware &amp; Calibration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Review evaluation weights and test microphone and camera readiness.
            </p>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/60 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> System Ready
          </span>
        </div>

        {/* Evaluation Blueprint Card */}
        <div className="space-y-4 relative bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-2xl">
          {isCalibrating && (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/80 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center gap-2">
              <Activity className="h-4 w-4 text-brand-600 dark:text-orange-400 animate-spin" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Updating Rubric Weights...
              </span>
            </div>
          )}

          <div className="flex gap-3 items-center pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
            <CompanyLogo name={company || 'General'} size="md" className="shadow-2xs flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Evaluation Rubric Focus
              </span>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate font-display">
                {company || 'General Standard'}
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10 flex-shrink-0" />
              </h4>
            </div>
          </div>

          <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            {companyCulture.notes}
          </p>

          <div className="space-y-2.5 pt-1">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                <span>{trackWeights.primaryName}</span>
                <span className="text-brand-600 dark:text-orange-400 font-extrabold">{trackWeights.primaryVal}%</span>
              </div>
              <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-600 dark:bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${trackWeights.primaryVal}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                <span>{trackWeights.secondaryName}</span>
                <span className="text-purple-600 dark:text-purple-400 font-extrabold">{trackWeights.secondaryVal}%</span>
              </div>
              <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-600 dark:bg-purple-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${trackWeights.secondaryVal}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Device Console */}
        <div className="space-y-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Device Controls
            </span>
            <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
              Optimal Feed
            </span>
          </div>

          <div className="relative h-28 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
            {camActive ? (
              <div className="w-full h-full bg-slate-800/60 flex flex-col items-center justify-center text-slate-300 relative p-3">
                <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-1">
                  <Video className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-200">
                  Webcam Active
                </span>
                <span className="absolute bottom-2 left-2 text-[8px] bg-slate-950/90 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-900/80 shadow-sm flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Gaze Tracking
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 font-semibold text-slate-400">
                <VideoOff className="h-5 w-5 text-slate-600" />
                <span className="text-[9px] uppercase font-bold tracking-wider">Camera Muted</span>
              </div>
            )}
          </div>

          {/* Mic Meter */}
          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <span>Microphone Volume</span>
              <span className={micActive ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-400'}>
                {micActive ? 'Active' : 'Muted'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden p-0.5 border border-slate-300/40 dark:border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  micActive ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                }`}
                style={{ width: `${micActive ? micLevel : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Controls */}
      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={onToggleMic}
          className={`flex-1 py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
            micActive
              ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400'
          }`}
        >
          {micActive ? <Mic className="h-3.5 w-3.5 text-emerald-500" /> : <MicOff className="h-3.5 w-3.5" />}
          <span>{micActive ? 'Mic Active' : 'Unmute Mic'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleCam}
          className={`flex-1 py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
            camActive
              ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400'
          }`}
        >
          {camActive ? <Video className="h-3.5 w-3.5 text-emerald-500" /> : <VideoOff className="h-3.5 w-3.5" />}
          <span>{camActive ? 'Camera Active' : 'Enable Cam'}</span>
        </button>
      </div>
    </div>
  );
}
