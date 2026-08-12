'use client';

import React from 'react';
import Link from 'next/link';
import { Mic, Code, Cpu, MessageSquare, ArrowUpRight, Sparkles } from '@/lib/lucide-google-icons';

export function CandidateQuickPrepHub() {
  const prepTracks = [
    {
      title: 'Full Stack Coding Round',
      description: 'Practice DS & Algorithms with AI live evaluation',
      icon: Code,
      color: 'emerald',
      bgClass: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-250 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'System Design & Architecture',
      description: 'Practice high-level design & distributed systems',
      icon: Cpu,
      color: 'cyan',
      bgClass: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-250 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    },
    {
      title: 'HR & Behavioral Assessment',
      description: 'Practice STAR technique answers & communication',
      icon: MessageSquare,
      color: 'purple',
      bgClass: 'bg-purple-50 dark:bg-purple-500/10 border-purple-250 dark:border-purple-500/20 text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="glass-card p-6 border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>AI Practice Arena</span>
          </span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Instant Interview Preparation
          </h3>
        </div>
        <Link
          href="/candidate/mock/new"
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 inline-flex items-center gap-1"
        >
          <span>Launch AI Mock</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {prepTracks.map((track) => {
          const IconComp = track.icon;
          return (
            <Link
              key={track.title}
              href="/candidate/mock/new"
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-700/60 hover:border-slate-350 dark:hover:border-slate-600 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                <div className={`h-10 w-10 rounded-xl ${track.bgClass} border flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <IconComp className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {track.title}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-300 mt-1 leading-snug">
                    {track.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                <span>Start Practice</span>
                <Mic className="h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
