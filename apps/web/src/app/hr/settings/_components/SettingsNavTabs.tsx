'use client';

import React from 'react';
import { Settings, Users, Mail, Palette, Bell } from '@/lib/lucide-google-icons';

export type SettingsTabType = 'general' | 'appearance' | 'notifications' | 'team' | 'emails';

interface SettingsNavTabsProps {
  activeTab: SettingsTabType;
  setActiveTab: (tab: SettingsTabType) => void;
}

const TABS: Array<{ id: SettingsTabType; label: string; icon: React.ElementType }> = [
  { id: 'general', label: 'General & AI Cutoffs', icon: Settings },
  { id: 'appearance', label: 'Theme & Appearance', icon: Palette },
  { id: 'notifications', label: 'Notification Preferences', icon: Bell },
  { id: 'team', label: 'Team & Recruiter Roles', icon: Users },
  { id: 'emails', label: 'Email & Candidate Templates', icon: Mail },
];

export function SettingsNavTabs({ activeTab, setActiveTab }: SettingsNavTabsProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-4 shadow-md backdrop-blur-md glass-panel flex flex-col gap-1.5 select-none">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setActiveTab(id)}
          className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2.5 ${
            activeTab === id
              ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
          }`}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
