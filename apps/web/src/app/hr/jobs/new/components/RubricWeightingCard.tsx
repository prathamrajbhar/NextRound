'use client';

import React from 'react';
import { Sliders, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RubricWeightingCardProps {
  technical: number;
  communication: number;
  problemSolving: number;
  experience: number;
  autoBalance: boolean;
  setAutoBalance: (val: boolean) => void;
  onWeightChange: (key: 'technical' | 'communication' | 'problemSolving' | 'experience', val: number) => void;
}

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

  const handleEqualize = () => {
    onWeightChange('technical', 25);
    onWeightChange('communication', 25);
    onWeightChange('problemSolving', 25);
    onWeightChange('experience', 25);
  };

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <Sliders className="h-5 w-5" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Candidate Scoring Weights</h3>
        </div>
        
        {/* Auto Balance Switch */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-extrabold select-none">Auto-Balance</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoBalance}
              onChange={(e) => setAutoBalance(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-purple-500"></div>
          </label>
        </div>
      </div>

      {/* Breakdown Visualizer */}
      <div className="space-y-2.5">
        <div className="flex h-3.5 w-full rounded-full overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 shadow-inner p-0.5 border border-slate-200/50 dark:border-slate-700/50">
          <div style={{ width: `${(technical / (total || 1)) * 100}%` }} className="bg-indigo-500 rounded-l-full transition-all duration-300" title={`Tech: ${technical}%`} />
          <div style={{ width: `${(communication / (total || 1)) * 100}%` }} className="bg-purple-500 transition-all duration-300" title={`Comm: ${communication}%`} />
          <div style={{ width: `${(problemSolving / (total || 1)) * 100}%` }} className="bg-emerald-500 transition-all duration-300" title={`Problem Solving: ${problemSolving}%`} />
          <div style={{ width: `${(experience / (total || 1)) * 100}%` }} className="bg-amber-500 rounded-r-full transition-all duration-300" title={`Experience: ${experience}%`} />
        </div>

        {/* Legend / Info */}
        <div className="flex justify-between items-center text-[10px] text-slate-700 dark:text-slate-300 font-extrabold select-none flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500 block" />
            <span>Tech: {technical}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500 block" />
            <span>Comm: {communication}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 block" />
            <span>Logic: {problemSolving}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 block" />
            <span>Exp: {experience}%</span>
          </div>
        </div>
      </div>

      {/* Balance Indicator Status */}
      <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-[11px] font-extrabold ${
        isBalanced 
          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300' 
          : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
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
            className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs"
          >
            Balance Evenly
          </button>
        )}
      </div>

      {/* Sliders list */}
      <div className="space-y-4 pt-1 font-semibold text-slate-700 dark:text-slate-300 text-xs">
        {/* Technical */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="flex items-center gap-1.5 font-extrabold text-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-indigo-500 block" />
              Technical Skills
            </span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900">{technical}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={technical}
            onChange={(e) => onWeightChange('technical', Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>

        {/* Communication */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="flex items-center gap-1.5 font-extrabold text-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-purple-500 block" />
              Communication
            </span>
            <span className="font-extrabold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-900">{communication}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={communication}
            onChange={(e) => onWeightChange('communication', Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        {/* Problem Solving */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="flex items-center gap-1.5 font-extrabold text-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 block" />
              Problem Solving
            </span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">{problemSolving}%</span>
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

        {/* Work Experience */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="flex items-center gap-1.5 font-extrabold text-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-amber-500 block" />
              Work Experience
            </span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">{experience}%</span>
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
