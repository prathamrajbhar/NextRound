'use client';

import React from 'react';

interface AssessmentStageShellProps {
  children: React.ReactNode;
}





export function AssessmentStageShell({ children }: AssessmentStageShellProps) {
  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto p-2 sm:p-4 flex flex-col space-y-2 animate-in fade-in duration-300 transition-colors duration-300">
      <div className="flex-1">{children}</div>
    </div>
  );
}
