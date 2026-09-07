'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('skeleton-shimmer relative overflow-hidden rounded-xl', className)} {...props} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card p-5 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="glass-card p-4 flex items-center gap-4">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className={cn('h-4 flex-1', c === 0 && 'max-w-[180px]')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-start gap-3.5">
      <Skeleton className="h-11 w-11 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-2.5 pt-0.5">
        <Skeleton className="h-7 w-56 max-w-full rounded-lg" />
        <Skeleton className="h-3.5 w-80 max-w-full rounded-md" />
      </div>
    </div>
  );
}

export function FormCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-11 w-40 rounded-xl" />
    </div>
  );
}
