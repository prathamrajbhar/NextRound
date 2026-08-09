'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Application } from '@/types';
import { ApplicationsListSkeleton } from '@/components/ui/Skeleton';
import { Compass, Briefcase, ChevronRight } from '@/lib/lucide-google-icons';
import { getApplicationStatusBadgeClasses, formatApplicationStatus } from '@/lib/applicationStatus';

export default function CandidateApplications() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true);
        const data = await apiClient.get<Application[]>('/applications/my');
        if (data) {
          const rawApps = data as unknown;
          const appsList = Array.isArray(rawApps)
            ? rawApps
            : typeof rawApps === 'object' && rawApps !== null && 'applications' in rawApps && Array.isArray((rawApps as { applications: Application[] }).applications)
            ? (rawApps as { applications: Application[] }).applications
            : [];
          setApplications(appsList);
        }
      } catch (err) {
        console.error('Failed to fetch candidate applications:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  const safeApps = Array.isArray(applications) ? applications : [];

  if (loading) {
    return <ApplicationsListSkeleton count={5} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-sans">My Applications</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Review screening and interview stages for all positions you applied to across the platform.
        </p>
      </div>

      {safeApps.length > 0 ? (
        <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 shadow-md backdrop-blur-md glass-panel overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800 bg-white/30 dark:bg-slate-800/40 text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Position</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date Applied</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {safeApps.map((app) => (
                <tr key={app.id} className="hover:bg-white/20 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{app.jobTitle}</td>
                  <td className="px-6 py-4 text-brand-600 dark:text-orange-400 font-bold">{app.orgName}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${getApplicationStatusBadgeClasses(app.status, 'table')}`}>
                      {formatApplicationStatus(app.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 dark:text-slate-400">{app.appliedDate}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/candidate/applications/${app.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-orange-400 hover:underline transition-colors"
                    >
                      Track Application
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/20 dark:bg-slate-900/40 glass-panel">
          <Briefcase className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No applications yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">Explore the open roles board to start applying.</p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 dark:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 dark:hover:bg-orange-700 transition-all cursor-pointer"
          >
            <Compass className="h-4 w-4" />
            Browse Jobs
          </Link>
        </div>
      )}
    </div>
  );
}
