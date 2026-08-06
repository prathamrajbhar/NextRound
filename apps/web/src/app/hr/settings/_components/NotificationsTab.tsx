'use client';

import React from 'react';
import { BellRing, Save } from '@/lib/lucide-google-icons';

interface NotificationsTabProps {
  notifyShortlist: boolean;
  setNotifyShortlist: (val: boolean) => void;
  notifyHighScore: boolean;
  setNotifyHighScore: (val: boolean) => void;
  dailyDigest: boolean;
  setDailyDigest: (val: boolean) => void;
  onSave: () => void;
}

export function NotificationsTab({
  notifyShortlist,
  setNotifyShortlist,
  notifyHighScore,
  setNotifyHighScore,
  dailyDigest,
  setDailyDigest,
  onSave,
}: NotificationsTabProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <BellRing className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
          Recruiter Notification &amp; Alert Preferences
        </h3>
      </div>

      <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Candidate Shortlist Alerts</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              Receive email when a candidate completes the AI Voice Interview
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifyShortlist}
              onChange={(e) => setNotifyShortlist(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">High-Score Candidate Push Alerts</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              Instant notification when a candidate scores &gt;90% overall match rating
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifyHighScore}
              onChange={(e) => setNotifyHighScore(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Daily Pipeline Summary Digest</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              Morning email recap of new applicants, interviews scheduled, and offer decisions
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={dailyDigest}
              onChange={(e) => setDailyDigest(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>Save Notification Settings</span>
        </button>
      </div>
    </div>
  );
}
