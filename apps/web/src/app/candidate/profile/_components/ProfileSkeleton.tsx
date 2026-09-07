'use client';

import React from 'react';

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 animate-pulse pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/40 dark:border-slate-800/60 pb-4">
        <div className="space-y-2">
          <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800/65 rounded-md" />
          <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800/65 rounded-lg" />
          <div className="h-3.5 w-72 bg-slate-200/50 dark:bg-slate-800/50 rounded-md" />
        </div>
        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800/65 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800/60 bg-white/45 dark:bg-slate-900/60 p-6 sm:p-7 shadow-sm space-y-6">
            <div className="h-4.5 w-36 bg-slate-200 dark:bg-slate-800/65 rounded-md mb-4" />

            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-slate-200 dark:bg-slate-800/65 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800/65 rounded-md" />
                <div className="h-8 w-32 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800/65 rounded-md" />
                  <div className="h-10 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800/60 bg-white/45 dark:bg-slate-900/60 p-6 shadow-sm space-y-4">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800/65 rounded-md" />
            <div className="flex justify-center py-4">
              <div className="h-28 w-28 rounded-full border-8 border-slate-200 dark:border-slate-800/65 flex items-center justify-center">
                <div className="h-6 w-12 bg-slate-200 dark:bg-slate-800/65 rounded-md" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-md" />
              <div className="h-3.5 w-3/4 bg-slate-200/50 dark:bg-slate-800/50 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
