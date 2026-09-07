'use client';

import React from 'react';

interface CandidateNotificationChannelsCardProps {
  emailInvites: boolean;
  setEmailInvites: (val: boolean) => void;
  smsReminders: boolean;
  setSmsReminders: (val: boolean) => void;
  aiScoreReports: boolean;
  setAiScoreReports: (val: boolean) => void;
  statusUpdates: boolean;
  setStatusUpdates: (val: boolean) => void;
  dailyDigest: boolean;
  setDailyDigest: (val: boolean) => void;
}

export function CandidateNotificationChannelsCard({
  emailInvites,
  setEmailInvites,
  smsReminders,
  setSmsReminders,
  aiScoreReports,
  setAiScoreReports,
  statusUpdates,
  setStatusUpdates,
  dailyDigest,
  setDailyDigest,
}: CandidateNotificationChannelsCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-6">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Job Invite Notifications
            </span>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
              Recommended
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Receive immediate email alerts when recruiters shortlist or invite you to an AI interview round.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEmailInvites(!emailInvites)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            emailInvites ? 'bg-brand-600 dark:bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              emailInvites ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              SMS &amp; WhatsApp Reminders
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Receive short automated text confirmation links 30 minutes prior to scheduled live sessions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSmsReminders(!smsReminders)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            smsReminders ? 'bg-brand-600 dark:bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              smsReminders ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              AI Assessment Score Reports
            </span>
            <span className="text-[10px] font-bold text-brand-600 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-md">
              AI Agent
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Get detailed performance analytics &amp; score breakdowns after completing an AI screening or coding round.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAiScoreReports(!aiScoreReports)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            aiScoreReports ? 'bg-brand-600 dark:bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              aiScoreReports ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Application Stage Movement
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Get notified when your application progresses to Technical Review, Offer Stage, or Hired status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStatusUpdates(!statusUpdates)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            statusUpdates ? 'bg-brand-600 dark:bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              statusUpdates ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Job Recommendation Digest
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Receive AI-curated job recommendations matching your skill matrix and location preferences.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDailyDigest(!dailyDigest)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            dailyDigest ? 'bg-brand-600 dark:bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              dailyDigest ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
