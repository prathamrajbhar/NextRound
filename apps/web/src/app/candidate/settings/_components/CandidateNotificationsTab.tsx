'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Save } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import { CandidateNotificationChannelsCard } from './CandidateNotificationChannelsCard';
import { CandidateDigestCadenceCard } from './CandidateDigestCadenceCard';

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
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiClient.get<{ settings?: Record<string, unknown> }>('/candidate/settings');
        if (res?.settings) {
          const s = res.settings;
          if (typeof s.emailNotifications === 'boolean') setEmailInvites(s.emailNotifications);
          if (typeof s.smsReminders === 'boolean') setSmsReminders(s.smsReminders);
          if (typeof s.aiScoreReports === 'boolean') setAiScoreReports(s.aiScoreReports);
          if (typeof s.dailyDigest === 'boolean') setDailyDigest(s.dailyDigest);
          if (typeof s.statusUpdates === 'boolean') setStatusUpdates(s.statusUpdates);
          if (typeof s.digestFrequency === 'string') setDigestFrequency(s.digestFrequency);
        }
      } catch {
        // Non-blocking initial load
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');

    try {
      await apiClient.patch('/candidate/settings', {
        emailNotifications: emailInvites,
        smsReminders,
        aiScoreReports,
        dailyDigest,
        statusUpdates,
        digestFrequency,
      });
      onSave();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save notification preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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

      <CandidateNotificationChannelsCard
        emailInvites={emailInvites}
        setEmailInvites={setEmailInvites}
        smsReminders={smsReminders}
        setSmsReminders={setSmsReminders}
        aiScoreReports={aiScoreReports}
        setAiScoreReports={setAiScoreReports}
        statusUpdates={statusUpdates}
        setStatusUpdates={setStatusUpdates}
        dailyDigest={dailyDigest}
        setDailyDigest={setDailyDigest}
      />

      <CandidateDigestCadenceCard
        digestFrequency={digestFrequency}
        setDigestFrequency={setDigestFrequency}
      />

      <div className="flex justify-end items-center gap-3">
        {saveError && (
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60">
            ⚠️ {saveError}
          </span>
        )}
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
