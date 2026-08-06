'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mic,
  ArrowRight,
  Sparkles,
  Building2,
  Star,
  Trophy,
  User,
  Sliders,
  Award,
  Layers,
  ShieldCheck,
  Terminal,
  Target,
  CheckCircle2,
} from '@/lib/lucide-google-icons';
import { SUGGESTED_COMPANIES, SUGGESTED_ROLES } from '@/lib/constants';
import CalibrationPanel, { AssessmentTrack } from './components/CalibrationPanel';
import { Autocomplete, CompanyLogo } from '@/components/ui';
import { apiClient } from '@/lib/apiClient';

function MockInterviewSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [company, setCompany] = useState(searchParams.get('company') || 'Google');
  const [role, setRole] = useState(searchParams.get('role') || 'Software Engineer');
  const initialTrack = (searchParams.get('track') as AssessmentTrack) || 'comprehensive';
  const [track, setTrack] = useState<AssessmentTrack>(initialTrack);
  const [difficulty, setDifficulty] = useState<'junior' | 'mid' | 'senior'>('mid');
  const [loading, setLoading] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Hardware states
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [micLevel, setMicLevel] = useState(45);
  const [consent, setConsent] = useState(true);

  useEffect(() => {
    if (!micActive) {
      setTimeout(() => setMicLevel(0), 0);
      return;
    }
    const interval = setInterval(() => {
      setMicLevel(Math.floor(Math.random() * 35) + 30);
    }, 150);
    return () => clearInterval(interval);
  }, [micActive]);

  useEffect(() => {
    if (!isCalibrating) return;
    const t = setTimeout(() => setIsCalibrating(false), 350);
    return () => clearTimeout(t);
  }, [isCalibrating]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setLoading(true);
    try {
      const res = await apiClient.post<{ sessionId: string }>('/mock/sessions', {
        topic: track === 'coding' ? 'Data Structures & Algorithms' : track === 'aptitude' ? 'Behavioral & STAR Method' : 'System Design & Architecture',
        targetCompany: company,
        targetRole: role,
        difficulty,
        focusAreas: [track],
      });
      if (res?.sessionId) {
        router.push(`/candidate/mock/${res.sessionId}`);
      } else {
        router.push(`/candidate/mock/mock-session-123`);
      }
    } catch (err) {
      console.error('Failed to create mock session:', err);
      router.push(`/candidate/mock/mock-session-123`);
    } finally {
      setLoading(false);
    }
  };

  const tracks = [
    {
      key: 'comprehensive' as const,
      label: 'Full Mock Interview',
      badge: 'ALL-IN-ONE ROUND',
      featured: true,
      sub: 'End-to-end hiring simulation covering Aptitude, Live Coding & Technical Voice AI.',
      icon: Trophy,
    },
    {
      key: 'aptitude' as const,
      label: 'Aptitude & Reasoning',
      badge: 'Math & Logic',
      featured: false,
      sub: 'Quantitative puzzles, series logic, and analytical problem solving.',
      icon: Target,
    },
    {
      key: 'coding' as const,
      label: 'Live Coding Round',
      badge: 'Hands-on Code',
      featured: false,
      sub: 'Algorithmic challenges, data structures & time complexity.',
      icon: Terminal,
    },
    {
      key: 'technical' as const,
      label: 'Technical Voice AI',
      badge: 'Voice AI Vetting',
      featured: false,
      sub: 'Conversational voice AI covering architecture, stack & system design.',
      icon: Sparkles,
    },
  ];

  const difficulties = [
    { key: 'junior' as const, label: 'Junior', sub: '0 - 2 yrs', icon: User },
    { key: 'mid' as const, label: 'Mid Level', sub: '2 - 5 yrs', icon: Star },
    { key: 'senior' as const, label: 'Senior', sub: '5+ yrs', icon: Trophy },
  ];

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Full-Width Header Bar */}
      <div className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/70 via-white/50 to-slate-50/50 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-950/80 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider text-brand-700 dark:text-orange-300 bg-brand-50 dark:bg-orange-950/60 border border-brand-200/60 dark:border-orange-900/60 uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5 text-brand-600 dark:text-orange-400" /> AI Practice Arena
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Setup Practice Interview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Choose your assessment round, target company parameters, and verify hardware devices before launching.
          </p>
        </div>

        {/* Header Readiness Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>AI Model: <strong className="text-emerald-600 dark:text-emerald-400">Ready</strong></span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300 shadow-2xs">
            <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Latest Practice: <strong className="text-amber-700 dark:text-amber-200">85% Score</strong></span>
          </div>
        </div>
      </div>

      <form onSubmit={handleStart} className="space-y-6">
        {/* Balanced 50/50 Widescreen 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Column: Form Configuration Card */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel flex flex-col justify-between space-y-6 !overflow-visible">
            <div className="space-y-6">
              {/* Target Role Section */}
              <div className="space-y-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2 font-display">
                  <Building2 className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
                  Target Role
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Target Company
                    </label>
                    <div className="flex items-center gap-2">
                      <CompanyLogo name={company} size="md" className="shadow-2xs flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Autocomplete
                          required
                          options={SUGGESTED_COMPANIES}
                          value={company}
                          onChange={(val) => {
                            setCompany(val);
                            setIsCalibrating(true);
                          }}
                          placeholder="e.g. Google, Swiggy..."
                          className="text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Target Job Title
                    </label>
                    <Autocomplete
                      required
                      options={SUGGESTED_ROLES}
                      value={role}
                      onChange={(val) => setRole(val)}
                      placeholder="e.g. Software Engineer..."
                      className="text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Assessment Round Selector (4 Core Options) */}
              <div className="space-y-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2 font-display">
                    <Layers className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
                    Select Assessment Round
                  </h3>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-brand-50 dark:bg-orange-950/60 text-brand-700 dark:text-orange-300 uppercase">
                    4 Rounds Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tracks.map((t) => {
                    const Icon = t.icon;
                    const isSelected = track === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          setTrack(t.key);
                          setIsCalibrating(true);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                          t.featured ? 'sm:col-span-2' : ''
                        } ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/10 dark:bg-orange-950/50 text-slate-900 dark:text-slate-100 shadow-2xs scale-[1.01]'
                            : 'border-slate-200/80 dark:border-slate-700/80 bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`h-4 w-4 ${
                                isSelected ? 'text-brand-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'
                              }`}
                            />
                            <span className="text-xs font-extrabold font-display">{t.label}</span>
                            {t.featured && (
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 uppercase">
                                {t.badge}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-orange-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                          {t.sub}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vetting Settings Section */}
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2 font-display">
                  <Sliders className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
                  Seniority Level
                </h3>

                <div className="grid grid-cols-3 gap-2.5">
                  {difficulties.map((d) => {
                    const Icon = d.icon;
                    const isSelected = difficulty === d.key;
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setDifficulty(d.key)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/10 dark:bg-orange-950/50 text-brand-700 dark:text-orange-300 shadow-2xs scale-[1.02]'
                            : 'border-slate-200/80 dark:border-slate-700/80 bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon
                          className={`h-4.5 w-4.5 mb-1 ${
                            isSelected ? 'text-brand-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        />
                        <span className="text-xs font-extrabold block">{d.label}</span>
                        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 block mt-0.5">
                          {d.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Launch Console Footer */}
            <div className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-600 cursor-pointer h-4 w-4"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                  I agree to microphone audio and eye-gaze analysis during the practice session.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !consent}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold py-3.5 px-8 text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer whitespace-nowrap hover:scale-[1.01] active:scale-[0.99]"
              >
                <Mic className="h-4.5 w-4.5" />
                <span>{loading ? 'Launching Session...' : `Start ${tracks.find(t=>t.key===track)?.label}`}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Calibration & Hardware Console */}
          <CalibrationPanel
            company={company}
            role={role}
            track={track}
            micActive={micActive}
            camActive={camActive}
            micLevel={micLevel}
            isCalibrating={isCalibrating}
            onToggleMic={() => setMicActive(!micActive)}
            onToggleCam={() => setCamActive(!camActive)}
          />
        </div>
      </form>
    </div>
  );
}

export default function MockInterviewSetup() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 p-8">
          Loading setup parameters...
        </div>
      }
    >
      <MockInterviewSetupForm />
    </Suspense>
  );
}
