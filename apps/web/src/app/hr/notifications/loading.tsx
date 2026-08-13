'use client';

import React from 'react';
import { PageHeaderSkeleton, NotificationsListSkeleton } from '@/components/ui';

export default function HrNotificationsLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-200">
      <PageHeaderSkeleton />
      <NotificationsListSkeleton count={6} />
    </div>
  );
}