'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}





export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl',
        'border border-dashed border-slate-300/70 bg-white/30',
        className
      )}
    >
      {icon && (
        <div className="h-14 w-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-500 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>
      {description && <p className="text-xs font-medium text-slate-500 mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
