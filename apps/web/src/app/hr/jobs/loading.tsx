'use client';

import React from 'react';
import { JobsGridSkeleton } from '@/components/ui/Skeleton';

export default function HrJobsLoading() {
  return <JobsGridSkeleton count={6} />;
}
