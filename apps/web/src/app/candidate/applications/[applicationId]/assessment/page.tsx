'use client';

import React, { use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UnifiedAssessmentSession } from '@/components/interview/UnifiedAssessmentSession';

function CandidateAssessmentContent({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const searchParams = useSearchParams();
  // Default actual job assessment track to aptitude (which transitions to other rounds as required)
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
        <div className="text-center text-xs font-semibold text-slate-450 p-8">
          Loading assessment console...
        </div>
      }
    >
      <CandidateAssessmentContent params={params} />
    </Suspense>
  );
}
