'use client';

import React from 'react';
import { Skeleton } from './BaseSkeleton';

export function JobDetailSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-56 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>
      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row gap-5 md:items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64 max-w-full rounded-lg" />
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8 space-y-4">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
          <div className="glass-card p-6 space-y-4">
            <Skeleton className="h-5 w-44 rounded" />
            {[0, 1, 2].map((s) => (
              <Skeleton key={s} className="h-8 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            <Skeleton className="h-5 w-28 rounded" />
            {[0, 1, 2, 3].map((s) => (
              <Skeleton key={s} className="h-9 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

export function ApplicationDetailSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-64 rounded" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8 space-y-4">
            <Skeleton className="h-6 w-52 rounded-lg" />
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <div className="glass-card p-6 space-y-4">
            <Skeleton className="h-5 w-44 rounded" />
            {[0, 1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            <Skeleton className="h-5 w-32 rounded" />
            {[0, 1, 2, 3].map((s) => (
              <Skeleton key={s} className="h-9 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

export function CandidateDetailSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-64 rounded" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
      <div className="glass-card p-6 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-3">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
          </div>
          <div className="glass-card p-6 space-y-4">
            <Skeleton className="h-5 w-44 rounded" />
            {[0, 1, 2, 3].map((s) => (
              <Skeleton key={s} className="h-9 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-3">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
