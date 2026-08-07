'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/** Shimmering placeholder block used instead of a blank flash while data loads. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-xl bg-slate-800/60 border border-slate-700/30', className)}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full anim-shimmer bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />
    </div>
  );
}

/** Skeleton rows shaped like a Card, for grid/list loading states. */
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

/** Skeleton rows shaped like a table, for list/table loading states. */
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

/** Skeleton layout for Jobs Grid. */
export function JobsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="glass-card p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <Skeleton className="h-10 w-full md:w-80 rounded-xl" />
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Skeleton layout for Applications List. */
export function ApplicationsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="glass-card p-5 flex justify-between items-center">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton layout for HR Stats Cards. */
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

/** Skeleton layout for HR Analytics dashboard. */
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
