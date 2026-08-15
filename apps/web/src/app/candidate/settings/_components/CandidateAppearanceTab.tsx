'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Sun, Moon, CheckCircle2, Save } from '@/lib/lucide-google-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { apiClient } from '@/lib/apiClient';
import { useAuthContext } from '@/contexts/AuthContext';
import { getScopedStorageJSON, setScopedStorageJSON } from '@/lib/storage';

interface CandidateAppearanceTabProps {
  onSave: () => void;
}

export function CandidateAppearanceTab({ onSave }: CandidateAppearanceTabProps) {
  const { user } = useAuthContext();
  const { theme, setTheme } = useTheme();
  const [glassmorphism, setGlassmorphism] = useState(true);
  const [compactDensity, setCompactDensity] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadUiSettings() {
      try {
        const res = await apiClient.get<{ settings?: Record<string, unknown> }>('/candidate/settings').catch(() => null);
        if (res && res.settings) {
          const s = res.settings;
          if (typeof s.glassmorphism === 'boolean') setGlassmorphism(s.glassmorphism);
          if (typeof s.compactDensity === 'boolean') setCompactDensity(s.compactDensity);
        } else {
          const parsed = getScopedStorageJSON<Record<string, unknown>>(user?.id, 'candidate_ui_settings');
          if (parsed) {
            if (typeof parsed.glassmorphism === 'boolean') setGlassmorphism(parsed.glassmorphism);
            if (typeof parsed.compactDensity === 'boolean') setCompactDensity(parsed.compactDensity);
          }
        }
      } catch {}
    }
    loadUiSettings();
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    const uiData = { glassmorphism, compactDensity };
    setScopedStorageJSON(user?.id, 'candidate_ui_settings', uiData);

    try {
      await apiClient.patch('/candidate/settings', {
        theme,
        glassmorphism,
        compactDensity,
      }).catch(() => null);
    } catch {}

    setSaving(false);
    onSave();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
        <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <Palette className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          Dashboard Theme &amp; System Aesthetics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
              theme === 'dark'
                ? 'border-orange-500 bg-slate-900 ring-2 ring-orange-500/30 text-white'
                : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="p-2 rounded-xl bg-slate-800 text-orange-400">
                <Moon className="h-5 w-5" />
              </div>
              {theme === 'dark' && <CheckCircle2 className="h-4 w-4 text-orange-400" />}
            </div>
            <div>
              <span className="text-xs font-extrabold block text-slate-900 dark:text-white">Dark Mode (Default)</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">High-contrast dark glassmorphism for reduced eye strain.</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
              theme === 'light'
                ? 'border-brand-500 bg-white ring-2 ring-brand-500/30 text-slate-900'
                : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Sun className="h-5 w-5" />
              </div>
              {theme === 'light' && <CheckCircle2 className="h-4 w-4 text-brand-600" />}
            </div>
            <div>
              <span className="text-xs font-extrabold block text-slate-900 dark:text-white">Light Mode</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Bright, crisp daytime interface styling.</span>
            </div>
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          Visual Effects &amp; Interface Spacing
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Glassmorphism Backdrop Blur</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Enable modern frosted glass backdrop blur effects across panels</span>
            </div>
            <button
              type="button"
              onClick={() => setGlassmorphism(!glassmorphism)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                glassmorphism ? 'bg-brand-600 dark:bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  glassmorphism ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Compact View Density</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Reduce line heights and padding for data-dense dashboards</span>
            </div>
            <button
              type="button"
              onClick={() => setCompactDensity(!compactDensity)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                compactDensity ? 'bg-brand-600 dark:bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  compactDensity ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Appearance Settings'}
        </button>
      </div>
    </div>
  );
}
