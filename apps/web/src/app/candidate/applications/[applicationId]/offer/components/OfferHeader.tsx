'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Building2, FileCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { getCompanyDomain } from '@/utils/logo';

interface OfferHeaderProps {
  applicationId: string;
  jobTitle: string;
  orgName: string;
  status: string;
  totalCtc: string;
}

export function OfferHeader({
  applicationId,
  jobTitle,
  orgName,
  status,
  totalCtc,
}: OfferHeaderProps) {
  const getStatusConfig = (st: string) => {
    switch (st) {
      case 'accepted':
        return {
          label: 'Accepted & Signed',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          icon: CheckCircle2,
        };
      case 'declined':
        return {
          label: 'Offer Declined',
          badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          icon: AlertCircle,
        };
      default:
        return {
          label: 'Ready for Signature',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          icon: FileCheck,
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <header className="space-y-3">
      {}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Link href="/candidate/applications" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          Applications
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
        <Link href={`/candidate/applications/${applicationId}`} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate max-w-[180px] sm:max-w-none">
          {jobTitle}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
        <span className="text-slate-900 dark:text-slate-100 font-semibold">Offer Letter</span>
      </nav>

      {}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center shrink-0 relative overflow-hidden">
              <img
                src={`https://logo.clearbit.com/${getCompanyDomain(orgName)}`}
                alt={orgName}
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Building2 className="h-5 w-5 text-slate-400 dark:text-slate-500 absolute inset-auto -z-10" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Employment Offer Package
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.badgeClass}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {jobTitle} • <span className="font-bold text-slate-900 dark:text-white">{orgName}</span>
              </p>
            </div>
          </div>

          {}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
              Total Annual CTC
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-emerald-400">
              {totalCtc}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
