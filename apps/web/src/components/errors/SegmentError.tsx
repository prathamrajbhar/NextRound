'use client';

import React, { useEffect } from 'react';
import { ErrorState, BackHomeAction } from '@/components/ui/ErrorState';

interface SegmentErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export function SegmentError({ error, retry }: SegmentErrorProps) {
  useEffect(() => {
    console.error('[SegmentError]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <ErrorState
          error={error}
          detail={error.digest ? `Reference: ${error.digest}` : undefined}
          onRetry={retry}
          action={<BackHomeAction />}
          className="border-rose-200/70 dark:border-rose-900/50 bg-white/40 dark:bg-slate-900/40"
        />
      </div>
    </div>
  );
}
