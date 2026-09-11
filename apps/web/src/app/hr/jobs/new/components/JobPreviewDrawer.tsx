'use client';

import React from 'react';
import {
  Briefcase,
  Building2,
  MapPin,
  IndianRupee,
  Sparkles,
  Award,
  CheckCircle2,
  Sliders,
  Eye,
  AudioLines,
  ClipboardCheck,
  Video,
} from '@/lib/lucide-google-icons';
import { RubricWeights } from '../hooks/rubricBalancing';

interface JobPreviewProps {
  title: string;
  department: string;
  locationType: string;
  experienceLevel: string;
  minSalary: number;
  maxSalary: number;
  jd: string;
  skills: string[];
  rubric: RubricWeights;
  stages: string[];
  minScore: number;
}

export function JobPreviewDrawer({
  title,
  department,
  locationType,
  experienceLevel,
  minSalary,
  maxSalary,
  jd,
  skills,
  rubric,
  stages,
  minScore,
}: JobPreviewProps) {
  const displayTitle = title.trim() || 'Role Title (e.g. Senior Software Engineer)';

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-5 shadow-sm backdrop-blur-md space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <Sparkles className="h-4 w-4" />
          <h3 className="text-xs font-black uppercase tracking-wider">Live Candidate Preview</h3>
        </div>
        <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          Live Sync
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-850/80 p-4 space-y-3.5 shadow-xs">
        <div>
          <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest block">
            {department}
          </span>
          <h4 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
            {displayTitle}
          </h4>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            <MapPin className="h-3 w-3 text-slate-400" />
            {locationType}
          </span>
          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            <Briefcase className="h-3 w-3 text-slate-400" />
            {experienceLevel}
          </span>
          <span className="inline-flex items-center gap-1 bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold px-2.5 py-1 rounded-lg">
            <IndianRupee className="h-3 w-3" />
            ₹{(minSalary / 100000).toFixed(1)}L - ₹{(maxSalary / 100000).toFixed(1)}L / yr
          </span>
        </div>

        {skills.length > 0 && (
          <div className="pt-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
              Core Stack:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {skills.slice(0, 6).map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-800 dark:text-brand-300">
                  {s}
                </span>
              ))}
              {skills.length > 6 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                  +{skills.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3">
          {jd || 'Job description preview will populate as you type in the editor...'}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
          Evaluation Matrix Summary
        </span>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Tech Weight</span>
            <span className="text-sm font-black text-brand-600 dark:text-brand-400">{rubric.technical}%</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Problem Solving</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{rubric.problemSolving}%</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Communication</span>
            <span className="text-sm font-black text-orange-500 dark:text-orange-400">{rubric.communication}%</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Min Passing Score</span>
            <span className="text-sm font-black text-slate-900 dark:text-slate-100">{minScore}%</span>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-[11px] font-bold text-brand-800 dark:text-brand-300 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <span>{stages.length} Automated Hiring Stages Active</span>
        </span>
      </div>
    </div>
  );
}
