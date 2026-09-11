'use client';

import React from 'react';
import { Lock, CheckCircle2 } from '@/lib/lucide-google-icons';

interface CandidateCredentialsCardProps {
  twoFactor: boolean;
  setTwoFactor: (val: boolean) => void;
  currentPass: string;
  setCurrentPass: (val: string) => void;
  newPass: string;
  setNewPass: (val: string) => void;
  confirmPass: string;
  setConfirmPass: (val: string) => void;
  passUpdated: boolean;
  passError: string;
  updatingPass: boolean;
  onPasswordSubmit: (e: React.FormEvent) => void;
}

export function CandidateCredentialsCard({
  twoFactor,
  setTwoFactor,
  currentPass,
  setCurrentPass,
  newPass,
  setNewPass,
  confirmPass,
  setConfirmPass,
  passUpdated,
  passError,
  updatingPass,
  onPasswordSubmit,
}: CandidateCredentialsCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 flex items-center gap-2">
        <Lock className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
        Account Security &amp; Credentials
      </h3>

      <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Two-Factor Authentication (2FA)
            </span>
            <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-full">
              {twoFactor ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Protect candidate account login with SMS or Authenticator App verification code.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTwoFactor(!twoFactor)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            twoFactor ? 'bg-brand-600 dark:bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              twoFactor ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <form onSubmit={onPasswordSubmit} className="space-y-4 pt-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Update Account Password
          </span>
          <div className="flex items-center gap-2">
            {passUpdated && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Password Updated!
              </span>
            )}
            {passError && (
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60">
                ⚠️ {passError}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="password"
            placeholder="Current Password"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updatingPass || !newPass || newPass !== confirmPass}
            className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            {updatingPass ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
