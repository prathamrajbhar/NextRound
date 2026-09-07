'use client';

import React from 'react';
import { Settings, AudioLines, ClipboardCheck, Video, Eye } from 'lucide-react';
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
  };
  setAssessmentConfig: React.Dispatch<React.SetStateAction<{
    mcqCount: number;
    codingProblemId: string;
    passingScore: number;
    mcqDistribution?: Record<string, number>;
  }>>;
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
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Settings className="h-5 w-5" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Hiring Steps &amp; AI Settings
          </h3>
        </div>
        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
          {stages.length} Active Steps
        </span>
      </div>

      <PipelineBreadcrumbs stages={stages} />

      <div className="space-y-4">
        <StageToggleRow
          icon={<Eye className="h-3.5 w-3.5" />}
          title="Auto Resume Screening"
          description="Check and rank resumes automatically"
          checked={isActive('screening')}
          onChange={() => toggleStage('screening')}
          activeColorClass="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
        />

        <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
          <StageToggleRow
            icon={<ClipboardCheck className="h-3.5 w-3.5" />}
            title="Online Test"
            description="Coding and multiple-choice questions"
            checked={isActive('assessment')}
            onChange={() => toggleStage('assessment')}
            activeColorClass="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
          />
          {isActive('assessment') && (
            <AssessmentConfigDetails
              assessmentConfig={assessmentConfig}
              setAssessmentConfig={setAssessmentConfig}
            />
          )}
        </div>

        <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
          <StageToggleRow
            icon={<AudioLines className="h-3.5 w-3.5" />}
            title="AI Voice Call"
            description="Automated AI phone interview"
            checked={isActive('voice_screen')}
            onChange={() => toggleStage('voice_screen')}
            activeColorClass="bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
          />
        </div>

        <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
          <StageToggleRow
            icon={<Video className="h-3.5 w-3.5" />}
            title="Team Interview"
            description="Final round with hiring team"
            checked={isActive('panel')}
            onChange={() => toggleStage('panel')}
            activeColorClass="bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
          />
        </div>
      </div>

      <div className="border-t border-slate-200/60 dark:border-slate-800 pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100">
              AI Candidate Sourcing
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
              Find matching candidates automatically
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enableSourcing}
              onChange={(e) => setEnableSourcing(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500" />
          </label>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <span>Minimum Shortlist Score</span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{minScore}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
