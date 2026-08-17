'use client';

import React from 'react';
import { MockHistorySkeleton, PageHeaderSkeleton } from '@/components/ui';

export default function CandidateMockLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeaderSkeleton />
      <MockHistorySkeleton count={4} />
    </div>
  );
}
