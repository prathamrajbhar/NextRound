'use client';

import React from 'react';
import {
  Sparkles,
  Trophy,
  User,
  Star,
  Sliders,
  Layers,
  Terminal,
  Target,
  CheckCircle2,
} from '@/lib/lucide-google-icons';
import { AssessmentTrack } from './CalibrationPanel';

interface TrackSelectionCardProps {
  track: AssessmentTrack;
  onSelectTrack: (track: AssessmentTrack) => void;
  difficulty: 'junior' | 'mid' | 'senior';
  onSelectDifficulty: (difficulty: 'junior' | 'mid' | 'senior') => void;
}

const TRACKS = [
  {
    key: 'comprehensive' as const,
    label: 'Full Mock Interview',
    badge: 'ALL-IN-ONE ROUND',
    featured: true,
    sub: 'End-to-end hiring simulation covering Aptitude, Live Coding & Technical Voice AI.',
    icon: Trophy,
  },
  {
    key: 'aptitude' as const,
    label: 'Aptitude & Reasoning',
    badge: 'MATH & LOGIC',
    featured: false,
    sub: 'Quantitative puzzles, series logic, and analytical problem solving.',
    icon: Target,
  },
  {
    key: 'coding' as const,
    label: 'Live Coding Round',
    badge: 'HANDS-ON CODE',
    featured: false,
    sub: 'Algorithmic challenges, data structures & time complexity.',
    icon: Terminal,
  },
  {
    key: 'technical' as const,
    label: 'Technical Voice AI',
    badge: 'VOICE AI VETTING',
    featured: false,
    sub: 'Conversational voice AI covering architecture, stack & system design.',
    icon: Sparkles,
  },
];

const DIFFICULTIES = [
  { key: 'junior' as const, label: 'Junior', sub: '0 - 2 Yrs', icon: User },
  { key: 'mid' as const, label: 'Mid Level', sub: '2 - 5 Yrs', icon: Star },
  { key: 'senior' as const, label: 'Senior', sub: '5+ Yrs', icon: Trophy },
];

export function TrackSelectionCard({
  track,
  onSelectTrack,
  difficulty,
  onSelectDifficulty,
}: TrackSelectionCardProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
            <Layers className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
            Select Assessment Round
          </h3>
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-orange-950/60 text-brand-700 dark:text-orange-300 border border-brand-200 dark:border-orange-900">
            4 Rounds Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TRACKS.map((t) => {
            const Icon = t.icon;
            const isSelected = track === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onSelectTrack(t.key)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                  t.featured ? 'sm:col-span-2' : ''
                } ${
                  isSelected
                    ? 'border-brand-500 dark:border-orange-500 bg-brand-500/10 dark:bg-orange-500/10 text-slate-900 dark:text-slate-100 ring-2 ring-brand-500/30'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 ${
                        isSelected ? 'text-brand-500 dark:text-orange-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs font-extrabold">{t.label}</span>
                    {t.featured && (
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 uppercase">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-brand-500 dark:text-orange-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  {t.sub}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
          <Sliders className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          Target Seniority Level
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map((d) => {
            const Icon = d.icon;
            const isSelected = difficulty === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => onSelectDifficulty(d.key)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brand-500 dark:border-orange-500 bg-brand-500/10 dark:bg-orange-500/10 text-brand-700 dark:text-orange-300 ring-2 ring-brand-500/30'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 mb-1 ${
                    isSelected ? 'text-brand-500 dark:text-orange-400' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-extrabold block">{d.label}</span>
                <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">
                  {d.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
