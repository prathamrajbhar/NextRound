'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export type BadgeIntent = 'neutral' | 'indigo' | 'purple' | 'emerald' | 'amber' | 'rose' | 'sky';

const intentClasses: Record<BadgeIntent, string> = {
  neutral: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700',
  indigo: 'bg-brand-50 dark:bg-orange-950/60 text-brand-600 dark:text-orange-300 border-brand-100 dark:border-orange-900/60',
  purple: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border-purple-100 dark:border-purple-900/60',
  emerald: 'bg-success-50 dark:bg-emerald-950/60 text-success-700 dark:text-emerald-300 border-success-100 dark:border-emerald-900/60',
  amber: 'bg-warning-50 dark:bg-amber-950/60 text-warning-700 dark:text-amber-300 border-warning-100 dark:border-amber-900/60',
  rose: 'bg-danger-50 dark:bg-rose-950/60 text-danger-600 dark:text-rose-300 border-danger-100 dark:border-rose-900/60',
  sky: 'bg-info-50 dark:bg-sky-950/60 text-info-600 dark:text-sky-300 border-info-100 dark:border-sky-900/60',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  intent?: BadgeIntent;
  size?: 'xs' | 'sm';
  dot?: boolean;
  icon?: React.ReactNode;
}

export function Badge({
  className,
  intent = 'neutral',
  size = 'xs',
  dot = false,
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-bold border rounded-md shadow-sm select-none whitespace-nowrap',
        size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        intentClasses[intent],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            intent === 'neutral' && 'bg-slate-400 dark:bg-slate-500',
            intent === 'indigo' && 'bg-brand-500 dark:bg-orange-400',
            intent === 'purple' && 'bg-purple-500 dark:bg-purple-400',
            intent === 'emerald' && 'bg-success-500 dark:bg-emerald-400',
            intent === 'amber' && 'bg-warning-500 dark:bg-amber-400',
            intent === 'rose' && 'bg-danger-500 dark:bg-rose-400',
            intent === 'sky' && 'bg-info-500 dark:bg-sky-400'
          )}
        />
      )}
      {icon}
      {children}
    </span>
  );
}


export function statusToIntent(status: string): BadgeIntent {
  const s = status.toLowerCase();
  if (['hired', 'active', 'audited', 'confirmed', 'completed', 'passed'].some((k) => s.includes(k))) return 'emerald';
  if (['rejected', 'closed', 'failed', 'declined'].some((k) => s.includes(k))) return 'rose';
  if (['warning', 'flagged', 'hold', 'pending'].some((k) => s.includes(k))) return 'amber';
  if (['draft', 'scheduled'].some((k) => s.includes(k))) return 'sky';
  if (['interview', 'screening'].some((k) => s.includes(k))) return 'purple';
  return 'neutral';
}
