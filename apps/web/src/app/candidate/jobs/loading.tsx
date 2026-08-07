'use client';

import React from 'react';
import { JobsGridSkeleton } from '@/components/ui/Skeleton';

export default function CandidateJobsLoading() {
  return <JobsGridSkeleton count={6} />;
}
