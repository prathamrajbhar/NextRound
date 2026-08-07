'use client';

import React from 'react';
import { HrStatsSkeleton, TableSkeleton } from '@/components/ui/Skeleton';

export default function HrDashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <HrStatsSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <TableSkeleton rows={4} cols={4} />
        </div>
        <div className="glass-card p-6 space-y-4">
          <TableSkeleton rows={4} cols={2} />
        </div>
      </div>
    </div>
  );
}
