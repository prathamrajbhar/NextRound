'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Job, Application } from '@/types';
import { ChevronRight, Share2, Bookmark } from '@/lib/lucide-google-icons';
import { JobHeaderCard } from './_components/JobHeaderCard';
import { JobRubricCard } from './_components/JobRubricCard';
import { JobPrepArenaCard } from './_components/JobPrepArenaCard';
import { JobPrepSection } from './_components/JobPrepSection';
import { JobOverviewCard } from './_components/JobOverviewCard';
import { JobSimilarList } from './_components/JobSimilarList';
import { JobAboutRoleCard } from './_components/JobAboutRoleCard';
import { JobDetailSkeleton } from '@/components/ui';

export default function CandidateJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [applied, setApplied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [jobRes, allJobsRes, appsRes] = await Promise.allSettled([
          apiClient.get<Job>(`/jobs/${jobId}`),
          apiClient.get<Job[]>('/jobs'),
          apiClient.get<Application[]>('/candidate/applications'),
        ]);

        if (jobRes.status === 'fulfilled' && jobRes.value) {
          setJob(jobRes.value);
        }

        if (allJobsRes.status === 'fulfilled' && allJobsRes.value) {
          setSimilarJobs(allJobsRes.value.filter((j) => j.id !== jobId).slice(0, 2));
        }

        if (appsRes.status === 'fulfilled' && appsRes.value) {
          const hasApplied = appsRes.value.some((a) => a.jobId === jobId);
          setApplied(hasApplied);
        }
      } catch {
        // Handled in finally
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [jobId]);

  const handleApply = async () => {
    try {
      setSubmittingApp(true);
      const res = await apiClient.post<{ application?: { id: string }; id?: string }>(
        '/applications',
        { jobId }
      );
      setApplied(true);
      const newId = res?.application?.id || res?.id;
      if (newId) {
        router.push(`/candidate/applications/${newId}`);
      } else {
        router.push('/candidate/applications');
      }
    } catch {
      // Ignored
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <JobDetailSkeleton />;

  if (!job) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Job Posting Not Found</h2>
        <p className="text-xs text-slate-500">The requested job listing could not be found or has expired.</p>
        <Link href="/candidate/jobs" className="inline-block text-xs font-bold text-emerald-600 hover:underline">
          Return to Job Search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link
            href="/candidate/jobs"
            className="hover:text-brand-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1"
          >
            Browse Jobs
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
          <span className="text-slate-800 dark:text-slate-200 font-bold line-clamp-1">{job.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              bookmarked
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-300'
                : 'bg-white/50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Save job"
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-amber-500' : ''}`} />
            <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Share opportunity"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      <JobHeaderCard
        job={job}
        applied={applied}
        onApply={handleApply}
        skills={job.skills || []}
        submitting={submittingApp}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-8">
          <JobAboutRoleCard job={job} />
          <JobRubricCard rubric={job.rubric} />
          <JobPrepSection jobId={job.id} companyName={job.orgName} roleTitle={job.title} />
        </div>

        <div className="space-y-6">
          <JobOverviewCard job={job} />
          <JobPrepArenaCard orgName={job.orgName} title={job.title} />
          <JobSimilarList similarJobs={similarJobs} />
        </div>
      </div>
    </div>
  );
}
