'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Application } from '@/types';
import UnifiedInterviewConsole from '@/components/interview/UnifiedInterviewConsole';

export default function HrVideoCallConsole({ params }: { params: Promise<{ applicationId: string }> }) {
  const router = useRouter();
  const { applicationId } = use(params);

  const [app, setApp] = useState<Application | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callEnded, setCallEnded] = useState(false);

  useEffect(() => {
    async function fetchApp() {
      try {
        const data = await apiClient.get<Application>(`/applications/${applicationId}`);
        setApp(data);
      } catch (err) {
        console.error('Failed to load application:', err);
      }
    }
    fetchApp();
  }, [applicationId]);

  // Call timer effect
  useEffect(() => {
    if (callEnded) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callEnded]);

  const handleCompleteHRRound = async (result: 'pass' | 'fail', notes: string) => {
    try {
      await apiClient.post(`/interviews/hr/${applicationId}/result`, {
        result,
        notes: notes || 'Completed 1:1 human video call evaluation.',
      });
    } catch {
      // API fallback
    }

    if (app) {
      const updatedApp = {
        ...app,
        stage: 'Decision' as const,
        status: 'decided' as const,
        hrRoundStatus: result === 'pass' ? ('PASSED' as const) : ('FAILED' as const),
        hrRoundCompletedAt: new Date().toISOString(),
        decision: result === 'pass' ? ('hire' as const) : ('reject' as const),
        reasoning: `Human HR Round completed. Result: ${result.toUpperCase()}. Notes: "${notes || 'Completed 1:1 human video call evaluation.'}"`,
      };

      localStorage.setItem(`hrRoundResult_${app.id}`, JSON.stringify(updatedApp));
    }

    setCallEnded(true);
    router.push(`/hr/candidates/${applicationId}`);
  };

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-bold">
        Loading HR Video Console...
      </div>
    );
  }

  return (
    <UnifiedInterviewConsole
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
  );
}
