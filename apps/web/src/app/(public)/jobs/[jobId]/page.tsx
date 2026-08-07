'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { apiClient } from '@/lib/apiClient';
import { Job } from '@/types';
import { CompanyLogo } from '@/components/ui';
import {
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
  ShieldAlert,
  Award,
  ChevronRight,
  Check,
  Building2,
  CheckCircle2,
  Layers,
  ArrowRight,
} from '@/lib/lucide-google-icons';

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchJobData() {
      try {
        setLoading(true);
        const res = await apiClient.get<Job>(`/jobs/${jobId}`);
        if (res) {
          setJob(res);
        } else {
          setNotFound(true);
        }

        const allJobs = await apiClient.get<Job[]>('/jobs');
        if (allJobs) {
          setSimilarJobs(allJobs.filter((j) => j.id !== jobId).slice(0, 2));
        }
      } catch (err) {
        console.error('Failed to load job details:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchJobData();
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PublicNavbar />
        <main className="flex-1 flex items-center justify-center text-xs font-bold text-slate-400">
          Loading job details...
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="flex flex-col min-h-screen">
        <PublicNavbar />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm w-full text-center space-y-3">
            <h1 className="text-lg font-extrabold text-slate-900 font-display">Job Not Found</h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              This job posting is no longer available.
            </p>
            <Link
              href="/jobs"
              className="inline-block mt-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all cursor-pointer"
            >
              Browse Jobs
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full animate-in fade-in duration-200">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/jobs" className="hover:text-indigo-600 transition-colors">
            Browse Jobs
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="text-slate-800 font-bold line-clamp-1">{job.title}</span>
        </div>

        {/* Hero Job Header Card */}
        <div className="mb-8 relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/70 via-white/50 to-slate-50/50 p-6 md:p-8 shadow-md backdrop-blur-md glass-panel">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              {/* Redesigned Company Logo Component */}
              <CompanyLogo name={job.orgName} logoUrl={job.orgLogo} size="xl" className="shadow-md flex-shrink-0" />

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                    {job.orgName}
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
                  </span>
                  <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase">
                    Active Hiring
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-display leading-tight">
                  {job.title}
                </h1>

                {/* Header metadata chips */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {job.location}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <DollarSign className="h-3.5 w-3.5" />
                    {job.salary}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    {job.experienceLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-shrink-0">
              <Link
                href={`/signup?role=candidate&jobId=${job.id}`}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 px-8 py-3 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Apply to this Role</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Tech Skills Pills */}
          <div className="mt-6 pt-5 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Layers className="h-3 w-3" /> Tech Stack:
            </span>
            <span className="text-xs font-semibold text-slate-400 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/60">
              Not specified
            </span>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Description */}
            <div className="rounded-3xl border border-white/60 bg-white/40 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                  <Building2 className="h-4.5 w-4.5 text-indigo-600" />
                  About the Role
                </h2>
                <span className="text-xs font-semibold text-slate-400">
                  Posted on {job.postedDate}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {job.description}
              </p>

              <div className="pt-2">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                  Core Responsibilities
                </h3>
                <div className="space-y-2.5">
                  {[
                    'Design, deploy, and benchmark core features and architectural specifications.',
                    'Write production-grade, maintainable code with strict TypeScript compilers and unit coverage.',
                    'Collaborate with UI/UX designers to build high-performance, accessible dashboard layouts.',
                    'Integrate robust error boundaries, structured monitoring, and telemetry middleware.',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-xs text-slate-600 leading-relaxed font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rubric: What We Look For */}
            <div className="rounded-3xl border border-white/60 bg-white/40 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-base font-extrabold text-slate-900 font-display">What We Look For</h2>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                  AI Evaluation Rubric
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Our Evaluation Agent evaluates candidate qualifications along 4 core dimensions matching this rubric structure:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      Technical Knowledge
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">{job.rubric.technical}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${job.rubric.technical}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                      Communication Skill
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">{job.rubric.communication}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-purple-500" style={{ width: `${job.rubric.communication}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-pink-600 uppercase tracking-wider">
                      Problem Solving
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">{job.rubric.problemSolving}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-pink-500" style={{ width: `${job.rubric.problemSolving}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      Relevant Experience
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">{job.rubric.experience}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${job.rubric.experience}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Metadata Card */}
            <div className="rounded-3xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-md glass-panel space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 font-display">
                Role Overview
              </h3>
              <div className="space-y-3.5 text-xs font-semibold">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Location</span>
                    <span className="text-slate-800">{job.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Yearly Salary</span>
                    <span className="text-slate-800">{job.salary}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Experience</span>
                    <span className="text-slate-800">{job.experienceLevel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Posted Date</span>
                    <span className="text-slate-800">{job.postedDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Screening Warning */}
            <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm glass-panel flex gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">AI Screening Active</span>
                <span className="text-[10px] text-slate-600 leading-relaxed block mt-0.5">
                  Applications trigger real-time AI evaluation and interview screening. Ensure your microphone is functional.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Roles */}
        {similarJobs.length > 0 && (
          <div className="border-t border-slate-200 pt-10">
            <h2 className="text-base font-extrabold text-slate-900 mb-6 font-display">Similar Roles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {similarJobs.map((sj) => (
                <Link
                  key={sj.id}
                  href={`/jobs/${sj.id}`}
                  className="rounded-2xl border border-white/60 bg-white/40 p-4 shadow-sm hover:shadow-md transition-all glass-panel glass-panel-hover flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <CompanyLogo name={sj.orgName} logoUrl={sj.orgLogo} size="sm" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{sj.title}</h4>
                      <span className="text-[10px] font-bold text-indigo-600">{sj.orgName}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{sj.location}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
