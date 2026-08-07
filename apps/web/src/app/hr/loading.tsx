'use client';

import React from 'react';
import { HrStatsSkeleton, TableSkeleton } from '@/components/ui/Skeleton';

export default function HrLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <HrStatsSkeleton count={4} />
      <div className="glass-card p-6 space-y-4">
        <TableSkeleton rows={5} cols={5} />
      </div>
    </div>
  );
}
