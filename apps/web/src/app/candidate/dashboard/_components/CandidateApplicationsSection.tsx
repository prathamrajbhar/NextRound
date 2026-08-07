'use client';

import React from 'react';
import Link from 'next/link';
import { Application } from '@/types';
import { Briefcase, ArrowRight, Sparkles, Search, CheckCircle2, Mic, Building2 } from '@/lib/lucide-google-icons';

interface CandidateApplicationsSectionProps {
  applications: Application[];
}

export function CandidateApplicationsSection({ applications }: CandidateApplicationsSectionProps) {
  const safeApps = Array.isArray(applications) ? applications : [];

  if (safeApps.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-400" />
            <span>Active Applications</span>
          </h2>
        </div>

        {/* Top-Grade Modern Glassmorphic Empty State Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/90 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-xl">
          {/* Ambient Glowing Orbs */}
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
            {/* Multi-ring Glowing Hero Icon */}
            <div className="relative mb-6">
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-emerald-500/30 to-indigo-500/30 blur-md opacity-75 animate-pulse" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-slate-800 to-indigo-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-xl">
                <Briefcase className="h-8 w-8" />
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              No Active Applications Yet
            </h3>

            <p className="text-xs sm:text-sm font-medium text-slate-400 mt-2.5 leading-relaxed max-w-md">
              Start your job search today or take an AI practice session to sharpen your interview readiness and get matched with top hiring teams!
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-6 w-full sm:w-auto">
              <Link
                href="/candidate/jobs"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-emerald-400/20"
              >
                <Search className="h-4 w-4" />
                <span>Explore Open Jobs</span>
              </Link>
              <Link
                href="/candidate/mock/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-5 py-3 text-xs font-bold text-slate-200 shadow-md hover:border-slate-600 transition-all cursor-pointer"
              >
                <Mic className="h-4 w-4 text-purple-400" />
                <span>Try AI Practice Round</span>
              </Link>
            </div>

            {/* 3-Step Candidate Roadmap Stepper */}
            <div className="mt-9 pt-7 border-t border-slate-800/80 w-full text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>3 Steps to Get Hired</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Quick Start Guide
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center border border-emerald-500/30">
                      01
                    </span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-100">Complete Profile</h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-snug">Add skills, target role & resume</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="h-6 w-6 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-black flex items-center justify-center border border-purple-500/30">
                      02
                    </span>
                    <Mic className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-100">Practice Mock</h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-snug">Get instant AI score & feedback</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="h-6 w-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center border border-indigo-500/30">
                      03
                    </span>
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-100">Apply to Jobs</h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-snug">1-click AI match submission</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-emerald-400" />
          <span>Active Applications</span>
        </h2>
        <Link
          href="/candidate/applications"
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
        >
          <span>View all ({safeApps.length})</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-4">
        {safeApps.map((app) => (
          <div
            key={app.id}
            className="glass-card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700/80 transition-all"
          >
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 font-bold shrink-0">
                <Building2 className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">{app.jobTitle}</h3>
                <span className="text-xs font-semibold text-slate-400 block mt-0.5">{app.orgName}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">Applied on {app.appliedDate}</span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2.5 w-full sm:w-auto">
              <span
                className={`self-start sm:self-auto text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                  app.status === 'decided'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : app.status === 'interview_scheduled'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                }`}
              >
                {app.status.replace('_', ' ')}
              </span>

              <Link
                href={`/candidate/applications/${app.id}`}
                className="inline-flex items-center justify-center gap-1.5 text-center text-xs font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
              >
                <span>View Details</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
