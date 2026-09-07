'use client';

import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800 animate-pulse" />
            <div className="h-7 w-20 bg-slate-800 rounded animate-pulse" />
            <div className="h-3 w-32 bg-slate-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="glass-card p-6 space-y-4">
        <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="h-40 w-full bg-slate-800/60 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
