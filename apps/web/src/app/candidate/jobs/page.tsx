'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Job, Application } from '@/types';
import { JobCard, JobsGridSkeleton } from '@/components/ui';
import { ErrorState } from '@/components/ui/ErrorState';
import { Search, Filter } from '@/lib/lucide-google-icons';

export default function CandidateJobsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [jobsRes, appsRes] = await Promise.allSettled([
        apiClient.get<Job[]>('/jobs'),
        apiClient.get<Application[]>('/candidate/applications'),
      ]);

      if (jobsRes.status === 'fulfilled' && jobsRes.value) {
        const rawVal = jobsRes.value as unknown;
        const jobsList = Array.isArray(rawVal)
          ? rawVal
          : typeof rawVal === 'object' && rawVal !== null && 'jobs' in rawVal && Array.isArray((rawVal as { jobs: Job[] }).jobs)
            ? (rawVal as { jobs: Job[] }).jobs
            : [];
        setJobs(jobsList);
      }
      if (appsRes.status === 'fulfilled' && appsRes.value) {
        const rawApps = appsRes.value as unknown;
        const appsList = Array.isArray(rawApps)
          ? rawApps
          : typeof rawApps === 'object' && rawApps !== null && 'applications' in rawApps && Array.isArray((rawApps as { applications: Application[] }).applications)
            ? (rawApps as { applications: Application[] }).applications
            : [];
        setApplications(appsList);
      }

      if (jobsRes.status === 'rejected' && appsRes.status === 'rejected') {
        setError(jobsRes.reason);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const safeJobsList = Array.isArray(jobs) ? jobs : [];

  
  const filteredJobs = safeJobsList.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.orgName.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase());

    const matchesLocation = selectedLocation === 'All' ||
      (selectedLocation === 'Remote' && job.location.toLowerCase().includes('remote')) ||
      (selectedLocation === 'Hybrid' && job.location.toLowerCase().includes('hybrid')) ||
      (selectedLocation === 'Onsite' && !job.location.toLowerCase().includes('remote') && !job.location.toLowerCase().includes('hybrid'));

    const matchesExperience = selectedExperience === 'All' ||
      (selectedExperience === 'Senior' && job.experienceLevel.toLowerCase().includes('senior')) ||
      (selectedExperience === 'Mid' && !job.experienceLevel.toLowerCase().includes('senior') && !job.experienceLevel.toLowerCase().includes('lead')) ||
      (selectedExperience === 'Lead' && job.experienceLevel.toLowerCase().includes('lead'));

    return matchesSearch && matchesLocation && matchesExperience;
  });

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-md">
          <ErrorState error={error} onRetry={load} />
        </div>
      </div>
    );
  }

  if (loading) {
    return <JobsGridSkeleton count={6} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Browse Opportunities</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Apply to open roles directly from your dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 shadow-md backdrop-blur-md glass-panel">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search roles, keywords, or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-all glass-input"
          />
        </div>

        <div>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/50 dark:bg-slate-800/60 focus:outline-none focus:border-brand-500 transition-all glass-input font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="All" className="dark:bg-slate-900 dark:text-slate-200">Locations</option>
            <option value="Remote" className="dark:bg-slate-900 dark:text-slate-200">Remote</option>
            <option value="Hybrid" className="dark:bg-slate-900 dark:text-slate-200">Hybrid</option>
            <option value="Onsite" className="dark:bg-slate-900 dark:text-slate-200">On-Site</option>
          </select>
        </div>

        <div>
          <select
            value={selectedExperience}
            onChange={(e) => setSelectedExperience(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/50 dark:bg-slate-800/60 focus:outline-none focus:border-brand-500 transition-all glass-input font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="All" className="dark:bg-slate-900 dark:text-slate-200">Experience</option>
            <option value="Mid" className="dark:bg-slate-900 dark:text-slate-200">Mid-Level</option>
            <option value="Senior" className="dark:bg-slate-900 dark:text-slate-200">Senior Level</option>
            <option value="Lead" className="dark:bg-slate-900 dark:text-slate-200">Lead Level</option>
          </select>
        </div>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => {
            const hasApplied = applications.some((a) => a.jobId === job.id);

            return (
              <JobCard
                key={job.id}
                id={job.id}
                orgName={job.orgName}
                orgLogo={job.orgLogo}
                title={job.title}
                description={job.description}
                location={job.location}
                salary={job.salary}
                experienceLevel={job.experienceLevel}
                postedDate={job.postedDate}
                applicantsCount={job.applicantsCount}
                status={job.status}
                hasApplied={hasApplied}
                viewHref={`/candidate/jobs/${job.id}`}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/20 dark:bg-slate-900/40 glass-panel">
          <Filter className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No jobs match your criteria</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try widening your search terms or adjusting filters.</p>
        </div>
      )}
    </div>
  );
}
