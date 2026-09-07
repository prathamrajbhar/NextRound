'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { OnboardingRecord } from '@/types';
import { useOnboarding } from '@/hooks/queries';
import { ErrorState } from '@/components/ui/ErrorState';
import { ChevronRight } from 'lucide-react';
import { ApplicationDetailSkeleton } from '@/components/ui';
import { OnboardingHeaderCard } from './_components/OnboardingHeaderCard';
import { OnboardingTasksList } from './_components/OnboardingTasksList';
import { OnboardingTeamCard } from './_components/OnboardingTeamCard';

export default function CandidateOnboardingPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = use(params);
  const queryClient = useQueryClient();

  const { data: onboard, isLoading, isError, error, refetch } = useOnboarding(applicationId);

  React.useEffect(() => {
    if (onboard) {
      if (onboard.progressPercent === 100) {
        localStorage.setItem('onboarding_completed_' + applicationId, 'true');
      } else {
        localStorage.removeItem('onboarding_completed_' + applicationId);
      }
    }
  }, [onboard, applicationId]);

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-md">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  if (isLoading) return <ApplicationDetailSkeleton />;

  if (!onboard) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">No Onboarding Record</h2>
        <p className="text-xs text-slate-500">
          Onboarding workflow will initiate once an offer is accepted.
        </p>
      </div>
    );
  }

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = onboard.tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: task.status === 'completed' ? ('pending' as const) : ('completed' as const),
        };
      }
      return task;
    });

    const completedCount = updatedTasks.filter((t) => t.status === 'completed').length;
    const progressPercent = Math.round((completedCount / updatedTasks.length) * 100);

    if (progressPercent === 100) {
      localStorage.setItem('onboarding_completed_' + applicationId, 'true');
    } else {
      localStorage.removeItem('onboarding_completed_' + applicationId);
    }

    queryClient.setQueryData<OnboardingRecord>(['onboarding', applicationId], (prev) =>
      prev ? { ...prev, tasks: updatedTasks, progressPercent } : prev
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-200">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        {onboard.progressPercent < 100 ? (
          <>
            <span className="text-slate-400">Applications</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-slate-400">{onboard.jobTitle}</span>
          </>
        ) : (
          <>
            <Link href="/candidate/applications" className="hover:text-indigo-650 transition-colors">
              Applications
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <Link
              href={`/candidate/applications/${applicationId}`}
              className="hover:text-indigo-655 transition-colors"
            >
              {onboard.jobTitle}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <span className="text-slate-800 dark:text-slate-200 font-bold">Onboarding checklist</span>
      </div>

      {onboard.progressPercent < 100 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs font-semibold shadow-sm animate-in slide-in-from-top-4 duration-300">
          <span className="text-base select-none">⚠️</span>
          <div>
            <p className="font-bold">Onboarding Checklist Incomplete</p>
            <p className="mt-0.5 opacity-90">
              Please complete all tasks to unlock access to the candidate portal dashboard, job board, and your profile sections.
            </p>
          </div>
        </div>
      )}

      {onboard.progressPercent === 100 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-3xl flex items-start gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-sm animate-in slide-in-from-top-4 duration-300">
          <span className="text-base select-none">✅</span>
          <div>
            <p className="font-bold">All Onboarding Tasks Complete!</p>
            <p className="mt-0.5 opacity-90">
              Outstanding job! You have completed all initial checklist tasks. Your workspace access has been fully restored.
            </p>
            <Link
              href="/candidate/dashboard"
              className="inline-flex items-center gap-1.5 mt-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-650 text-white px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-sm"
            >
              Proceed to Dashboard →
            </Link>
          </div>
        </div>
      )}

      <OnboardingHeaderCard onboard={onboard} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OnboardingTasksList tasks={onboard.tasks} onToggleTask={handleToggleTask} />
        <OnboardingTeamCard onboard={onboard} />
      </div>
    </div>
  );
}
