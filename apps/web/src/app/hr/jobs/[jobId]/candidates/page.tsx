'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Job, Application } from '@/types';
import { ChevronRight, Search, Users } from '@/lib/lucide-google-icons';
import Image from 'next/image';
import { getApplicationStatusBadgeClasses, formatApplicationStatus } from '@/lib/applicationStatus';
import { TableSkeleton, PageHeaderSkeleton, Skeleton } from '@/components/ui';

export default function HrJobCandidatesList({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [jobApps, setJobApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [jobRes, appsRes] = await Promise.allSettled([
          apiClient.get<Job>(`/jobs/${jobId}`),
          apiClient.get<Application[]>(`/jobs/${jobId}/applications`).catch(() =>
            apiClient.get<Application[]>(`/applications?jobId=${jobId}`)
          ),
        ]);

        if (jobRes.status === 'fulfilled' && jobRes.value) {
          setJob(jobRes.value);
        }
        if (appsRes.status === 'fulfilled' && appsRes.value) {
          setJobApps(appsRes.value);
        }
      } catch (err) {
        console.error('Failed to load candidate list:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [jobId]);

  const filteredApps = jobApps.filter(
    (app) =>
      app.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      app.candidateEmail.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <Skeleton className="h-4 w-56 rounded" />
        <PageHeaderSkeleton />
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Link href="/hr/jobs" className="hover:text-purple-600 transition-colors">Jobs</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <Link href={`/hr/jobs/${job?.id || jobId}/pipeline`} className="hover:text-purple-600 transition-colors">
          {job?.title || 'Job Pipeline'}
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <span className="text-slate-800">Candidates</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Vetted Candidates</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Compare composite vetting profiles and inspect audit details.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
          />
        </div>
      </div>

      {filteredApps.length > 0 ? (
        <div className="rounded-3xl border border-white/60 bg-white/45 shadow-md backdrop-blur-md glass-panel overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-white/30 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Scores</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-white/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <Image src={app.candidateAvatar} alt={app.candidateName} width={32} height={32} className="h-8 w-8 rounded-full border border-purple-100" unoptimized />
                      <div>
                        <span className="font-bold text-slate-800 block">{app.candidateName}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{app.candidateEmail}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getApplicationStatusBadgeClasses(app.status, 'hr')}`}>
                      {formatApplicationStatus(app.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {app.scores ? (
                      <span className="text-emerald-600 font-extrabold">{app.scores.composite}% composite</span>
                    ) : (
                      <span className="text-slate-400 font-semibold italic">Screening in progress</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/hr/candidates/${app.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors cursor-pointer"
                    >
                      Inspect Scores
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-350 bg-white/20 glass-panel">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No candidates in pipeline yet</h3>
          <p className="text-xs text-slate-500 mt-1">Sourcing agents will dispatch applicants shortly.</p>
        </div>
      )}
    </div>
  );
}
