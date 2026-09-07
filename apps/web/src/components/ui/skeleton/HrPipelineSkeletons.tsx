'use client';

import React from 'react';
import { Skeleton } from './BaseSkeleton';

export function HrStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function AnalyticsGridSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <HrStatsSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="glass-card p-6 space-y-4">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function PipelineBoardSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="glass-card p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <Skeleton className="h-5 w-64 rounded" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            {[0, 1, 2].map((card) => (
              <div
                key={card}
                className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/70 p-4 space-y-2.5"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-6 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
