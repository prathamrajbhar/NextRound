'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { Sparkles, Brain, Cpu, ShieldCheck, Clock, ArrowLeftRight, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
  const [activeAudience, setActiveAudience] = useState<'companies' | 'candidates'>('companies');
  const { user } = useAuth();

  const hrHref = user ? (user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard') : '/signup?role=hr';
  const candidateHref = user ? (user.role === 'candidate' ? '/candidate/dashboard' : '/hr/dashboard') : '/signup?role=candidate';

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 text-center lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-orange-400 bg-indigo-50 dark:bg-orange-950/40 border border-indigo-100 dark:border-orange-900/50 mb-6 glass-panel">
            <Sparkles className="h-3.5 w-3.5" />
            Next-Generation Technical Recruitment
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-6xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 dark:from-slate-100 dark:via-orange-200 dark:to-slate-100 bg-clip-text">
            Intelligent Hiring. <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">Faster, Fairer, Automated.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Post job openings, conduct AI-guided voice interviews, and evaluate candidate qualifications with structured rubrics and transparent scoring.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href={hrHref}
              className="rounded-full bg-indigo-600 dark:bg-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-150 dark:shadow-orange-900/30 hover:bg-indigo-700 dark:hover:bg-orange-700 transition-all hover:scale-[1.02]"
            >
              {user ? 'Go to HR Dashboard' : 'Hire Talent (Employers)'}
            </Link>
            <Link
              href={candidateHref}
              className="rounded-full bg-white dark:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-[1.02] glass-panel"
            >
              {user ? 'Go to Candidate Dashboard' : 'Explore Roles (Candidates)'}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 mb-20 w-full">
        <div className="glass-card p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <span className="block text-4xl font-extrabold text-indigo-600 dark:text-orange-400">72 Hrs</span>
            <span className="mt-1 block text-sm font-semibold text-slate-500 dark:text-slate-400">Average Time-to-Hire</span>
          </div>
          <div className="border-y md:border-y-0 md:border-x border-slate-100 dark:border-slate-700/50 py-6 md:py-0">
            <span className="block text-4xl font-extrabold text-purple-600 dark:text-amber-400">Automated</span>
            <span className="mt-1 block text-sm font-semibold text-slate-500 dark:text-slate-400">Screening &amp; Rubric Scoring</span>
          </div>
          <div>
            <span className="block text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">Instant</span>
            <span className="mt-1 block text-sm font-semibold text-slate-500 dark:text-slate-400">Candidate Feedback</span>
          </div>
        </div>
      </section>

      {/* Audience Toggle & How it Works */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 mb-24 w-full">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            How NextRound Works
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">
            Streamlined recruitment workflows designed for both hiring teams and job seekers.
          </p>

          {/* Toggle buttons */}
          <div className="inline-flex p-1 rounded-full bg-white/35 dark:bg-slate-800/50 border border-white/60 dark:border-slate-700/60 mt-6 select-none backdrop-blur-md">
            <button
              onClick={() => setActiveAudience('companies')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeAudience === 'companies'
                  ? 'bg-indigo-500/90 dark:bg-orange-500/90 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              For Employers
            </button>
            <button
              onClick={() => setActiveAudience('candidates')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeAudience === 'candidates'
                  ? 'bg-indigo-500/90 dark:bg-orange-500/90 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              For Candidates
            </button>
          </div>
        </div>

        {/* Steps strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activeAudience === 'companies' ? (
            <>
              {/* Company Step 1 */}
              <div className="glass-card glass-card-indigo p-6 relative group">
                <span className="absolute top-4 right-4 text-3xl font-extrabold text-indigo-100 dark:text-slate-700 group-hover:text-indigo-200 dark:group-hover:text-slate-600 transition-colors">01</span>
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/50 mb-4">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Post Job &amp; Define Criteria</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Provide job requirements to automatically generate structured evaluation rubrics and technical criteria.
                </p>
              </div>
              {/* Company Step 2 */}
              <div className="glass-card glass-card-purple p-6 relative group">
                <span className="absolute top-4 right-4 text-3xl font-extrabold text-indigo-100 dark:text-slate-700 group-hover:text-indigo-200 dark:group-hover:text-slate-600 transition-colors">02</span>
                <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-orange-950/40 flex items-center justify-center text-purple-600 dark:text-orange-400 border border-purple-150 dark:border-orange-900/50 mb-4">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Automated Voice Interviews</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Candidates complete interactive voice interviews that assess skills objectively and generate live transcripts.
                </p>
              </div>
              {/* Company Step 3 */}
              <div className="glass-card glass-card-emerald p-6 relative group">
                <span className="absolute top-4 right-4 text-3xl font-extrabold text-indigo-100 dark:text-slate-700 group-hover:text-indigo-200 dark:group-hover:text-slate-600 transition-colors">03</span>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/50 mb-4">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Shortlist &amp; Make Offers</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Review standardized scorecards, audio recordings, and candidate insights to make fast, reliable hires.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Candidate Step 1 */}
              <div className="glass-card glass-card-emerald p-6 relative group">
                <span className="absolute top-4 right-4 text-3xl font-extrabold text-indigo-100 dark:text-slate-700 group-hover:text-indigo-200 dark:group-hover:text-slate-600 transition-colors">01</span>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/50 mb-4">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Build Your Profile</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Upload your resume to create a single profile used across all your role applications.
                </p>
              </div>
              {/* Candidate Step 2 */}
              <div className="glass-card glass-card-indigo p-6 relative group">
                <span className="absolute top-4 right-4 text-3xl font-extrabold text-indigo-100 dark:text-slate-700 group-hover:text-indigo-200 dark:group-hover:text-slate-600 transition-colors">02</span>
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/50 mb-4">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Practice Mock Interviews</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Hone your skills with AI mock interviews, practice question banks, and actionable feedback.
                </p>
              </div>
              {/* Candidate Step 3 */}
              <div className="glass-card glass-card-purple p-6 relative group">
                <span className="absolute top-4 right-4 text-3xl font-extrabold text-indigo-100 dark:text-slate-700 group-hover:text-indigo-200 dark:group-hover:text-slate-600 transition-colors">03</span>
                <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-orange-950/40 flex items-center justify-center text-purple-600 dark:text-orange-400 border border-purple-150 dark:border-orange-900/50 mb-4">
                  <ArrowLeftRight className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Apply &amp; Track Progress</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Apply with one click, complete flexible interviews on your schedule, and follow live application updates.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 mb-24 w-full">
        <div className="glass-card p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-indigo-600 dark:text-orange-400 uppercase tracking-widest">Enterprise Evaluation Platform</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
              Transparent candidate scoring backed by audit-ready evaluations
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Every interview assessment is logged with clear, criteria-based rationale. Evaluation algorithms normalize non-performance factors such as university origin or location, providing hiring teams with objective scorecards and candidate feedback.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Enterprise Data Privacy &amp; Organization Isolation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Proctoring &amp; Identity Verification Controls</span>
              </div>
            </div>
          </div>
          <div className="glass-card glass-card-indigo p-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Evaluation Scorecard Engine</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-orange-400 bg-indigo-50 dark:bg-orange-950/40 border border-indigo-100 dark:border-orange-900/40 px-2.5 py-0.5 rounded-full">Active</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-extrabold text-slate-705 dark:text-slate-300 mb-1">
                  <span>Technical Competency</span>
                  <span>92/100</span>
                </div>
                <div className="w-full bg-white/45 dark:bg-slate-700/40 border border-white/20 dark:border-slate-600/20 rounded-full h-2 shadow-inner p-0.5">
                  <div className="bg-indigo-500 dark:bg-orange-500 h-1 rounded-full transition-all duration-500" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-extrabold text-slate-705 dark:text-slate-300 mb-1">
                  <span>Communication &amp; Problem Solving</span>
                  <span>85/100</span>
                </div>
                <div className="w-full bg-white/45 dark:bg-slate-700/40 border border-white/20 dark:border-slate-600/20 rounded-full h-2 shadow-inner p-0.5">
                  <div className="bg-indigo-500 dark:bg-orange-500 h-1 rounded-full transition-all duration-500" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-extrabold text-slate-705 dark:text-slate-300 mb-1">
                  <span>Real-Time Analysis &amp; Decisions</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Instant Verdicts</span>
                </div>
                <div className="w-full bg-white/45 dark:bg-slate-700/40 border border-white/20 dark:border-slate-600/20 rounded-full h-2 shadow-inner p-0.5">
                  <div className="bg-emerald-500 dark:bg-emerald-400 h-1 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
