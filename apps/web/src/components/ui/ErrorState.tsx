'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, AlertTriangle, WifiOff, ShieldAlert, RefreshCw } from '@/lib/lucide-google-icons';
import { AppError, errorTitle, errorMessage } from '@/lib/errors';
import { cn } from '@/lib/cn';

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  message?: string;
  detail?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  className?: string;
}

function ErrorIcon({ error }: { error?: unknown }) {
  const code = error instanceof AppError ? error.code : 'UNKNOWN';
  const className = 'h-6 w-6';
  if (code === 'NETWORK') return <WifiOff className={className} />;
  if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') return <ShieldAlert className={className} />;
  if (code === 'VALIDATION') return <AlertTriangle className={className} />;
  return <AlertCircle className={className} />;
}

export function ErrorState({ error, title, message, detail, onRetry, action, className }: ErrorStateProps) {
  const resolvedTitle = title ?? errorTitle(error);
  const resolvedMessage = message ?? errorMessage(error);
  const resolvedDetail = detail ?? (error instanceof AppError ? error.detail : undefined);

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl',
        'border border-rose-200/70 dark:border-rose-900/50 bg-white/40 dark:bg-slate-900/40',
        className
      )}
    >
      <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
        <ErrorIcon error={error} />
      </div>
      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{resolvedTitle}</h3>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">{resolvedMessage}</p>
      {resolvedDetail && (
        <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1.5 max-w-md break-words">{resolvedDetail}</p>
      )}
      {(onRetry || action) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-extrabold shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

export function BackHomeAction() {
  return (
    <Link
      href="/"
      className="inline-flex items-center rounded-xl border border-slate-300/80 hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-extrabold transition-all cursor-pointer"
    >
      Back to Home
    </Link>
  );
}
