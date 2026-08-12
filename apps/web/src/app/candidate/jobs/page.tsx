'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Job, Application } from '@/types';
import { JobCard, JobsGridSkeleton } from '@/components/ui';
import { Search, Filter, Sparkles, Briefcase, MapPin, Award, X } from '@/lib/lucide-google-icons';

export default function CandidateJobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
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
      } catch (err) {
        console.error('Failed to load opportunities:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const safeJobsList = Array.isArray(jobs) ? jobs : [];

  // Filter jobs based on search criteria
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

  const remoteCount = safeJobsList.filter(j => j.location.toLowerCase().includes('remote')).length;
  const leadCount = safeJobsList.filter(j => j.experienceLevel.toLowerCase().includes('lead') || j.experienceLevel.toLowerCase().includes('senior')).length;

  const handleClearFilters = () => {
    setSearch('');
    setSelectedLocation('All');
    setSelectedExperience('All');
  };

  if (loading) {
    return <JobsGridSkeleton count={6} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[200px] left-[10%] w-[250px] h-[250px] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Modern Premium Banner / Header */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-linear-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6 sm:p-8 shadow-sm">
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0))]" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40">
              <Sparkles className="h-3 w-3 text-orange-500 dark:text-orange-400" />
              <span>EXPLORE CAREERS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Browse Opportunities
            </h1>
            <p className="text-xs sm:text-sm text-slate-550 dark:text-slate-400 font-medium max-w-xl leading-relaxed">
              Find and apply to open positions matching your background. Track applications and optimize your resume for high ATS compliance.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xs flex flex-col justify-between h-20">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Total Roles</span>
              <span className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">{safeJobsList.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xs flex flex-col justify-between h-20">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Remote</span>
              <span className="text-xl font-extrabold text-orange-600 dark:text-orange-400 mt-1">{remoteCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xs flex flex-col justify-between h-20">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Applied</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{applications.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Interactive Search & Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 shadow-xs backdrop-blur-md space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* Search box */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search roles, keywords, or companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
            />
            {search && (
              <button 
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Location filter pills */}
          <div className="lg:col-span-4 space-y-1.5">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Location Mode
            </span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {[
                { id: 'All', label: 'All' },
                { id: 'Remote', label: 'Remote' },
                { id: 'Hybrid', label: 'Hybrid' },
                { id: 'Onsite', label: 'Onsite' }
              ].map((loc) => {
                const active = selectedLocation === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocation(loc.id)}
                    className={`flex-1 text-center py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-white dark:bg-slate-800 text-orange-650 dark:text-orange-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {loc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience level pills */}
          <div className="lg:col-span-3 space-y-1.5">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> Experience Focus
            </span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {[
                { id: 'All', label: 'All' },
                { id: 'Mid', label: 'Mid' },
                { id: 'Senior', label: 'Senior' },
                { id: 'Lead', label: 'Lead' }
              ].map((exp) => {
                const active = selectedExperience === exp.id;
                return (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setSelectedExperience(exp.id)}
                    className={`flex-1 text-center py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-white dark:bg-slate-800 text-orange-650 dark:text-orange-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {exp.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Job Cards */}
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
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/10 backdrop-blur-md p-6 max-w-md mx-auto">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto mb-4">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">No jobs match your criteria</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Try adjusting your location tags, experience focus, or search keyword queries.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-5 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            Clear Active Filters
          </button>
        </div>
      )}
    </div>
  );
}
