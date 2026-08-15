'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Bell,
  Sparkles,
  Shield,
  Palette,
  CheckCircle2,
} from '@/lib/lucide-google-icons';
import { useAuthContext } from '@/contexts/AuthContext';
import { getScopedStorage } from '@/lib/storage';
import { useCandidateProfile } from '@/hooks/queries';
import { CandidateProfileTab } from './_components/CandidateProfileTab';
import { CandidateNotificationsTab } from './_components/CandidateNotificationsTab';
import { CandidateAiPreferencesTab } from './_components/CandidateAiPreferencesTab';
import { CandidateSecurityPrivacyTab } from './_components/CandidateSecurityPrivacyTab';
import { CandidateAppearanceTab } from './_components/CandidateAppearanceTab';

export default function CandidateSettingsPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'ai' | 'security' | 'appearance'>('profile');
  const [savedToast, setSavedToast] = useState(false);
  const [readinessScore, setReadinessScore] = useState(60);

  const { data: profileRes, refetch } = useCandidateProfile();

  const calculateReadiness = useCallback(() => {
    const p = (profileRes?.profile ?? null) as Record<string, unknown> | null;
    const profile = p || {};
    const name = (profile.full_name as string) || getScopedStorage(user?.id, 'candidate_name') || (user?.email ? user.email.split('@')[0] : '');
    const email = (profile.email as string) || user?.email || getScopedStorage(user?.id, 'candidate_email');
    const headline = (profile.headline as string) || getScopedStorage(user?.id, 'candidate_headline');
    const phone = (profile.phone as string) || getScopedStorage(user?.id, 'candidate_phone');
    const loc = (profile.location as string) || getScopedStorage(user?.id, 'candidate_location');
    const portfolio = (profile.portfolio_url as string) || getScopedStorage(user?.id, 'candidate_portfolio');
    const bio = (profile.bio as string) || getScopedStorage(user?.id, 'candidate_bio');

    let score = 20; 
    if (name) score += 15;
    if (email) score += 15;
    if (headline) score += 15;
    if (phone) score += 10;
    if (loc) score += 10;
    if (portfolio) score += 5;
    if (bio) score += 10;

    setReadinessScore(Math.min(100, score));
  }, [profileRes, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateReadiness();
    }, 0);
    const handleUpdate = () => {
      refetch();
      calculateReadiness();
    };
    window.addEventListener('profile_update', handleUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('profile_update', handleUpdate);
    };
  }, [calculateReadiness, refetch]);

  const triggerSaveNotification = () => {
    setSavedToast(true);
    refetch();
    calculateReadiness();
    setTimeout(() => setSavedToast(false), 2200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 uppercase tracking-widest block mb-1">
            Candidate Portal • Smart Settings
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Account Settings &amp; Preferences
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Manage your candidate profile, notification channels, AI voice interviewer preferences, and privacy controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedToast ? (
            <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1.5 animate-in zoom-in-95 duration-200 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Preferences Saved!</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/40 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 backdrop-blur-md glass-panel flex items-center gap-2.5">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase">Profile Readiness</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{readinessScore}% Complete</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-amber-500 dark:from-orange-500 dark:to-amber-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                {readinessScore}%
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-4 shadow-md backdrop-blur-md glass-panel flex flex-col gap-1.5 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'profile'
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile &amp; Personal Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'notifications'
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notification &amp; Alerts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'ai'
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Interview &amp; Hardware</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'security'
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Privacy &amp; Directory Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'appearance'
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Theme &amp; Appearance</span>
          </button>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'profile' && <CandidateProfileTab onSave={triggerSaveNotification} />}
          {activeTab === 'notifications' && <CandidateNotificationsTab onSave={triggerSaveNotification} />}
          {activeTab === 'ai' && <CandidateAiPreferencesTab onSave={triggerSaveNotification} />}
          {activeTab === 'security' && <CandidateSecurityPrivacyTab onSave={triggerSaveNotification} />}
          {activeTab === 'appearance' && <CandidateAppearanceTab onSave={triggerSaveNotification} />}
        </div>
      </div>
    </div>
  );
}
