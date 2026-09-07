'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, ArrowRight } from '@/lib/lucide-google-icons';
import CalibrationPanel, { AssessmentTrack } from './components/CalibrationPanel';
import { apiClient } from '@/lib/apiClient';
import { useMockSessions } from '@/hooks/queries';
import { useMockSetupMic } from './components/useMockSetupMic';
import { useMockJobOptions } from './components/useMockJobOptions';
import { MockSetupHeader } from './components/MockSetupHeader';
import { CompanyRoleSelectionCard } from './components/CompanyRoleSelectionCard';
import { TrackSelectionCard } from './components/TrackSelectionCard';

function MockInterviewSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCompany = searchParams.get('company');
  const initialRole = searchParams.get('role');
  const initialTrack = (searchParams.get('track') as AssessmentTrack) || 'comprehensive';
  const [track, setTrack] = useState<AssessmentTrack>(initialTrack);
  const [difficulty, setDifficulty] = useState<'junior' | 'mid' | 'senior'>('mid');
  const [loading, setLoading] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const { data: mockSessionsData } = useMockSessions();
  const latestScore = useMemo(() => {
    const score = Array.isArray(mockSessionsData) ? mockSessionsData[0]?.score : undefined;
    return typeof score === 'number' ? score : null;
  }, [mockSessionsData]);

  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [consent, setConsent] = useState(true);

  const micLevel = useMockSetupMic(micActive);

  useEffect(() => {
    if (!isCalibrating) return;
    const t = setTimeout(() => setIsCalibrating(false), 350);
    return () => clearTimeout(t);
  }, [isCalibrating]);

  const jobOpts = useMockJobOptions({
    initialCompany,
    initialRole,
    onCalibrate: () => setIsCalibrating(true),
  });

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent || !jobOpts.orgId || !jobOpts.role) return;
    setLoading(true);
    try {
      const res = await apiClient.post<{ sessionId: string }>('/mock/sessions', {
        topic:
          track === 'coding'
            ? 'Data Structures & Algorithms'
            : track === 'aptitude'
            ? 'Behavioral & STAR Method'
            : 'System Design & Architecture',
        targetCompany: jobOpts.company,
        targetRole: jobOpts.role,
        difficulty,
        focusAreas: [track],
      });
      if (res?.sessionId) {
        router.push(
          `/candidate/mock/${res.sessionId}?track=${track}&company=${encodeURIComponent(
            jobOpts.company
          )}&role=${encodeURIComponent(jobOpts.role)}&difficulty=${difficulty}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300 font-sans">
      <MockSetupHeader latestScore={latestScore} />

      <form onSubmit={handleStart} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <CompanyRoleSelectionCard
                company={jobOpts.company}
                companyOptions={jobOpts.companyOptions}
                selectedCompany={jobOpts.selectedCompany}
                roleOptions={jobOpts.roleOptions}
                selectedRole={jobOpts.selectedRole}
                postedLoading={jobOpts.postedLoading}
                postedErrorMessage={jobOpts.postedErrorMessage}
                orgId={jobOpts.orgId}
                onCompanySelect={jobOpts.handleCompanySelect}
                onRoleSelect={jobOpts.handleRoleSelect}
              />

              <TrackSelectionCard
                track={track}
                onSelectTrack={(newTrack) => {
                  setTrack(newTrack);
                  setIsCalibrating(true);
                }}
                difficulty={difficulty}
                onSelectDifficulty={setDifficulty}
              />
            </div>

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
                disabled={loading || !consent || !jobOpts.orgId || !jobOpts.role}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold py-3.5 px-8 text-xs transition-all shadow-lg hover:shadow-xl disabled:opacity-50 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Mic className="h-4.5 w-4.5" />
                <span>{loading ? 'Launching Session...' : 'Start Session'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <CalibrationPanel
            company={jobOpts.company}
            role={jobOpts.role}
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
