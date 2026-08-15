'use client';

import React from 'react';
import { Brain } from '@/lib/lucide-google-icons';

interface AptitudeStateCardProps {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  
  spinningIcon?: boolean;
}

export function AptitudeStateCard({
  icon: Icon = Brain,
  title,
  subtitle,
  actionLabel,
  onAction,
  spinningIcon,
}: AptitudeStateCardProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center animate-in fade-in duration-300 font-sans">
      <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xl max-w-md w-full space-y-4">
        <div className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 shadow-sm">
          <Icon className={`h-8 w-8 ${spinningIcon ? 'animate-spin' : 'animate-pulse'}`} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black font-display text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>}
        </div>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
