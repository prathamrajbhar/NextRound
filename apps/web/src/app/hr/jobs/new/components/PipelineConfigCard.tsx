'use client';

import React from 'react';
import { Settings, AudioLines, ClipboardCheck, Video, ChevronRight, Eye } from 'lucide-react';

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
  
  stages: ('screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision')[];
  setStages: (val: ('screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision')[]) => void;
  assessmentConfig: {
    mcqCount: number;
    codingProblemId: string;
    passingScore: number;
  };
  setAssessmentConfig: (val: { mcqCount: number; codingProblemId: string; passingScore: number }) => void;
}

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
      const sequenceOrder: ('screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision')[] = [
        'screening',
        'assessment',
        'voice_screen',
        'hr_round',
        'panel',
        'decision',
      ];
      const nextStages = [...stages, stage].sort(
        (a, b) => sequenceOrder.indexOf(a) - sequenceOrder.indexOf(b)
      );
      setStages(nextStages);
    }
  };

  const handleConfigChange = (key: string, value: string | number | boolean) => {
    setAssessmentConfig({
      ...assessmentConfig,
      [key]: value,
    });
  };

  const isActive = (stage: 'screening' | 'assessment' | 'voice_screen' | 'panel') => stages.includes(stage);

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-6">
      {/* Header */}
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

      {/* Sleek Pipeline flow breadcrumbs */}
      <div className="flex flex-wrap items-center gap-1.5 py-2 select-none border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
        <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
          Applied
        </span>
        <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />

        {isActive('screening') && (
          <>
            <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg">
              Resume Check
            </span>
            <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
          </>
        )}

        {isActive('assessment') && (
          <>
            <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-1 rounded-lg">
              Online Test
            </span>
            <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
          </>
        )}

        {isActive('voice_screen') && (
          <>
            <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2.5 py-1 rounded-lg">
              Voice Call
            </span>
            <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
          </>
        )}

        {isActive('panel') && (
          <>
            <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2.5 py-1 rounded-lg">
              Team Interview
            </span>
            <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
          </>
        )}

        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg">
          Hire Decision
        </span>
      </div>

      {/* Stage Toggles & Integrated Sub-settings */}
      <div className="space-y-4">
        {/* 1. Resume Screen */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${isActive('screening') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <Eye className="h-3.5 w-3.5" />
              </span>
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Auto Resume Screening</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Check and rank resumes automatically</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive('screening')}
                onChange={() => toggleStage('screening')}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></div>
            </label>
          </div>
        </div>

        {/* 2. Assessment Toggle + Integrated Config */}
        <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${isActive('assessment') ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <ClipboardCheck className="h-3.5 w-3.5" />
              </span>
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Online Test</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Coding and multiple-choice questions</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive('assessment')}
                onChange={() => toggleStage('assessment')}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          {/* Assessment inline details when active */}
          {isActive('assessment') && (
            <div className="pl-9 pr-1 pt-2 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Number of Questions</span>
                <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => handleConfigChange('mcqCount', Math.max(1, (assessmentConfig.mcqCount || 1) - 1))}
                    className="h-5 w-5 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={assessmentConfig.mcqCount}
                    onChange={(e) => handleConfigChange('mcqCount', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 text-center font-extrabold text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleConfigChange('mcqCount', (assessmentConfig.mcqCount || 1) + 1)}
                    className="h-5 w-5 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span>Passing Score</span>
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold">{assessmentConfig.passingScore}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={assessmentConfig.passingScore}
                  onChange={(e) => handleConfigChange('passingScore', Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. AI Voice Screen Toggle */}
        <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${isActive('voice_screen') ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <AudioLines className="h-3.5 w-3.5" />
              </span>
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">AI Voice Call</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Automated AI phone interview</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive('voice_screen')}
                onChange={() => toggleStage('voice_screen')}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></div>
            </label>
          </div>
        </div>

        {/* 4. Live Panel */}
        <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${isActive('panel') ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <Video className="h-3.5 w-3.5" />
              </span>
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Team Interview</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Final round with hiring team</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive('panel')}
                onChange={() => toggleStage('panel')}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Sourcing & Shortlist Controls Section */}
      <div className="border-t border-slate-200/60 dark:border-slate-800 pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100">
              AI Candidate Sourcing
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Find matching candidates automatically</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enableSourcing}
              onChange={(e) => setEnableSourcing(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></div>
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
