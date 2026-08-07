'use client';

import React from 'react';
import { ApplicationsListSkeleton } from '@/components/ui/Skeleton';

export default function CandidateApplicationsLoading() {
  return <ApplicationsListSkeleton count={5} />;
}
