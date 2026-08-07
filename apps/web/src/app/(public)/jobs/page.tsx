'use client';

import React, { useState, useEffect } from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { apiClient } from '@/lib/apiClient';
import { Job, Application } from '@/types';
import { JobCard } from '@/components/ui';
import { Search, Filter } from 'lucide-react';

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const res = await apiClient.get<Job[]>('/jobs');
        if (res) {
          setJobs(res);
        }

        const userApps = await apiClient.get<Application[]>('/candidate/applications');
        if (userApps) {
          setAppliedJobIds(userApps.map(a => a.jobId));
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  // Filter jobs based on criteria
  const filteredJobs = jobs.filter((job) => {
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

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Open Opportunities</h1>
          <p className="mt-2 text-sm text-slate-600">
            Apply to top-tier startups and organizations with a single unified NextRound candidate profile.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl border border-white/60 bg-white/40 shadow-md backdrop-blur-md glass-panel">
          {/* Search box */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search roles, keywords, or companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Location filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            >
              <option value="All">All Locations</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">On-Site</option>
            </select>
          </div>

          {/* Experience level */}
          <div>
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            >
              <option value="All">All Levels</option>
              <option value="Mid">Mid-Level</option>
              <option value="Senior">Senior Level</option>
              <option value="Lead">Lead Level</option>
            </select>
          </div>
        </div>

        {/* Main Grid: Job Cards */}
        {loading ? (
          <div className="text-center py-16 text-xs font-bold text-slate-400">Loading open opportunities...</div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => {
              const hasApplied = appliedJobIds.includes(job.id);

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
                  viewHref={`/jobs/${job.id}`}
                  applyHref={`/signup?role=candidate&jobId=${job.id}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-dashed border-slate-300 bg-white/20 glass-panel">
            <Filter className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No jobs match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try widening your search terms or adjusting filters.</p>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
