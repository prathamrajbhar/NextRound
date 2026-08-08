'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Job, Application } from '@/types';
import { CompanyLogo, FormattedMarkdown } from '@/components/ui';
import {
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
  ChevronRight,
  Check,
  Building2,
  Share2,
  Bookmark,
} from '@/lib/lucide-google-icons';
import { JobHeaderCard } from './_components/JobHeaderCard';
import { JobRubricCard } from './_components/JobRubricCard';
import { JobPrepArenaCard } from './_components/JobPrepArenaCard';
import { JobPrepSection } from './_components/JobPrepSection';

export default function CandidateJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
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
      } catch (err) {
        console.error('Failed to load job detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [jobId]);

  const handleApply = async () => {
    try {
      setSubmittingApp(true);
      const res = await apiClient.post<{ application?: { id: string }; id?: string }>('/applications', { jobId });
      setApplied(true);
      const newId = res?.application?.id || res?.id;
      if (newId) {
        router.push(`/candidate/applications/${newId}`);
      } else {
        router.push('/candidate/applications');
      }
    } catch (err) {
      console.error('Failed to submit application:', err);
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

  if (loading) {
    return <div className="p-8 text-slate-500 font-semibold text-center animate-pulse">Loading job details...</div>;
  }

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

  const skills: string[] = [];
  const hasDetailedMarkdown = job.description && (job.description.includes('##') || job.description.includes('*'));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
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

        {/* Action icons */}
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

      {/* Hero Job Header Card */}
      <JobHeaderCard
        job={job}
        applied={applied}
        onApply={handleApply}
        skills={job.skills || []}
        submitting={submittingApp}
      />

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main 2-Column Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* About the Role Section */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
                About the Role
              </h2>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Posted on {job.postedDate}
              </span>
            </div>

            <FormattedMarkdown content={job.description} />

            {!hasDetailedMarkdown && (
              <div className="pt-2">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
                  Core Responsibilities
                </h3>
                <div className="space-y-2.5">
                  {[
                    'Design, deploy, and benchmark core features and architectural specifications.',
                    'Write production-grade, maintainable code with strict TypeScript compilers and unit coverage.',
                    'Collaborate with UI/UX designers to build high-performance, accessible dashboard layouts.',
                    'Integrate robust error boundaries, structured monitoring, and telemetry middleware.',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-brand-50 dark:bg-orange-950/60 border border-brand-200 dark:border-orange-900/60 flex items-center justify-center text-brand-600 dark:text-orange-400 flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rubric: What We Look For Section */}
          <JobRubricCard rubric={job.rubric} />

          {/* AI Prep Content Section */}
          <JobPrepSection jobId={job.id} companyName={job.orgName} roleTitle={job.title} />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Overview Card */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-md glass-panel space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 font-display">
              Overview
            </h3>
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                    Location
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">{job.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                    Yearly Salary
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">{job.salary}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                    Experience Level
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">{job.experienceLevel}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                    Date Posted
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">{job.postedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Practice & Prep Arena Card */}
          <JobPrepArenaCard orgName={job.orgName} title={job.title} />

          {/* Similar Roles */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Similar Opportunities
            </h3>
            <div className="space-y-3">
              {similarJobs.map((simJob) => (
                <Link
                  key={simJob.id}
                  href={`/candidate/jobs/${simJob.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-3.5 shadow-sm hover:shadow transition-all glass-panel glass-panel-hover"
                >
                  <CompanyLogo name={simJob.orgName} logoUrl={simJob.orgLogo} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate">{simJob.title}</h4>
                    <span className="text-[10px] font-bold text-brand-600 dark:text-orange-400 block">{simJob.orgName}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

