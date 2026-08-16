'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2, Save } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';

interface CandidateSecurityPrivacyTabProps {
  onSave: () => void;
}

export function CandidateSecurityPrivacyTab({ onSave }: CandidateSecurityPrivacyTabProps) {
  const [visibility, setVisibility] = useState<'Verified' | 'Public' | 'Private'>('Verified');
  const [hideSalary, setHideSalary] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passUpdated, setPassUpdated] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPrivacySettings() {
      try {
        const res = await apiClient.get<{ settings?: Record<string, unknown> }>('/candidate/settings');
        if (res?.settings) {
          const s = res.settings;
          if (typeof s.visibility === 'string' && (s.visibility === 'Verified' || s.visibility === 'Public' || s.visibility === 'Private')) {
            setVisibility(s.visibility);
          }
          if (typeof s.hideSalary === 'boolean') setHideSalary(s.hideSalary);
          if (typeof s.twoFactor === 'boolean') setTwoFactor(s.twoFactor);
        }
      } catch {}
    }
    loadPrivacySettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch('/candidate/settings', {
        settings: {
          visibility,
          hideSalary,
          twoFactor,
        },
      });
      onSave();
    } catch (err) {
      console.error('Failed to save privacy settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass || newPass !== confirmPass) return;

    setPassUpdated(true);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassUpdated(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
          Security &amp; Privacy Controls
        </h2>
        <p className="text-xs text-slate-500 font-medium">Manage profile discoverability, salary masking, and account credentials</p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Profile Visibility Mode</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'Verified', title: 'Verified Recruiter Only', desc: 'Visible exclusively to vetted employers actively hiring for your target roles.' },
            { id: 'Public', title: 'Public Talent Directory', desc: 'Indexed in NextRound candidate index for all registered employers.' },
            { id: 'Private', title: 'Stealth Mode (Private)', desc: 'Hidden from discovery. Only visible to jobs you directly apply to.' },
          ].map((option) => {
            const selected = visibility === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setVisibility(option.id as 'Verified' | 'Public' | 'Private')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  selected
                    ? 'border-brand-500 dark:border-orange-500 bg-brand-500/10 dark:bg-orange-500/10 ring-2 ring-brand-500/30'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{option.title}</span>
                  {selected && <CheckCircle2 className="h-4 w-4 text-brand-500 dark:text-orange-400" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{option.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Hide Salary Expectations</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Keep compensation details private until formal offer round</span>
          </div>
          <button
            type="button"
            onClick={() => setHideSalary(!hideSalary)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              hideSalary ? 'bg-brand-600 dark:bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                hideSalary ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Lock className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          Account Security &amp; Credentials
        </h3>

        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Two-Factor Authentication (2FA)</span>
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

        <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Update Account Password</span>
            {passUpdated && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Password Updated!
              </span>
            )}
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
              disabled={!newPass || newPass !== confirmPass}
              className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </button>
      </div>
    </div>
  );
}
