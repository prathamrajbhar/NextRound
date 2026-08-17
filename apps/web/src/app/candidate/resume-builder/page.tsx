'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocalMediaStream } from '@/hooks/useLocalMediaStream';
import { SetupStage } from './_components/SetupStage';
import { InterviewStage } from './_components/InterviewStage';
import { ResumeStage } from './_components/ResumeStage';
import { useResumeVoiceSession } from './_hooks/useResumeVoiceSession';
import { ATSResumeData } from '@/types';
import { apiClient } from '@/lib/apiClient';

interface RawResumeData {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary?: string;
  atsScore?: number;
  ats_score?: number;
  scoreBreakdown?: { label: string; score: number; description: string }[];
  score_breakdown?: { label: string; score: number; description: string }[];
  work_history?: {
    title?: string;
    role?: string;
    company?: string;
    dates?: string;
    period?: string;
    location?: string;
    bullets?: string[];
    highlights?: string[];
  }[];
  experience?: {
    title?: string;
    role?: string;
    company?: string;
    dates?: string;
    period?: string;
    location?: string;
    bullets?: string[];
    highlights?: string[];
  }[];
  skills?: string[] | { category: string; items: string[] }[];
  projects?: {
    name?: string;
    title?: string;
    description?: string;
    techStack?: string[];
    tech_stack?: string[];
    impact?: string;
  }[];
  education?: {
    degree?: string;
    institution?: string;
    year?: string;
    dates?: string;
    gpa?: string;
  }[];
  certifications?: string[];
}
import { Sparkles, Loader2, AlertCircle } from '@/lib/lucide-google-icons';

const DEFAULT_GENERATED_RESUME: ATSResumeData = {
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  summary: '',
  atsScore: 0,
  scoreBreakdown: [],
  experience: [],
  projects: [],
  skills: [],
  education: [],
  certifications: [],
};

type Stage = 'setup' | 'interview' | 'resume';
type ResumeStatus = 'idle' | 'generating' | 'completed' | 'error';

export default function AIResumeBuilderPage() {
  const [stage, setStage] = useState<Stage>('setup');

  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Senior (5+ Years)');

  const [timeRemaining, setTimeRemaining] = useState(900);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [resumeStatus, setResumeStatus] = useState<ResumeStatus>('idle');
  const [resumeData, setResumeData] = useState<ATSResumeData>(DEFAULT_GENERATED_RESUME);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern' | 'executive'>('classic');
  const [copiedText, setCopiedText] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    sessionId,
    conversationHistory,
    aiState,
    candidateSpeechText,
    realtimeInsight,
    micActive,
    camActive,
    setCamActive,
    toggleMic,
    error: voiceError,
    startCall,
    submitResponse,
    replayLastAudio,
    endCall,
  } = useResumeVoiceSession({
    targetRole,
    experienceLevel,
    onComplete: () => {
      setIsTimerRunning(false);
      setStage('resume');
      setResumeStatus('generating');
    },
  });

  const lastAiMessage = [...conversationHistory]
    .reverse()
    .find((h) => h.role === 'ai')?.content || 'Connecting to AI voice agent...';

  const currentTurn = {
    aiMessage: lastAiMessage,
  };

  const { micLevel } = useLocalMediaStream({
    videoRef,
    camActive,
    micActive: micActive,
    enabled: stage === 'interview',
  });

  useEffect(() => {
    if (!isTimerRunning || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, timeRemaining]);

  useEffect(() => {
    if (stage !== 'resume' || !sessionId || resumeStatus !== 'generating') return;

    // Hard ceiling on how long we wait for the worker before surfacing an error,
    // so a dead queue or lost job can never leave the candidate polling forever.
    const deadline = Date.now() + 120_000;

    const pollInterval = setInterval(async () => {
      try {
        const res = await apiClient.get<{
          status: string;
          generatedResume: RawResumeData;
          resumePdfUrl: string;
        }>(`/resume-builder/${sessionId}/result`);

        if (res && res.status === 'completed') {
          clearInterval(pollInterval);

          const raw = res.generatedResume || {};
          const contact = raw.contact || {};

          const mappedResume: ATSResumeData = {
            name: contact.name || raw.name || '',
            title: raw.title || targetRole,
            email: contact.email || raw.email || '',
            phone: contact.phone || raw.phone || '',
            location: contact.location || raw.location || '',
            linkedin: contact.linkedin || raw.linkedin || '',
            github: contact.github || raw.github || '',
            portfolio: contact.portfolio || raw.portfolio || '',
            summary: raw.summary || '',
            atsScore: raw.atsScore ?? raw.ats_score ?? 0,
            scoreBreakdown: raw.scoreBreakdown ?? raw.score_breakdown ?? [],
            experience: (raw.work_history || raw.experience || []).map((exp) => ({
              role: exp.role || exp.title || '',
              company: exp.company || '',
              period: exp.period || exp.dates || '',
              location: exp.location || 'Remote',
              highlights: exp.highlights || exp.bullets || [],
            })),
            projects: (raw.projects || []).map((proj) => ({
              title: proj.title || proj.name || '',
              techStack: proj.techStack || proj.tech_stack || [],
              description: proj.description || '',
              impact: proj.impact || proj.description || '',
            })),
            skills: Array.isArray(raw.skills)
              ? (typeof raw.skills[0] === 'string'
                  ? [{ category: 'Core Competencies', items: raw.skills as string[] }]
                  : raw.skills as { category: string; items: string[] }[])
              : [],
            education: (raw.education || []).map((edu) => ({
              degree: edu.degree || '',
              institution: edu.institution || '',
              year: edu.year || edu.dates || '',
              gpa: edu.gpa || undefined,
            })),
            certifications: raw.certifications || [],
            pdfUrl: res.resumePdfUrl || undefined,
          };

          setResumeData(mappedResume);
          setResumeStatus('completed');
        } else if (res && res.status === 'failed') {
          clearInterval(pollInterval);
          setResumeStatus('error');
        } else if (Date.now() > deadline) {
          clearInterval(pollInterval);
          setResumeStatus('error');
        }
      } catch (err) {
        if (Date.now() > deadline) {
          clearInterval(pollInterval);
          setResumeStatus('error');
        }
        console.error('Error polling resume result:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [stage, sessionId, resumeStatus, targetRole]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async () => {
    setStage('interview');
    setTimeRemaining(900);
    setIsTimerRunning(true);
    startCall();
  };

  const handleEndCall = async () => {
    setIsTimerRunning(false);
    endCall();
  };

  const handleCopyResumeText = () => {
    const fullText = `${resumeData.name}\n${resumeData.title} | ${resumeData.email} | ${resumeData.phone}\n${resumeData.location}\n\nSUMMARY\n${resumeData.summary}\n\nEXPERIENCE\n` +
      resumeData.experience.map(e => `${e.role} - ${e.company} (${e.period})\n` + e.highlights.map(h => `• ${h}`).join('\n')).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between pb-2 animate-in fade-in duration-300">
      {stage === 'setup' && (
        <SetupStage
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          experienceLevel={experienceLevel}
          setExperienceLevel={setExperienceLevel}
          onStartCall={handleStartCall}
        />
      )}

      {stage === 'interview' && (
        <InterviewStage
          targetRole={targetRole}
          experienceLevel={experienceLevel}
          timeRemaining={timeRemaining}
          formatTimer={formatTimer}
          aiState={aiState}
          currentTurn={currentTurn}
          conversationHistory={conversationHistory}
          videoRef={videoRef}
          camActive={camActive}
          setCamActive={setCamActive}
          micActive={micActive}
          setMicActive={toggleMic}
          micLevel={micActive ? micLevel : 0}
          candidateSpeechText={candidateSpeechText}
          realtimeInsight={realtimeInsight}
          voiceError={voiceError}
          onReplayAudio={replayLastAudio}
          onSubmitResponse={submitResponse}
          onEndCall={handleEndCall}
        />
      )}

      {stage === 'resume' && (
        <>
          {resumeStatus === 'generating' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 min-h-[500px]">
              <div className="relative flex items-center justify-center">
                <Loader2 className="h-16 w-16 text-orange-500 animate-spin" />
                <Sparkles className="absolute h-6 w-6 text-amber-400 animate-pulse" />
              </div>
              <div className="text-center space-y-2 max-w-md">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-display">
                  AI Resumé Generation in Progress
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  NextRound is processing your voice transcript, quantifying impact metrics, and compiling an ATS-optimized ReportLab PDF. This will take a moment...
                </p>
              </div>
            </div>
          )}

          {resumeStatus === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[500px]">
              <AlertCircle className="h-14 w-14 text-rose-500" />
              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Generation Failed
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  We encountered an error generating your resume from the interview. Please try again.
                </p>
              </div>
              <button
                onClick={() => setStage('setup')}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all"
              >
                Restart Session
              </button>
            </div>
          )}

          {resumeStatus === 'completed' && (
            <ResumeStage
              resumeData={resumeData}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              copiedText={copiedText}
              onCopyResumeText={handleCopyResumeText}
              onRestart={() => setStage('setup')}
            />
          )}
        </>
      )}
    </div>
  );
}

