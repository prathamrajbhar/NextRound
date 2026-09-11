import React from 'react';
import { CheckCircle2, Loader2, RefreshCw } from '@/lib/lucide-google-icons';
import { StepStatus } from './types';

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  status: StepStatus;
  label?: string;
  error?: string;
  onRetry: () => void;
  qualityBadge?: React.ReactNode;
  children?: React.ReactNode;
}

export function StepCard({ icon, title, status, label, error, onRetry, qualityBadge, children }: StepCardProps) {
  const borderClass =
    status === 'pass'
      ? 'border-emerald-800/60'
      : status === 'fail'
      ? 'border-red-800/60'
      : status === 'checking'
      ? 'border-orange-800/40'
      : 'border-slate-800';

  const iconColor =
    status === 'pass'
      ? 'text-emerald-400'
      : status === 'fail'
      ? 'text-red-400'
      : status === 'checking'
      ? 'text-orange-400'
      : 'text-slate-500';

  return (
    <div className={`rounded-2xl border bg-slate-900 px-4 py-3 transition-colors duration-300 ${borderClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`flex-shrink-0 transition-colors duration-300 ${iconColor}`}>{icon}</span>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">{title}</span>
            {label && status === 'pass' && (
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{label}</p>
            )}
            {error && status === 'fail' && (
              <p className="text-[10px] text-red-400 leading-snug mt-0.5">{error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {qualityBadge}
          {status === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-orange-400" />}
          {status === 'pass' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {status === 'fail' && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] font-bold transition-all cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}
          {status === 'idle' && <span className="h-4 w-4 rounded-full border border-slate-700" />}
        </div>
      </div>

      {children}
    </div>
  );
}

export function SpeedMetric({
  label,
  value,
  unit,
  fill,
  barClass,
}: {
  label: string;
  value: number;
  unit: string;
  fill: number;
  barClass: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-extrabold tracking-widest text-slate-500 uppercase">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black text-slate-100 tabular-nums leading-none">{value}</span>
        <span className="text-[10px] font-bold text-slate-500">{unit}</span>
      </div>
      <div className="h-0.5 w-full bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`}
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  );
}

export function SkeletonMetric({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-extrabold tracking-widest text-slate-500 uppercase">{label}</span>
      <div className="h-6 w-14 bg-slate-800 rounded animate-pulse" />
      <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full w-1/4 bg-slate-700 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
