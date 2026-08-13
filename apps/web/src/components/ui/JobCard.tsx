'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { CompanyLogo } from './CompanyLogo';
import { Badge } from './Badge';
import { getJobStatusBadgeClasses } from '@/lib/jobStatus';
import { MapPin, IndianRupee, Briefcase, CheckCircle2, Clock, Users, ArrowUpRight } from '@/lib/lucide-google-icons';

export interface JobCardProps {
  id: string;
  orgName: string;
  orgLogo?: string;
  title: string;
  description: string;
  location: string;
  salary: string;
  experienceLevel: string;
  postedDate: string;
  applicantsCount?: number;
  status?: 'active' | 'draft' | 'closed' | string;
  matchScore?: number;
  hasApplied?: boolean;
  viewHref?: string;
  applyHref?: string;
  className?: string;
  compact?: boolean;
}


function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, '')       
    .replace(/\*\*(.+?)\*\*/g, '$1') 
    .replace(/\*(.+?)\*/g, '$1')     
    .replace(/^[*\-]\s+/gm, '')      
    .replace(/`(.+?)`/g, '$1')       
    .replace(/\n+/g, ' ')            
    .trim();
}

export function JobCard({
  id,
  orgName,
  orgLogo,
  title,
  description,
  location,
  salary,
  experienceLevel,
  postedDate,
  applicantsCount,
  status = 'active',
  matchScore,
  hasApplied = false,
  viewHref,
  applyHref,
  className,
  compact = false,
}: JobCardProps) {
  const detailsUrl = viewHref || `/candidate/jobs/${id}`;
  const applyUrl = applyHref || `/signup?role=candidate&jobId=${id}`;

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl border transition-all duration-300',
        'bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800',
        'hover:border-brand-500/40 dark:hover:border-orange-500/40 hover:shadow-lg dark:hover:shadow-slate-950/50',
        'backdrop-blur-md glass-panel glass-panel-hover',
        compact ? 'p-4 gap-3' : 'p-5 sm:p-6 gap-5',
        className
      )}
    >
      {}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {}
            <CompanyLogo name={orgName} logoUrl={orgLogo} size={compact ? 'sm' : 'md'} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate flex items-center gap-1">
                  {orgName}
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10 inline-block flex-shrink-0" />
                </span>

                {hasApplied && (
                  <Badge intent="indigo" size="xs">
                    Applied
                  </Badge>
                )}
              </div>

              <Link
                href={detailsUrl}
                className="group-hover:text-brand-600 dark:group-hover:text-orange-400 transition-colors block"
              >
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-sm sm:text-base leading-snug truncate mt-0.5 font-display">
                  {title}
                </h3>
              </Link>
            </div>
          </div>

          {}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {matchScore !== undefined && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                {matchScore}% Match
              </span>
            )}
            
            <span
              className={cn(
                'text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border',
                getJobStatusBadgeClasses(status, 'card')
              )}
            >
              {status}
            </span>
          </div>
        </div>

        {}
        <p
          className={cn(
            'text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal mt-3.5',
            compact ? 'line-clamp-2' : 'line-clamp-3'
          )}
        >
          {stripMarkdown(description)}
        </p>

        {}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3.5">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <span>{location}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <IndianRupee className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <span>{salary}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <Briefcase className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <span>{experienceLevel}</span>
          </div>
        </div>
      </div>

      {}
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-1">
        <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {postedDate}
          </span>
          {applicantsCount !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {applicantsCount} applicants
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={detailsUrl}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-orange-400 transition-colors border border-slate-200/90 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 px-3.5 py-1.5 rounded-full shadow-2xs hover:border-slate-300 dark:hover:border-slate-600"
          >
            Details
          </Link>

          {!hasApplied && applyUrl && (
            <Link
              href={applyUrl}
              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 px-3.5 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all group/btn"
            >
              <span>Apply</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
