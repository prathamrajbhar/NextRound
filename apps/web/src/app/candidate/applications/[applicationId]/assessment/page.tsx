'use client';

import React, { use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UnifiedAssessmentSession } from '@/components/interview/UnifiedAssessmentSession';
import { CandidateDashboardSkeleton } from '@/app/candidate/dashboard/_components/CandidateDashboardSkeleton';

function CandidateAssessmentContent({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const searchParams = useSearchParams();

  const track = searchParams.get('track') || 'aptitude';

  return (
    <UnifiedAssessmentSession
      sessionId={applicationId}
      applicationId={applicationId}
      track={track}
    />
  );
}

export default function CandidateAssessmentPage({ params }: { params: Promise<{ applicationId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-10">
          <CandidateDashboardSkeleton />
        </div>
      }
    >
      <CandidateAssessmentContent params={params} />
    </Suspense>
  );
}
