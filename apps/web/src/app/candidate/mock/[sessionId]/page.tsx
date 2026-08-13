'use client';

import React, { use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UnifiedAssessmentSession } from '@/components/interview/UnifiedAssessmentSession';
import { CandidateDashboardSkeleton } from '@/app/candidate/dashboard/_components/CandidateDashboardSkeleton';

function MockSessionContent({ params }: { params: Promise<{ sessionId: string }> }) {
  const searchParams = useSearchParams();
  const track = searchParams.get('track') || 'technical';
  const applicationId = searchParams.get('applicationId') || undefined;
  const company = searchParams.get('company') || undefined;
  const role = searchParams.get('role') || undefined;

  const { sessionId } = use(params);

  return (
    <UnifiedAssessmentSession
      sessionId={sessionId}
      applicationId={applicationId}
      track={track}
      company={company}
      role={role}
    />
  );
}

export default function MockSessionRoom({ params }: { params: Promise<{ sessionId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-10">
          <CandidateDashboardSkeleton />
        </div>
      }
    >
      <MockSessionContent params={params} />
    </Suspense>
  );
}
