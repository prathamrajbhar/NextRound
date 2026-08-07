'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function JobsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'hr') {
          router.replace('/hr/jobs');
        } else {
          router.replace('/candidate/jobs');
        }
      } else {
        router.replace('/login?redirectTo=/candidate/jobs');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-xs font-bold animate-pulse">
      Redirecting to job catalog...
    </div>
  );
}

