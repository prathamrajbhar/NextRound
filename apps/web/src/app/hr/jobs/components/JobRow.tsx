'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Trash2, Loader2 } from '@/lib/lucide-google-icons';
import { getJobStatusBadgeClasses } from '@/lib/jobStatus';
import { Job } from '@/types';

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface JobRowProps {
  job: Job;
  isUpdating: boolean;
  onStatusChange: (jobId: string, status: 'active' | 'draft' | 'closed') => void;
  onDelete: (jobId: string) => void;
}

export function JobRow({ job, isUpdating, onStatusChange, onDelete }: JobRowProps) {
  const currentStatus = (job.status === 'published' ? 'active' : job.status) as
    | 'active'
    | 'draft'
    | 'closed';

  return (
    <tr className="hover:bg-white/20 dark:hover:bg-slate-800/40 transition-colors">
      <td className="px-6 py-4">
        <span className="font-bold text-slate-800 dark:text-slate-100 block">{job.title}</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-0.5">
          {job.location} • {job.salary}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <select
            disabled={isUpdating}
            value={currentStatus}
            onChange={(e) =>
              onStatusChange(job.id, e.target.value as 'active' | 'draft' | 'closed')
            }
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase cursor-pointer focus:outline-none transition-all ${getJobStatusBadgeClasses(
              currentStatus,
              'select'
            )}`}
          >
            <option value="active" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold">
              Active
            </option>
            <option value="draft" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold">
              Draft
            </option>
            <option value="closed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold">
              Closed
            </option>
          </select>
          {isUpdating && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600 dark:text-orange-400" />
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-bold">
        {job.applicantsCount || 0} candidates
      </td>
      <td className="px-6 py-4 text-slate-400 dark:text-slate-400 font-bold">
        {formatDate(job.postedDate)}
      </td>
      <td className="px-6 py-4 text-right space-x-3">
        <Link
          href={`/hr/jobs/${job.id}/edit`}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold cursor-pointer"
        >
          Edit Job
        </Link>
        <Link
          href={`/hr/jobs/${job.id}/pipeline`}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-orange-400 hover:underline transition-colors cursor-pointer"
        >
          View Candidates
          <ChevronRight className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => onDelete(job.id)}
          disabled={isUpdating}
          title="Delete Job"
          className="text-xs text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-bold cursor-pointer inline-flex items-center gap-1 p-1 rounded-md hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}
