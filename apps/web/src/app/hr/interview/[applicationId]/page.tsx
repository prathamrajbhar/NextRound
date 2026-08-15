'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useApplication } from '@/hooks/queries';
import UnifiedInterviewConsole from '@/components/interview/UnifiedInterviewConsole';

export default function HrVideoCallConsole({ params }: { params: Promise<{ applicationId: string }> }) {
  const router = useRouter();
  const { applicationId } = use(params);

  const [callDuration, setCallDuration] = useState(0);
  const [callEnded, setCallEnded] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: app } = useApplication(applicationId);

  useEffect(() => {
    if (callEnded) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callEnded]);

  const handleCompleteHRRound = async (result: 'pass' | 'fail', notes: string) => {
    setSubmitError(null);
    try {
      await apiClient.post(`/interviews/hr/${applicationId}/result`, {
        decision: result,
        notes: notes || 'Completed 1:1 human video call evaluation.',
      });
      setCallEnded(true);
      router.push(`/hr/candidates/${applicationId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to finalize evaluation result.';
      setSubmitError(msg);
      console.error('Error finalizing HR round:', err);
    }
  };

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-bold">
        Loading HR Video Console...
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen">
      {submitError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-rose-950/95 border border-rose-800 text-rose-200 px-5 py-3 rounded-2xl text-xs font-extrabold shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Error: {submitError}</span>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-rose-400 hover:text-white font-black text-sm ml-2 cursor-pointer transition-colors"
          >
            &times;
          </button>
        </div>
      )}

      <UnifiedInterviewConsole
        applicationId={applicationId}
        mode="hr-recruiter"
        companyName={app.orgName}
        jobTitle={app.jobTitle}
        candidateName={app.candidateName}
        callDuration={callDuration}
        onEndSession={() => {
          setCallEnded(true);
          router.push(`/hr/candidates/${applicationId}`);
        }}
        onCompleteHRRound={handleCompleteHRRound}
      />
    </div>
  );
}

