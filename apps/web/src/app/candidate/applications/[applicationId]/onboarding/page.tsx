'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { OnboardingRecord } from '@/types';
import { useOnboarding } from '@/hooks/queries';
import { ErrorState } from '@/components/ui/ErrorState';
import { ChevronRight, UserPlus } from 'lucide-react';
import { ApplicationDetailSkeleton } from '@/components/ui';

export default function CandidateOnboardingPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const queryClient = useQueryClient();

  const { data: onboard, isLoading, isError, error, refetch } = useOnboarding(applicationId);

  // Sync localStorage with progressPercent
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

  if (isLoading) {
    return <ApplicationDetailSkeleton />;
  }

  if (!onboard) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">No Onboarding Record</h2>
        <p className="text-xs text-slate-500">Onboarding workflow will initiate once an offer is accepted.</p>
      </div>
    );
  }

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = onboard.tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: task.status === 'completed' ? 'pending' as const : 'completed' as const,
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

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'paperwork':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'equipment':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'access':
        return 'bg-blue-50 text-blue-700 border-blue-105';
      case 'training':
        return 'bg-indigo-50 text-indigo-75 border-indigo-100';
      default:
        return 'bg-emerald-50 text-emerald-75 border-emerald-100';
    }
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
            <Link href="/candidate/applications" className="hover:text-indigo-650 transition-colors">Applications</Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <Link href={`/candidate/applications/${applicationId}`} className="hover:text-indigo-655 transition-colors">{onboard.jobTitle}</Link>
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
            <p className="mt-0.5 opacity-90">Please complete all tasks to unlock access to the candidate portal dashboard, job board, and your profile sections.</p>
          </div>
        </div>
      )}

      {onboard.progressPercent === 100 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-3xl flex items-start gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-sm animate-in slide-in-from-top-4 duration-300">
          <span className="text-base select-none">✅</span>
          <div>
            <p className="font-bold">All Onboarding Tasks Complete!</p>
            <p className="mt-0.5 opacity-90">Outstanding job! You have completed all initial checklist tasks. Your workspace access has been fully restored.</p>
            <Link href="/candidate/dashboard" className="inline-flex items-center gap-1.5 mt-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-650 text-white px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-sm">
              Proceed to Dashboard →
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-white/60 bg-white/45 p-6 sm:p-8 shadow-md backdrop-blur-md glass-panel space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xl font-bold shadow-sm flex-shrink-0">
              <UserPlus className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Onboarding Checklist</h1>
              <p className="text-xs text-slate-550 font-semibold">Join date: <span className="font-bold text-indigo-600">{onboard.startDate}</span> • Buddy: {onboard.buddyName}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 block uppercase">Progress</span>
            <span className="text-2xl font-black text-slate-800">{onboard.progressPercent}%</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="w-full bg-slate-200/50 rounded-full h-2 p-0.5 border border-slate-100/40">
            <div className="bg-emerald-500 h-1 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-300" style={{ width: `${onboard.progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-805">Your Checklist Items</h3>

          <div className="space-y-3">
            {onboard.tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer flex gap-3.5 items-start ${
                    isCompleted
                      ? 'bg-slate-50 border-slate-200/60 opacity-70'
                      : 'bg-white/45 border-white/60 hover:bg-white/70 shadow-sm'
                  }`}
                >
                  <div className={`flex-shrink-0 mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-indigo-600 border-indigo-650 text-white'
                      : 'border-slate-300 bg-white/40 hover:border-slate-400'
                  }`}>
                    {isCompleted && <span className="text-[10px] font-bold">✓</span>}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className={`text-xs font-bold block ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-805'}`}>
                      {task.title}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${getCategoryColor(task.category)}`}>
                        {task.category}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold">
                        Due: {task.dueDate} • Owner: {task.owner}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <h4 className="text-xs font-bold text-slate-805 border-b border-slate-100 pb-2">Support Team</h4>

            <div className="space-y-3 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                  {onboard.managerName?.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <span className="block font-bold text-slate-800">{onboard.managerName}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Manager</span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold border border-emerald-100">
                  {onboard.buddyName?.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <span className="block font-bold text-slate-800">{onboard.buddyName}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Onboarding Buddy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel space-y-2">
            <h4 className="text-xs font-bold text-slate-805 border-b border-slate-100 pb-2">Welcome Note</h4>
            <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">
              We are thrilled to welcome you to the {onboard.orgName} family. Follow this list to get set up with laptops, corporate emails, and initial training checklists before your first day!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
