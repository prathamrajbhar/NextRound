'use client';

import React from 'react';
import { Settings, AudioLines, ClipboardCheck, Video, Eye, Sparkles } from '@/lib/lucide-google-icons';
import { PipelineBreadcrumbs } from './PipelineBreadcrumbs';
import { StageToggleRow } from './StageToggleRow';
import { AssessmentConfigDetails } from './AssessmentConfigDetails';

type PipelineStage = 'screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision';

interface PipelineConfigCardProps {
  minScore: number;
  setMinScore: (val: number) => void;
  autoOffer: boolean;
  setAutoOffer: (val: boolean) => void;
  qCount: number;
  setQCount: (val: number | ((prev: number) => number)) => void;
  enableSourcing: boolean;
  setEnableSourcing: (val: boolean) => void;
  voiceProfile: string;
  setVoiceProfile: (val: string) => void;
  stages: PipelineStage[];
  setStages: (val: PipelineStage[]) => void;
  assessmentConfig: {
    mcqCount: number;
    codingProblemId: string;
    passingScore: number;
    mcqDistribution?: Record<string, number>;
    customQuestions?: any[];
  };
  setAssessmentConfig: React.Dispatch<React.SetStateAction<any>>;
  jdText?: string;
  roleTitle?: string;
  skills?: string[];
  experienceLevel?: string;
}

const SEQUENCE_ORDER: PipelineStage[] = [
  'screening',
  'assessment',
  'voice_screen',
  'hr_round',
  'panel',
  'decision',
];

export default function PipelineConfigCard({
  minScore,
  setMinScore,
  enableSourcing,
  setEnableSourcing,
  stages,
  setStages,
  assessmentConfig,
  setAssessmentConfig,
  jdText,
  roleTitle,
  skills,
  experienceLevel,
}: PipelineConfigCardProps) {
  const toggleStage = (stage: 'screening' | 'assessment' | 'voice_screen' | 'panel') => {
    if (stages.includes(stage)) {
      const remaining = stages.filter((s) => s !== stage);
      if (remaining.length > 1) {
        setStages(remaining);
      }
    } else {
      const nextStages = [...stages, stage].sort(
        (a, b) => SEQUENCE_ORDER.indexOf(a) - SEQUENCE_ORDER.indexOf(b)
      );
      setStages(nextStages);
    }
  };

  const isActive = (stage: 'screening' | 'assessment' | 'voice_screen' | 'panel') =>
    stages.includes(stage);

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-6 md:p-7 shadow-sm backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5 text-brand-600 dark:text-brand-400">
          <div className="h-8 w-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center">
            <Settings className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Hiring Pipeline &amp; Evaluation Gates
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Sequence of evaluation stages candidates must complete</p>
          </div>
        </div>
        <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg">
          {stages.length} Active Steps
        </span>
      </div>

      <PipelineBreadcrumbs stages={stages} />

      <div className="space-y-3">
        <StageToggleRow
          icon={<Eye className="h-4 w-4" />}
          title="Automated Resume Screening"
          description="Instant semantic matching and qualification check against job description"
          checked={isActive('screening')}
          onChange={() => toggleStage('screening')}
          activeColorClass="bg-brand-500/15 text-brand-600 dark:text-brand-400"
        />

        <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
          <StageToggleRow
            icon={<ClipboardCheck className="h-4 w-4" />}
            title="Online Assessment &amp; Coding Test"
            description="Automated aptitude MCQs and sandboxed coding challenges"
            checked={isActive('assessment')}
            onChange={() => toggleStage('assessment')}
            activeColorClass="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          />
          {isActive('assessment') && (
            <AssessmentConfigDetails
              assessmentConfig={assessmentConfig}
              setAssessmentConfig={setAssessmentConfig}
              jdText={jdText}
              roleTitle={roleTitle}
              skills={skills}
              experienceLevel={experienceLevel}
            />
          )}
        </div>

        <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
          <StageToggleRow
            icon={<AudioLines className="h-4 w-4" />}
            title="AI Voice Interview"
            description="Conversational AI phone screen evaluating depth and role fit"
            checked={isActive('voice_screen')}
            onChange={() => toggleStage('voice_screen')}
            activeColorClass="bg-purple-500/15 text-purple-600 dark:text-purple-400"
          />
        </div>

        <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
          <StageToggleRow
            icon={<Video className="h-4 w-4" />}
            title="Final Team Interview"
            description="In-depth technical or panel round with internal team lead"
            checked={isActive('panel')}
            onChange={() => toggleStage('panel')}
            activeColorClass="bg-rose-500/15 text-rose-600 dark:text-rose-400"
          />
        </div>
      </div>

      <div className="border-t border-slate-200/60 dark:border-slate-800 pt-4 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              <span>AI Autonomous Sourcing</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal">
              Continuously match pre-vetted talent pool candidates to this role
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enableSourcing}
              onChange={(e) => setEnableSourcing(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-brand-500" />
          </label>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Minimum Auto-Shortlist Threshold</span>
            <span className="font-extrabold text-brand-600 dark:text-brand-400">{minScore}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
