'use client';

import React from 'react';
import { Palette, Sun, Moon, Save } from '@/lib/lucide-google-icons';

interface AppearanceTabProps {
  theme: string;
  setTheme: (theme: 'light' | 'dark') => void;
  brandColor: string;
  setBrandColor: (color: string) => void;
  glassmorphism: boolean;
  setGlassmorphism: (val: boolean) => void;
  compactDensity: boolean;
  setCompactDensity: (val: boolean) => void;
  onSave: () => void;
}

export function AppearanceTab({
  theme,
  setTheme,
  brandColor,
  setBrandColor,
  glassmorphism,
  setGlassmorphism,
  compactDensity,
  setCompactDensity,
  onSave,
}: AppearanceTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Theme Mode Selector Card */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <Palette className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
            Theme Mode &amp; Color Scheme
          </h3>
        </div>

        {/* Light vs Dark Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-2 text-center select-none ${
              theme === 'light'
                ? 'border-brand-600 dark:border-orange-500 bg-brand-50/50 dark:bg-orange-950/40 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Light Theme</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Clean high-contrast daytime UI</span>
            </div>
          </div>

          <div
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-2 text-center select-none ${
              theme === 'dark'
                ? 'border-brand-600 dark:border-orange-500 bg-brand-50/50 dark:bg-orange-950/40 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className="h-10 w-10 rounded-full bg-slate-800 text-indigo-300 flex items-center justify-center">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Dark Theme</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sleek dark mode interface</span>
            </div>
          </div>
        </div>

        {/* Primary Accent Color Selector */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
          <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Primary Accent Palette</span>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'orange', name: 'HireOS Orange', bg: 'bg-orange-500' },
              { id: 'indigo', name: 'Royal Indigo', bg: 'bg-indigo-600' },
              { id: 'emerald', name: 'Emerald Mint', bg: 'bg-emerald-500' },
              { id: 'purple', name: 'Vibrant Purple', bg: 'bg-purple-600' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setBrandColor(c.id)}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                  brandColor === c.id
                    ? 'border-slate-900 dark:border-white ring-2 ring-slate-400/20 bg-slate-50 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/50'
                }`}
              >
                <span className={`h-4 w-4 rounded-full ${c.bg} flex-shrink-0`} />
                <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Density & Backdrop Toggles */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Glassmorphism Backdrop Blur</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Enable frosted glass panel styling across HR cards
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={glassmorphism}
                onChange={(e) => setGlassmorphism(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Compact View Density</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Reduce list padding for maximum screen data density
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={compactDensity}
                onChange={(e) => setCompactDensity(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>Save Appearance Preferences</span>
        </button>
      </div>
    </div>
  );
}
