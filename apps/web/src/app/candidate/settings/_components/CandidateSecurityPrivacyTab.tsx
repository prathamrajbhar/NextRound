'use client';

import React, { useState, useEffect } from 'react';
import { Save } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import { CandidateVisibilityCard } from './CandidateVisibilityCard';
import { CandidateCredentialsCard } from './CandidateCredentialsCard';

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
  const [saveError, setSaveError] = useState('');
  const [passError, setPassError] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  useEffect(() => {
    async function loadPrivacySettings() {
      try {
        const res = await apiClient.get<{ settings?: Record<string, unknown> }>('/candidate/settings');
        if (res?.settings) {
          const s = res.settings;
          if (
            typeof s.visibility === 'string' &&
            (s.visibility === 'Verified' || s.visibility === 'Public' || s.visibility === 'Private')
          ) {
            setVisibility(s.visibility);
          }
          if (typeof s.hideSalary === 'boolean') setHideSalary(s.hideSalary);
          if (typeof s.twoFactor === 'boolean') setTwoFactor(s.twoFactor);
        }
      } catch {
        // Non-blocking initial settings load
      }
    }
    loadPrivacySettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await apiClient.patch('/candidate/settings', {
        visibility,
        hideSalary,
        twoFactor,
      });
      onSave();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass || newPass !== confirmPass) return;

    setUpdatingPass(true);
    setPassError('');
    setPassUpdated(false);

    try {
      await apiClient.patch('/auth/change-password', {
        currentPassword: currentPass,
        newPassword: newPass,
      });
      setPassUpdated(true);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setPassUpdated(false), 2500);
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setUpdatingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      <CandidateVisibilityCard
        visibility={visibility}
        setVisibility={setVisibility}
        hideSalary={hideSalary}
        setHideSalary={setHideSalary}
      />

      <CandidateCredentialsCard
        twoFactor={twoFactor}
        setTwoFactor={setTwoFactor}
        currentPass={currentPass}
        setCurrentPass={setCurrentPass}
        newPass={newPass}
        setNewPass={setNewPass}
        confirmPass={confirmPass}
        setConfirmPass={setConfirmPass}
        passUpdated={passUpdated}
        passError={passError}
        updatingPass={updatingPass}
        onPasswordSubmit={handlePasswordSubmit}
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
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </button>
      </div>
    </div>
  );
}
