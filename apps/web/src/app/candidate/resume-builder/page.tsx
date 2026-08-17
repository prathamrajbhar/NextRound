'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SetupStage } from './_components/SetupStage';
import { apiClient } from '@/lib/apiClient';
import { Loader2 } from '@/lib/lucide-google-icons';

export default function AIResumeBuilderSetupPage() {
  const router = useRouter();
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Senior (5+ Years)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartCall = async () => {
    setLoading(true);
    setError(null);
    try {
      const sessionRes = await apiClient.post<{ sessionId: string }>('/resume-builder/sessions', {
        targetRole,
        experienceLevel,
      });

      if (!sessionRes?.sessionId) {
        throw new Error('Failed to obtain session ID from backend.');
      }

      router.push(`/candidate/resume-builder/${sessionRes.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between pb-2 animate-in fade-in duration-300">
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[500px]">
          <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Creating AI Practicing Session...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-700 dark:text-rose-400 font-bold mb-4">
              {error}
            </div>
          )}
          <SetupStage
            targetRole={targetRole}
            setTargetRole={setTargetRole}
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
            onStartCall={handleStartCall}
          />
        </>
      )}
    </div>
  );
}
