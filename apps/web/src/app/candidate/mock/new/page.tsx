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
import CalibrationPanel, { AssessmentTrack } from './components/CalibrationPanel';
import { CompanyLogo, SearchableSelect } from '@/components/ui';
import type { SearchableSelectOption } from '@/components/ui';
import { apiClient } from '@/lib/apiClient';
import { deriveJobOptions, normalizeJobs } from '@/lib/jobOptions';
import type { Job } from '@/types';

function MockInterviewSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCompany = searchParams.get('company');
  const initialRole = searchParams.get('role');
  const [company, setCompany] = useState(initialCompany || '');
  const [role, setRole] = useState(initialRole || '');
  const initialTrack = (searchParams.get('track') as AssessmentTrack) || 'comprehensive';
  const [track, setTrack] = useState<AssessmentTrack>(initialTrack);
  const [difficulty, setDifficulty] = useState<'junior' | 'mid' | 'senior'>('mid');
  const [loading, setLoading] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Posted-job picker state (sourced live from GET /jobs)
  const [orgId, setOrgId] = useState<string | null>(null);
  const [companyOptions, setCompanyOptions] = useState<SearchableSelectOption[]>([]);
  const [rolesByOrgId, setRolesByOrgId] = useState<Record<string, string[]>>({});
  const [postedLoading, setPostedLoading] = useState(true);
  const [postedError, setPostedError] = useState<string | null>(null);

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
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let rafId: number | null = null;
    let localStream: MediaStream | null = null;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        localStream = stream;
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setMicLevel(Math.floor((average / 255) * 100));
          rafId = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      })
      .catch((err) => {
        // NotAllowedError / NotFoundError are expected when mic is denied or absent
        // — silently reset the level bar, do not surface to the Next.js dev overlay
        const name = err instanceof DOMException ? err.name : '';
        if (!['NotAllowedError', 'NotFoundError', 'AbortError'].includes(name)) {
          console.error('Microphone access failed:', err);
        }
        setMicLevel(0);
      });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (microphone) microphone.disconnect();
      if (audioContext) audioContext.close();
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [micActive]);

  useEffect(() => {
    if (!isCalibrating) return;
    const t = setTimeout(() => setIsCalibrating(false), 350);
    return () => clearTimeout(t);
  }, [isCalibrating]);

  // Load real posted companies/positions; reconcile any URL deep-link with posted values.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const jobs = normalizeJobs(await apiClient.get<Job[]>('/jobs'));
        if (cancelled) return;
        const { companies, rolesByOrgId: roles } = deriveJobOptions(jobs);
        setCompanyOptions(companies);
        setRolesByOrgId(roles);
        if (companies.length === 0) {
          setOrgId(null);
          setCompany('');
          setRole('');
          return;
        }
        const matchedCompany =
          companies.find((c) => c.label.toLowerCase() === (initialCompany || '').toLowerCase()) ||
          companies[0];
        const orgRoles = roles[matchedCompany.value] || [];
        const matchedRole =
          orgRoles.find((r) => r.toLowerCase() === (initialRole || '').toLowerCase()) ||
          orgRoles[0] ||
          '';
        setOrgId(matchedCompany.value);
        setCompany(matchedCompany.label);
        setRole(matchedRole);
      } catch {
        if (!cancelled) setPostedError('Could not load posted roles.');
      } finally {
        if (!cancelled) setPostedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialCompany, initialRole]);

  const handleCompanySelect = (opt: SearchableSelectOption) => {
    setCompany(opt.label);
    setOrgId(opt.value);
    setRole((rolesByOrgId[opt.value] || [])[0] || '');
    setIsCalibrating(true);
  };
  const handleRoleSelect = (opt: SearchableSelectOption) => setRole(opt.label);

  const roleOptions: SearchableSelectOption[] = orgId
    ? (rolesByOrgId[orgId] || []).map((r) => ({ value: r, label: r }))
    : [];
  const selectedCompany = companyOptions.find((c) => c.value === orgId) || null;
  const selectedRole = roleOptions.find((r) => r.value === role) || null;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent || !orgId || !role) return;
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
        router.push(
          `/candidate/mock/${res.sessionId}?track=${track}&company=${encodeURIComponent(company)}&role=${encodeURIComponent(role)}&difficulty=${difficulty}`
        );
      }
    } catch (err) {
      console.error('Failed to create mock session:', err);
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
      badge: 'MATH & LOGIC',
      featured: false,
      sub: 'Quantitative puzzles, series logic, and analytical problem solving.',
      icon: Target,
    },
    {
      key: 'coding' as const,
      label: 'Live Coding Round',
      badge: 'HANDS-ON CODE',
      featured: false,
      sub: 'Algorithmic challenges, data structures & time complexity.',
      icon: Terminal,
    },
    {
      key: 'technical' as const,
      label: 'Technical Voice AI',
      badge: 'VOICE AI VETTING',
      featured: false,
      sub: 'Conversational voice AI covering architecture, stack & system design.',
      icon: Sparkles,
    },
  ];

  const difficulties = [
    { key: 'junior' as const, label: 'Junior', sub: '0 - 2 Yrs', icon: User },
    { key: 'mid' as const, label: 'Mid Level', sub: '2 - 5 Yrs', icon: Star },
    { key: 'senior' as const, label: 'Senior', sub: '5+ Yrs', icon: Trophy },
  ];

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300 font-sans">
      
      {/* SaaS Studio Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider text-brand-600 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/80 border border-brand-200/60 dark:border-orange-900/60 uppercase mb-1.5">
            <Sparkles className="h-3 w-3 text-brand-500 dark:text-orange-400" />
            <span>AI PRACTICE ARENA • REAL-TIME INTERVIEW SIMULATOR</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Configure Practice Session
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Tailor company rubrics, assessment round focus, and verify hardware feed before entering the arena.
          </p>
        </div>

        {/* Readiness Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-white/60 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-md glass-panel flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>AI Engine: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">Active</strong></span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-white/60 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-md glass-panel flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm">
            <Award className="h-4 w-4 text-amber-500" />
            <span>Latest Practice: <strong className="text-amber-600 dark:text-amber-400 font-extrabold">85% Score</strong></span>
          </div>
        </div>
      </div>

      <form onSubmit={handleStart} className="space-y-6">
        
        {/* Balanced 50/50 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Role & Assessment Track Card */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              
              {/* Target Role Section */}
              <div className="space-y-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
                  <Building2 className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
                  Target Role &amp; Enterprise
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Target Enterprise
                    </label>
                    <div className="flex items-center gap-2">
                      {postedLoading || !company ? (
                        <span className="h-12 w-12 flex-shrink-0 rounded-2xl bg-slate-200/70 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 animate-pulse" />
                      ) : (
                        <CompanyLogo
                          name={company}
                          logoUrl={selectedCompany?.logoUrl}
                          size="md"
                          className="shadow-xs flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <SearchableSelect
                          options={companyOptions}
                          selected={selectedCompany}
                          onSelect={handleCompanySelect}
                          loading={postedLoading}
                          emptyMessage="No companies have posted roles yet"
                          placeholder="Search companies with open roles..."
                          icon={<Building2 className="h-4 w-4" />}
                          error={postedError || undefined}
                          className="text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Target Position Title
                    </label>
                    <SearchableSelect
                      options={roleOptions}
                      selected={selectedRole}
                      onSelect={handleRoleSelect}
                      loading={postedLoading}
                      disabled={!orgId}
                      emptyMessage="Pick a company to see its open roles"
                      placeholder="Roles posted by this company..."
                      icon={<Target className="h-4 w-4" />}
                      className="text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Assessment Round Selector (4 Options) */}
              <div className="space-y-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
                    <Layers className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
                    Select Assessment Round
                  </h3>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-orange-950/60 text-brand-700 dark:text-orange-300 border border-brand-200 dark:border-orange-900">
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
                            ? 'border-brand-500 dark:border-orange-500 bg-brand-500/10 dark:bg-orange-500/10 text-slate-900 dark:text-slate-100 ring-2 ring-brand-500/30'
                            : 'border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`h-4 w-4 ${
                                isSelected ? 'text-brand-500 dark:text-orange-400' : 'text-slate-400'
                              }`}
                            />
                            <span className="text-xs font-extrabold">{t.label}</span>
                            {t.featured && (
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 uppercase">
                                {t.badge}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-brand-500 dark:text-orange-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                          {t.sub}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seniority Level */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
                  <Sliders className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
                  Target Seniority Level
                </h3>

                <div className="grid grid-cols-3 gap-3">
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
                            ? 'border-brand-500 dark:border-orange-500 bg-brand-500/10 dark:bg-orange-500/10 text-brand-700 dark:text-orange-300 ring-2 ring-brand-500/30'
                            : 'border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <Icon
                          className={`h-4.5 w-4.5 mb-1 ${
                            isSelected ? 'text-brand-500 dark:text-orange-400' : 'text-slate-400'
                          }`}
                        />
                        <span className="text-xs font-extrabold block">{d.label}</span>
                        <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">
                          {d.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Launch Actions */}
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
                  I agree to microphone audio and webcam eye-gaze analysis during the practice session.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !consent || !orgId || !role}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold py-3.5 px-8 text-xs transition-all shadow-lg hover:shadow-xl disabled:opacity-50 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
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
