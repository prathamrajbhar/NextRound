'use client';

import React from 'react';
import { Sun, Moon } from '@/lib/lucide-google-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={(e) => toggleTheme(e)}
      suppressHydrationWarning
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className={`group relative flex items-center gap-2 rounded-full p-2 text-xs font-semibold transition-all duration-300 cursor-pointer select-none border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95 ${isDark
          ? 'bg-slate-800/80 border-slate-700/80 text-amber-300 hover:bg-slate-700/80 hover:border-slate-600 hover:text-amber-200 shadow-sm shadow-slate-950/40'
          : 'bg-white/80 border-slate-200/90 text-amber-500 hover:bg-white hover:border-slate-300 hover:text-amber-600 shadow-sm shadow-slate-200/50 backdrop-blur-md'
        } ${className}`}
    >
      <div className="relative flex h-5 w-5 items-center justify-center overflow-hidden">
        <Sun
          className={`h-4.5 w-4.5 transition-all duration-500 ease-out transform ${isDark
              ? 'translate-y-6 opacity-0 rotate-90 scale-50'
              : 'translate-y-0 opacity-100 rotate-0 scale-100'
            }`}
        />
        <Moon
          className={`absolute h-4.5 w-4.5 transition-all duration-500 ease-out transform ${isDark
              ? 'translate-y-0 opacity-100 rotate-0 scale-100 text-indigo-300'
              : '-translate-y-6 opacity-0 -rotate-90 scale-50'
            }`}
        />
      </div>

      {showLabel && (
        <span suppressHydrationWarning className="pr-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
