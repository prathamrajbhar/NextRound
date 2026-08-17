'use client';

import React from 'react';
import { FormCardSkeleton, PageHeaderSkeleton } from '@/components/ui';

export default function CandidateProfileLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeaderSkeleton />
      <FormCardSkeleton rows={4} />
    </div>
  );
}
