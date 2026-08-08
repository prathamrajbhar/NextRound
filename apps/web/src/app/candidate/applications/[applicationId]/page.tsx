'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import {
  Application,
  Job,
  Offer,
  AssessmentResult,
  AsyncScreening,
  TakeHomeProject,
  OnboardingRecord,
} from '@/types';
import {
  ChevronRight,
  Calendar,
  Video,
  Gift,
  ClipboardCheck,
  Camera,
  Code,
  UserPlus,
  Sparkles,
  ArrowRight,
} from '@/lib/lucide-google-icons';
import { ApplicationHeaderBanner } from './_components/ApplicationHeaderBanner';
import { StagePipelineTimeline } from './_components/StagePipelineTimeline';
import { CandidateScorecard } from './_components/CandidateScorecard';

export default function CandidateApplicationDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<Application | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [asyncScreening, setAsyncScreening] = useState<AsyncScreening | null>(null);
  const [takeHome, setTakeHome] = useState<TakeHomeProject | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingRecord | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [appRes, offerRes, asyncRes, takeHomeRes, onboardingRes] = await Promise.allSettled([
          apiClient.get<Application>(`/applications/${applicationId}`),
          apiClient.get<Offer>(`/candidate/applications/${applicationId}/offer`),
          apiClient.get<AsyncScreening>(`/candidate/applications/${applicationId}/video-screening`),
          apiClient.get<TakeHomeProject>(`/candidate/applications/${applicationId}/take-home`),
          apiClient.get<OnboardingRecord>(`/candidate/applications/${applicationId}/onboarding`),
        ]);

        if (appRes.status === 'fulfilled' && appRes.value) {
          setApp(appRes.value);
          const rawApp = appRes.value as Application & { assessments?: AssessmentResult[] };
          if (Array.isArray(rawApp.assessments)) {
            setAssessments(rawApp.assessments);
          }
          if (appRes.value.jobId) {
            const jRes = await apiClient.get<Job>(`/jobs/${appRes.value.jobId}`);
            if (jRes) setJob(jRes);
          }
        }
        if (offerRes.status === 'fulfilled' && offerRes.value) {
          setOffer(offerRes.value);
        }
        if (asyncRes.status === 'fulfilled' && asyncRes.value) {
          setAsyncScreening(asyncRes.value);
        }
        if (takeHomeRes.status === 'fulfilled' && takeHomeRes.value) {
          setTakeHome(takeHomeRes.value);
        }
        if (onboardingRes.status === 'fulfilled' && onboardingRes.value) {
          setOnboarding(onboardingRes.value);
        }
      } catch (err) {
        console.error('Failed to fetch application details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [applicationId]);

  if (loading) {
    return <div className="p-8 text-slate-500 font-semibold text-center animate-pulse">Loading application details...</div>;
  }

  if (!app) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Application Not Found</h2>
        <p className="text-xs text-slate-500">No application record found for ID: {applicationId}</p>
        <Link href="/candidate/applications" className="inline-block text-xs font-bold text-emerald-600 hover:underline">
          Back to Applications
        </Link>
      </div>
    );
  }

  const isScreenedDone = [
    'screening_completed',
    'assessment',
    'interview_scheduled',
    'interviewed',
    'voice_screen',
    'evaluation',
    'hr_round',
    'decided',
    'offered',
    'accepted',
    'hired',
  ].includes(app.status);

  const isAssessmentDone =
    [
      'interview_scheduled',
      'interviewed',
      'voice_screen',
      'evaluation',
      'hr_round',
      'decided',
      'offered',
      'accepted',
      'hired',
    ].includes(app.status) ||
    assessments.some((a) => a.status === 'completed');

  const isInterviewDone = [
    'interviewed',
    'voice_screen',
    'evaluation',
    'hr_round',
    'decided',
    'offered',
    'accepted',
    'hired',
  ].includes(app.status);

  const isHrRoundDone =
    app.hrRoundStatus === 'PASSED' ||
    ['decided', 'offered', 'accepted', 'hired'].includes(app.status);

  const isDecisionDone = ['decided', 'offered', 'accepted', 'hired', 'rejected'].includes(app.status);

  const stages = [
    {
      name: 'Applied',
      desc: 'Application received and resume queue matching active.',
      date: app.appliedDate,
      done: true,
    },
    {
      name: 'Screened',
      desc: 'AI Screening Agent completed parsing and qualification matching.',
      date: isScreenedDone ? app.appliedDate : '',
      done: isScreenedDone,
    },
    {
      name: 'Assessment',
      desc: 'Completed Aptitude Test & Coding Assessment module.',
      date: isAssessmentDone ? assessments[0]?.completedDate || app.appliedDate : '',
      done: isAssessmentDone,
    },
    {
      name: 'Interview',
      desc: 'Completed voice conversational session with Interviewer Agent.',
      date: isInterviewDone ? app.appliedDate : '',
      done: isInterviewDone,
    },
    {
      name: 'HR Round',
      desc: 'Live 1:1 human video call evaluation with HR representative.',
      date: isHrRoundDone
        ? app.hrRoundCompletedAt || app.hrRoundScheduledAt || app.appliedDate
        : app.hrRoundScheduledAt || '',
      done: isHrRoundDone,
    },
    {
      name: 'Decision',
      desc: 'Final structured scoring compiled. Outcome determined.',
      date: isDecisionDone ? app.appliedDate : '',
      done: isDecisionDone,
    },
  ];

  const toneClass: Record<string, string> = {
    emerald:
      'border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 hover:border-emerald-400 dark:hover:border-emerald-600',
    indigo:
      'border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 hover:border-indigo-400 dark:hover:border-indigo-600',
    purple:
      'border-purple-200/80 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 hover:border-purple-400 dark:hover:border-purple-600',
    amber:
      'border-amber-200/80 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 hover:border-amber-400 dark:hover:border-amber-600',
  };

  const badgeToneClass: Record<string, string> = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200',
    purple: 'bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200',
    amber: 'bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200',
  };

  const nextSteps = [
    offer && {
      icon: Gift,
      label: 'Review Your Offer',
      desc: `${offer.status === 'accepted' ? 'Accepted' : 'Action needed'} — ${offer.baseSalary} base salary`,
      href: `/candidate/applications/${app.id}/offer`,
      tone: 'emerald' as const,
      badge: offer.status === 'accepted' ? 'Completed' : 'Action Required',
    },
    (app.status === 'applied' || app.status === 'screening') && {
      icon: Sparkles,
      label: 'AI Resume Screening',
      desc: 'Your application has been received. AI Screening Agent is parsing qualifications.',
      href: `/candidate/applications/${app.id}`,
      tone: 'indigo' as const,
      badge: 'In Progress',
    },
    (app.status === 'screening_completed' || app.status === 'assessment') &&
      assessments.length > 0 && {
        icon: ClipboardCheck,
        label: 'Aptitude Assessment',
        desc:
          assessments[0].status === 'completed'
            ? `Completed — Score: ${assessments[0].overallScore != null ? `${assessments[0].overallScore}%` : 'Completed'}`
            : 'Continue your timed assessment',
        href: `/candidate/mock/session-${app.id}?applicationId=${app.id}&track=aptitude`,
        tone: 'indigo' as const,
        badge: assessments[0].status === 'completed' ? 'Completed' : 'Pending',
      },
    asyncScreening &&
      isScreenedDone && {
        icon: Camera,
        label: 'Video Screening',
        desc:
          asyncScreening.status === 'invited'
            ? 'Record your video responses'
            : 'View your submitted video responses',
        href: `/candidate/applications/${app.id}/video-screening`,
        tone: 'purple' as const,
        badge: asyncScreening.status === 'submitted' || asyncScreening.status === 'reviewed' ? 'Completed' : 'Invited',
      },
    takeHome &&
      isScreenedDone && {
        icon: Code,
        label: 'Take-Home Project',
        desc:
          takeHome.status === 'graded'
            ? `Graded — Score: ${takeHome.overallScore != null ? `${takeHome.overallScore}%` : 'Graded'}`
            : 'Continue your project submission',
        href: `/candidate/applications/${app.id}/take-home`,
        tone: 'amber' as const,
        badge: takeHome.status === 'graded' ? 'Graded' : 'In Progress',
      },
    onboarding &&
      isDecisionDone && {
        icon: UserPlus,
        label: 'Onboarding Checklist',
        desc: `${onboarding.progressPercent}% complete — starts ${onboarding.startDate}`,
        href: `/candidate/applications/${app.id}/onboarding`,
        tone: 'emerald' as const,
        badge: `${onboarding.progressPercent}%`,
      },
  ].filter(Boolean) as {
    icon: typeof Gift;
    label: string;
    desc: string;
    href: string;
    tone: 'emerald' | 'indigo' | 'purple' | 'amber';
    badge: string;
  }[];

  const matchPercent = app.scores?.composite;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link
            href="/candidate/applications"
            className="hover:text-brand-600 dark:hover:text-orange-400 transition-colors"
          >
            Applications
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
          <span className="text-slate-800 dark:text-slate-200 font-bold line-clamp-1">{app.jobTitle}</span>
        </div>

        <Link
          href={`/candidate/jobs/${app.jobId}`}
          className="text-xs font-bold text-brand-600 dark:text-orange-400 hover:underline flex items-center gap-1"
        >
          <span>View Original Job Listing</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Header Banner Card */}
      <ApplicationHeaderBanner app={app} jobLogo={job?.orgLogo} matchPercent={matchPercent} />

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Stage Pipeline & AI Scorecard */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stage Pipeline Timeline Card */}
          <StagePipelineTimeline stages={stages} />

          {/* AI Scorecard Breakdown (if scores exist) */}
          {app.scores && <CandidateScorecard scores={app.scores} />}
        </div>

        {/* Right Column: Decision Action Panel & Next Steps */}
        <div className="space-y-6">
          {/* Offer Released Banner (if decided) */}
          {app.status === 'decided' && (
            <div className="relative overflow-hidden rounded-3xl border border-emerald-200 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50/60 via-emerald-50/30 to-teal-50/40 dark:from-emerald-950/50 dark:via-emerald-900/30 dark:to-teal-950/40 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold">
                  <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-display">Offer Released!</span>
                </div>
                {offer && (
                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/80 px-2.5 py-1 rounded-lg">
                    {offer.baseSalary}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Congratulations! The hiring decision team has compiled your evaluation and extended an official offer.
              </p>

              <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-200 italic font-medium shadow-2xs">
                &ldquo;{app.reasoning || 'Candidate completed evaluation rounds and qualification criteria.'}&rdquo;
              </div>

              {offer && (
                <Link
                  href={`/candidate/applications/${app.id}/offer`}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-extrabold py-3 text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <span>Review & Sign Offer</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}

          {/* Interview Scheduled Status Box */}
          {app.status === 'interview_scheduled' && (
            <div className="rounded-3xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/40 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-display">Interview Scheduled</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Your AI Voice Interview session is confirmed for{' '}
                <span className="text-slate-900 dark:text-slate-100 font-bold">{app.confirmedSlot || app.interviewScheduledAt || 'Scheduled'}</span>.
              </p>
              <Link
                href={`/interview/${app.id}`}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3 text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Video className="h-4 w-4" />
                <span>Join Live Interview Room</span>
              </Link>
            </div>
          )}

          {/* Human HR Round Status Box */}
          {(app.status === 'hr_round' || app.stage === 'HR Round') && (
            <div className="rounded-3xl border border-brand-200 dark:border-orange-800/80 bg-brand-50/50 dark:bg-orange-950/40 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
              <div className="flex items-center gap-2 text-brand-700 dark:text-orange-300 font-extrabold">
                <Video className="h-5 w-5 text-brand-600 dark:text-orange-400" />
                <span className="text-sm font-display">Human HR Round Ready</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Congratulations! You passed all automated AI vetting rounds. Your live 1:1 video call with HR is ready.
              </p>
              <Link
                href={`/candidate/hr-round/${app.id}`}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3 text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Video className="h-4 w-4" />
                <span>Enter HR Round Room</span>
              </Link>
            </div>
          )}

          {/* Next Steps Items List */}
          {nextSteps.length > 0 && (
            <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-md glass-panel space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display border-b border-slate-200/60 dark:border-slate-800 pb-3">
                Next Steps
              </h3>

              <div className="space-y-3">
                {nextSteps.map((step) => (
                  <Link
                    key={step.href}
                    href={step.href}
                    className={`group flex items-center gap-3.5 rounded-2xl border p-4 transition-all duration-200 ${toneClass[step.tone]}`}
                  >
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 flex-shrink-0 shadow-2xs">
                      <step.icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-orange-400 transition-colors">
                          {step.label}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeToneClass[step.tone]}`}>
                          {step.badge}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mt-1 line-clamp-1">
                        {step.desc}
                      </span>
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* AI Practice Promo Card */}
          <div className="rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 p-6 shadow-sm backdrop-blur-md glass-panel space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold">
              <Sparkles className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-display">Practice Before Your Interview</h3>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Prepare using interactive voice interview models tailored for {app.orgName}&apos;s evaluation criteria.
            </p>
            <Link
              href={`/candidate/mock/new?company=${encodeURIComponent(app.orgName)}&role=${encodeURIComponent(app.jobTitle)}`}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-600 dark:text-orange-400 hover:underline pt-1 cursor-pointer"
            >
              <span>Start Mock Simulation</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

