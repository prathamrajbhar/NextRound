'use client';

import React from 'react';
import {
  Video,
  Activity,
  Volume2,
  Sparkles,
  Eye,
  Wifi,
  Clock,
  MessageSquare,
  Maximize2,
} from '@/lib/lucide-google-icons';
import { CompanyLogo } from '@/components/ui';
import { InterviewConsoleMode, ProctorTelemetry } from './types';

interface ConsoleHeaderProps {
  mode: InterviewConsoleMode;
  companyName: string;
  jobTitle: string;
  phase?: string;
  isAnalyzing: boolean;
  aiSpeaking: boolean;
  proctorTelemetry?: ProctorTelemetry;
  timeLabel: string;
  showTranscriptToggle: boolean;
  showTranscriptDrawer: boolean;
  onToggleTranscript: () => void;
  onToggleFullscreen: () => void;
}

function getStatusBadge(
  mode: InterviewConsoleMode,
  isAnalyzing: boolean,
  aiSpeaking: boolean
): { text: string; bg: string; dot: string; icon: React.ReactNode } {
  if (mode === 'hr-candidate' || mode === 'hr-recruiter') {
    return {
      text: '1:1 Live HR Video Call',
      bg: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300',
      dot: 'bg-emerald-400 animate-pulse',
      icon: <Video className="h-3.5 w-3.5 text-emerald-400" />,
    };
  }
  if (isAnalyzing) {
    return {
      text: 'Analyzing Response...',
      bg: 'bg-indigo-950/80 border-indigo-700/60 text-indigo-300',
      dot: 'bg-indigo-400 animate-ping',
      icon: <Activity className="h-3.5 w-3.5 text-indigo-400 animate-spin" />,
    };
  }
  if (aiSpeaking) {
    return {
      text: 'AI Interviewer Speaking',
      bg: 'bg-amber-950/80 border-amber-700/60 text-amber-300',
      dot: 'bg-amber-400 animate-pulse',
      icon: <Volume2 className="h-3.5 w-3.5 text-amber-400 animate-pulse" />,
    };
  }
  return {
    text: mode === 'mock-practice' ? 'AI Mock Interviewer Ready' : 'AI Proctored Interviewer',
    bg: 'bg-slate-900/90 border-slate-700 text-slate-300',
    dot: 'bg-emerald-500',
    icon: <Sparkles className="h-3.5 w-3.5 text-brand-400" />,
  };
}





export function ConsoleHeader({
  mode,
  companyName,
  jobTitle,
  phase,
  isAnalyzing,
  aiSpeaking,
  proctorTelemetry,
  timeLabel,
  showTranscriptToggle,
  showTranscriptDrawer,
  onToggleTranscript,
  onToggleFullscreen,
}: ConsoleHeaderProps) {
  const status = getStatusBadge(mode, isAnalyzing, aiSpeaking);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 px-4 sm:px-6 flex items-center justify-between z-30 flex-shrink-0 backdrop-blur-md shadow-sm dark:shadow-lg">
      <div className="flex items-center gap-3">
        <CompanyLogo name={companyName} size="md" className="shadow-md flex-shrink-0 border border-slate-200 dark:border-slate-700/60" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate font-display">{companyName}</span>
            <span className="h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-600" />
            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full flex items-center gap-1 ${status.bg}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.text} {phase ? `• ${phase}` : ''}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{jobTitle}</p>
        </div>
      </div>

      {}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {proctorTelemetry && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-xs">
            <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Gaze: {proctorTelemetry.gazeCentered ? 'Centered' : 'Away'}</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium shadow-xs">
          <Wifi className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
          <span className="text-[11px]">1080p HD</span>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold shadow-xs">
          <Clock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
          <span>{timeLabel}</span>
        </div>

        {showTranscriptToggle && (
          <button
            type="button"
            onClick={onToggleTranscript}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showTranscriptDrawer
                ? 'bg-brand-600 text-white border-brand-500'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Transcript</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-2 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
