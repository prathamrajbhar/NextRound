'use client';

import React from 'react';
import { PageHeaderSkeleton, ResumesListSkeleton } from '@/components/ui';

export default function CandidateResumesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeaderSkeleton />
      <ResumesListSkeleton count={6} />
    </div>
  );
}