'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CandidateLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="glass-card p-6 space-y-3">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <div className="glass-card p-6 space-y-4">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
