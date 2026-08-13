'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export function CandidateDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {}
      <div className="glass-card p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2 w-full md:w-2/3">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-4 w-full max-w-md rounded-md" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Skeleton className="h-10 w-36 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-40 rounded" />
          <div className="space-y-4">
            <div className="glass-card p-6 space-y-3">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 rounded" />
          <div className="glass-card p-6 space-y-3">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
