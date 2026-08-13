'use client';

import React, { useState } from 'react';
import { Brain, Cpu, ShieldCheck, User, Clock, ArrowLeftRight } from '@/lib/lucide-google-icons';

export function WorkflowSection() {
  const [activeTab, setActiveTab] = useState<'employers' | 'candidates'>('employers');

  const employerSteps = [
    {
      number: '01',
      title: 'Configure Questions',
      description: 'Set up the interview questions you want to ask, or choose from our pre-made templates.',
      icon: Brain,
      colorClass: 'text-brand-600 bg-brand-50/80 dark:text-brand-400 dark:bg-brand-950/30 border-brand-100 dark:border-brand-900/40',
    },
    {
      number: '02',
      title: 'Candidates Call',
      description: 'Candidates trigger the automated voice call on their own schedule and record their answers.',
      icon: Cpu,
      colorClass: 'text-orange-600 bg-orange-50/80 dark:text-orange-400 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/40',
    },
    {
      number: '03',
      title: 'Review Results',
      description: 'Browse automated transcripts, summaries, and objective scorecards in your HR dashboard.',
      icon: ShieldCheck,
      colorClass: 'text-emerald-650 bg-emerald-50/80 dark:text-emerald-400 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40',
    },
  ];

  const candidateSteps = [
    {
      number: '01',
      title: 'Build Profile',
      description: 'Upload your resume. The system extracts your skills and experience to build your profile.',
      icon: User,
      colorClass: 'text-emerald-650 bg-emerald-50/80 dark:text-emerald-400 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40',
    },
    {
      number: '02',
      title: 'Practice & Prepare',
      description: 'Practice with AI voice mock interviews and get detailed feedback on your performance.',
      icon: Clock,
      colorClass: 'text-brand-600 bg-brand-50/80 dark:text-brand-400 dark:bg-brand-950/30 border-brand-100 dark:border-brand-900/40',
    },
    {
      number: '03',
      title: 'Apply & Track',
      description: 'Apply to open positions, take screens on your schedule, and follow your application updates.',
      icon: ArrowLeftRight,
      colorClass: 'text-purple-600 bg-purple-50/80 dark:text-purple-400 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40',
    },
  ];

  const activeSteps = activeTab === 'employers' ? employerSteps : candidateSteps;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-24 w-full text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <span className="text-xs font-black text-brand-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
            Process Flow
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            How HireOS works
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
            A simple, automated screening process designed to save time for hiring teams and candidates alike.
          </p>
        </div>

        {}
        <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 select-none self-start md:self-auto backdrop-blur-xs">
          <button
            onClick={() => setActiveTab('employers')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'employers'
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            For Employers
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'candidates'
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            For Candidates
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeSteps.map((step) => {
          const StepIcon = step.icon;
          return (
            <div
              key={step.title}
              className="rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md shadow-xs p-6 relative group transition-all hover:scale-[1.01]"
            >
              {}
              <span className="absolute top-4 right-5 text-3xl font-black text-slate-200 dark:text-slate-800 group-hover:text-brand-100 dark:group-hover:text-slate-700 transition-colors select-none">
                {step.number}
              </span>

              {}
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center border mb-6 ${step.colorClass}`}>
                <StepIcon className="h-5 w-5" />
              </div>

              {}
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                {step.title}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
