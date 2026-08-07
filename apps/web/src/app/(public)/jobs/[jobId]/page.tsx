'use client';

import React, { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'hr') {
          router.replace(`/hr/jobs/${jobId}/edit`);
        } else {
          router.replace(`/candidate/jobs/${jobId}`);
        }
      } else {
        router.replace(`/login?redirectTo=/candidate/jobs/${jobId}`);
      }
    }
  }, [user, loading, router, jobId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-xs font-bold animate-pulse">
      Redirecting to opportunity...
    </div>
  );
}

