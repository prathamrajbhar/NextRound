'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, Calendar, Award, Sparkles, ArrowRight, Plus } from '@/lib/lucide-google-icons';

interface CandidateStatsCardsProps {
  totalApplications: number;
  scheduledInterviewsCount: number;
  latestMockScore: number | null;
}

export function CandidateStatsCards({
  totalApplications,
  scheduledInterviewsCount,
  latestMockScore,
}: CandidateStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: Total Applications */}
      <div className="glass-card glass-card-indigo p-5 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
            Pipeline
          </span>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-black text-white tracking-tight">{totalApplications}</span>
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Total Applications
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-400 text-[11px]">
            {totalApplications > 0 ? `${totalApplications} active job listings` : 'No active applications'}
          </span>
          <Link href="/candidate/applications" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <span>View</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Card 2: Scheduled Interviews */}
      <div className="glass-card glass-card-emerald p-5 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Calendar className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Schedule
          </span>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-black text-white tracking-tight">{scheduledInterviewsCount}</span>
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Scheduled Interviews
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-400 text-[11px]">
            {scheduledInterviewsCount > 0 ? 'Upcoming HR / AI session' : 'None scheduled yet'}
          </span>
          <Link href="/candidate/applications" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            <span>Check</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Card 3: Latest Mock Score */}
      <div className="glass-card glass-card-purple p-5 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <div className="h-11 w-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <Award className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
            AI Rating
          </span>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          {latestMockScore !== null ? (
            <div>
              <span className="text-2xl font-black text-white tracking-tight">{latestMockScore}%</span>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Latest Mock Score
              </span>
            </div>
          ) : (
            <div>
              <span className="text-sm font-extrabold text-amber-400">No mock taken</span>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Latest Mock Score
              </span>
            </div>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold">
          {latestMockScore !== null ? (
            <>
              <span className="text-slate-400 text-[11px]">Based on recent session</span>
              <Link href="/candidate/mock/history" className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                <span>History</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </>
          ) : (
            <Link
              href="/candidate/mock/new"
              className="w-full inline-flex items-center justify-center gap-1 px-3 py-1 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:bg-purple-600/50 text-[11px] font-bold transition-all"
            >
              <Plus className="h-3 w-3" />
              <span>Take 1st Mock Session</span>
            </Link>
          )}
        </div>
      </div>

      {/* Card 4: AI Readiness Score */}
      <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            Readiness
          </span>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-black text-white tracking-tight">
            {latestMockScore ? (latestMockScore >= 80 ? 'High' : 'Moderate') : 'Building'}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Interview Status
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-400 text-[11px]">Profile & AI status active</span>
          <Link href="/candidate/profile" className="text-amber-400 hover:text-amber-300 flex items-center gap-1">
            <span>Profile</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
