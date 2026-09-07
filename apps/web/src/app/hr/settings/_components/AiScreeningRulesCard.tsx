'use client';

import React from 'react';
import { Bot } from '@/lib/lucide-google-icons';

interface AiScreeningRulesCardProps {
  defaultThreshold: number;
  setDefaultThreshold: (val: number) => void;
  defaultVoice: string;
  setDefaultVoice: (val: string) => void;
  autoInvite: boolean;
  setAutoInvite: (val: boolean) => void;
  anonymizeResumes: boolean;
  setAnonymizeResumes: (val: boolean) => void;
}

export function AiScreeningRulesCard({
  defaultThreshold,
  setDefaultThreshold,
  defaultVoice,
  setDefaultVoice,
  autoInvite,
  setAutoInvite,
  anonymizeResumes,
  setAnonymizeResumes,
}: AiScreeningRulesCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <Bot className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
          Global AI Screening &amp; Cutoff Rules
        </h3>
      </div>

      <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <div>
          <div className="flex justify-between mb-1 text-[11px] font-bold">
            <span>Default Candidate Passing Score Cutoff</span>
            <span className="text-brand-600 dark:text-orange-400 font-extrabold">{defaultThreshold}% Score</span>
          </div>
          <input
            type="range"
            min="60"
            max="95"
            value={defaultThreshold}
            onChange={(e) => setDefaultThreshold(Number(e.target.value))}
            className="w-full accent-brand-600 dark:accent-orange-500 cursor-pointer"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Default Voice Interviewer Persona
          </label>
          <select
            value={defaultVoice}
            onChange={(e) => setDefaultVoice(e.target.value)}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="Serena (Warm/Professional)">Serena (Warm &amp; Professional)</option>
            <option value="Marcus (Technical/Direct)">Marcus (Technical &amp; Direct)</option>
            <option value="Charlotte (Conversational)">Charlotte (Conversational &amp; Friendly)</option>
          </select>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Auto-Send Assessment Links</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Automatically invite candidates who pass initial resume evaluation
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoInvite}
                onChange={(e) => setAutoInvite(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Anonymize Candidate Resumes</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Hide candidate names and personal contact details during early review
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={anonymizeResumes}
                onChange={(e) => setAnonymizeResumes(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
