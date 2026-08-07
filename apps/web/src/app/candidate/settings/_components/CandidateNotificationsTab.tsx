'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Save } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';

interface CandidateNotificationsTabProps {
  onSave: () => void;
}

export function CandidateNotificationsTab({ onSave }: CandidateNotificationsTabProps) {
  const [emailInvites, setEmailInvites] = useState(true);
  const [smsReminders, setSmsReminders] = useState(true);
  const [aiScoreReports, setAiScoreReports] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState('Daily');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiClient.get<{ settings?: Record<string, unknown> }>('/candidate/settings').catch(() => null);
        if (res && res.settings) {
          const s = res.settings;
          if (typeof s.emailNotifications === 'boolean') setEmailInvites(s.emailNotifications);
          if (typeof s.smsReminders === 'boolean') setSmsReminders(s.smsReminders);
          if (typeof s.aiScoreReports === 'boolean') setAiScoreReports(s.aiScoreReports);
          if (typeof s.dailyDigest === 'boolean') setDailyDigest(s.dailyDigest);
          if (typeof s.statusUpdates === 'boolean') setStatusUpdates(s.statusUpdates);
          if (typeof s.digestFrequency === 'string') setDigestFrequency(s.digestFrequency);
        } else {
          const saved = localStorage.getItem('candidate_notification_settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (typeof parsed.emailInvites === 'boolean') setEmailInvites(parsed.emailInvites);
            if (typeof parsed.smsReminders === 'boolean') setSmsReminders(parsed.smsReminders);
            if (typeof parsed.aiScoreReports === 'boolean') setAiScoreReports(parsed.aiScoreReports);
            if (typeof parsed.dailyDigest === 'boolean') setDailyDigest(parsed.dailyDigest);
            if (typeof parsed.statusUpdates === 'boolean') setStatusUpdates(parsed.statusUpdates);
            if (typeof parsed.digestFrequency === 'string') setDigestFrequency(parsed.digestFrequency);
          }
        }
      } catch {
        // keep defaults
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const settingsData = {
      emailInvites,
      smsReminders,
      aiScoreReports,
      dailyDigest,
      statusUpdates,
      digestFrequency,
    };
    localStorage.setItem('candidate_notification_settings', JSON.stringify(settingsData));

    try {
      await apiClient.patch('/candidate/settings', {
        emailNotifications: emailInvites,
        smsReminders,
        aiScoreReports,
        dailyDigest,
        statusUpdates,
        digestFrequency,
      }).catch(() => null);
    } catch {
      // ignore offline fallback
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Notifications Header Banner */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
            Communication &amp; Alert Channels
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Customize how and when NextRound contacts you for interviews and AI reports.
          </p>
        </div>
      </div>

      {/* Switch Group */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-6">
        {/* Toggle Item 1 */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Job Invite Notifications</span>
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

        {/* Toggle Item 2 */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">SMS &amp; WhatsApp Reminders</span>
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

        {/* Toggle Item 3 */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">AI Assessment Score Reports</span>
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

        {/* Toggle Item 4 */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Application Stage Movement</span>
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

        {/* Toggle Item 5 */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Job Recommendation Digest</span>
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

      {/* Frequency selector card */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Digest Cadence</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">How frequently should we bundle non-urgent match alerts?</p>
        </div>

        <div className="flex gap-2">
          {['Realtime', 'Daily', 'Weekly'].map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => setDigestFrequency(freq)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                digestFrequency === freq
                  ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  );
}
