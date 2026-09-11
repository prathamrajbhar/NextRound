'use client';

import React from 'react';
import { Sliders, AlertTriangle, CheckCircle2, RotateCcw, Sparkles } from '@/lib/lucide-google-icons';

interface RubricWeightingCardProps {
  technical: number;
  communication: number;
  problemSolving: number;
  experience: number;
  autoBalance: boolean;
  setAutoBalance: (val: boolean) => void;
  onWeightChange: (key: 'technical' | 'communication' | 'problemSolving' | 'experience', val: number) => void;
}

const PRESETS = [
  { name: 'Balanced (25% each)', weights: { technical: 25, communication: 25, problemSolving: 25, experience: 25 } },
  { name: 'Tech Heavy (45/15/25/15)', weights: { technical: 45, communication: 15, problemSolving: 25, experience: 15 } },
  { name: 'Leadership & Comm (20/40/20/20)', weights: { technical: 20, communication: 40, problemSolving: 20, experience: 20 } },
];

export default function RubricWeightingCard({
  technical,
  communication,
  problemSolving,
  experience,
  autoBalance,
  setAutoBalance,
  onWeightChange,
}: RubricWeightingCardProps) {
  const total = technical + communication + problemSolving + experience;
  const isBalanced = total === 100;

  const applyPreset = (weights: { technical: number; communication: number; problemSolving: number; experience: number }) => {
    onWeightChange('technical', weights.technical);
    onWeightChange('communication', weights.communication);
    onWeightChange('problemSolving', weights.problemSolving);
    onWeightChange('experience', weights.experience);
  };

  const handleEqualize = () => {
    applyPreset({ technical: 25, communication: 25, problemSolving: 25, experience: 25 });
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-6 md:p-7 shadow-sm backdrop-blur-md space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5 text-brand-600 dark:text-brand-400">
          <div className="h-8 w-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">Candidate Scoring Weights</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Relative impact on candidate composite rank</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold select-none">Auto-Balance</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoBalance}
              onChange={(e) => setAutoBalance(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-brand-500" />
          </label>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex h-3.5 w-full rounded-full overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 shadow-inner p-0.5 border border-slate-200/50 dark:border-slate-700/50">
          <div style={{ width: `${(technical / (total || 1)) * 100}%` }} className="bg-brand-500 rounded-l-full transition-all duration-300" title={`Tech: ${technical}%`} />
          <div style={{ width: `${(communication / (total || 1)) * 100}%` }} className="bg-orange-400 transition-all duration-300" title={`Comm: ${communication}%`} />
          <div style={{ width: `${(problemSolving / (total || 1)) * 100}%` }} className="bg-emerald-500 transition-all duration-300" title={`Problem Solving: ${problemSolving}%`} />
          <div style={{ width: `${(experience / (total || 1)) * 100}%` }} className="bg-amber-400 rounded-r-full transition-all duration-300" title={`Experience: ${experience}%`} />
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-700 dark:text-slate-300 font-bold select-none flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-500 block" />
            <span>Tech: {technical}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-400 block" />
            <span>Comm: {communication}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 block" />
            <span>Logic: {problemSolving}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400 block" />
            <span>Exp: {experience}%</span>
          </div>
        </div>
      </div>

      <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs font-bold ${
        isBalanced
          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
          : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
      }`}>
        <div className="flex items-center gap-2">
          {isBalanced ? (
            <>
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Weights Balanced (Total: 100%)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-400 animate-bounce" />
              <span>Total: {total}% (Must equal 100%)</span>
            </>
          )}
        </div>
        {!isBalanced && (
          <button
            type="button"
            onClick={handleEqualize}
            className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Balance Evenly</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Presets:
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => applyPreset(preset.weights)}
            className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="space-y-4 pt-1 font-semibold text-slate-700 dark:text-slate-300 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-brand-500 block" />
              Technical Skills
            </span>
            <span className="font-extrabold text-brand-700 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">{technical}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={technical}
            onChange={(e) => onWeightChange('technical', Number(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-orange-400 block" />
              Communication
            </span>
            <span className="font-extrabold text-orange-700 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">{communication}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={communication}
            onChange={(e) => onWeightChange('communication', Number(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 block" />
              Problem Solving &amp; Logic
            </span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{problemSolving}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={problemSolving}
            onChange={(e) => onWeightChange('problemSolving', Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-amber-400 block" />
              Work Experience &amp; Impact
            </span>
            <span className="font-extrabold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">{experience}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={experience}
            onChange={(e) => onWeightChange('experience', Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
