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
      bgClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    },
    {
      title: 'System Design & Architecture',
      description: 'Practice high-level design & distributed systems',
      icon: Cpu,
      color: 'cyan',
      bgClass: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    },
    {
      title: 'HR & Behavioral Assessment',
      description: 'Practice STAR technique answers & communication',
      icon: MessageSquare,
      color: 'purple',
      bgClass: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    },
  ];

  return (
    <div className="glass-card p-6 border-slate-800/80 bg-slate-900/80 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>AI Practice Arena</span>
          </span>
          <h3 className="text-base font-extrabold text-white tracking-tight mt-0.5">
            Instant Interview Preparation
          </h3>
        </div>
        <Link
          href="/candidate/mock/new"
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
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
              className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                <div className={`h-10 w-10 rounded-xl ${track.bgClass} border flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <IconComp className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                    {track.title}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400 mt-1 leading-snug">
                    {track.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-bold text-slate-400 group-hover:text-emerald-400">
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
