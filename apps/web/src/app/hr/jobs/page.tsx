'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getStoredJobs, Job } from '@/lib/mockData';
import { Plus, Search, ChevronRight, Briefcase } from '@/lib/lucide-google-icons';

export default function HrJobsList() {
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'closed'>('all');
  const [search, setSearch] = useState('');
  const [jobs] = useState<Job[]>(() => getStoredJobs());

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || job.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Job Openings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Manage job listings, custom evaluation rubrics, and candidate pipelines.
          </p>
        </div>
        <Link
          href="/hr/jobs/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Job Post
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Tabs */}
        <div className="flex p-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 select-none text-xs font-bold text-slate-600 dark:text-slate-300">
          {(['all', 'active', 'draft', 'closed'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer capitalize ${
                filter === item ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-sm' : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all glass-input"
          />
        </div>
      </div>

      {/* Table grid */}
      {filteredJobs.length > 0 ? (
        <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 shadow-md backdrop-blur-md glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800 bg-white/30 dark:bg-slate-800/40 text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Candidates</th>
                  <th className="px-6 py-4">Posted Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-white/20 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 dark:text-slate-100 block">{job.title}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-0.5">{job.location} • {job.salary}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        job.status === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/60'
                          : job.status === 'draft'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{job.applicantsCount} active</td>
                    <td className="px-6 py-4 text-slate-400 dark:text-slate-400">{job.postedDate}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link
                        href={`/hr/jobs/${job.id}/edit`}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold cursor-pointer"
                      >
                        Edit Scoring
                      </Link>
                      <Link
                        href={`/hr/jobs/${job.id}/pipeline`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline transition-colors cursor-pointer"
                      >
                        View Pipeline
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/20 dark:bg-slate-900/40 glass-panel">
          <Briefcase className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No jobs match filters</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add a new job opening to start sourcing.</p>
        </div>
      )}
    </div>
  );
}
