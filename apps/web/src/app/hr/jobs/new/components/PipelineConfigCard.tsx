'use client';

import React from 'react';
import { Settings, HelpCircle, AudioLines, Code, ClipboardCheck, Video, ChevronRight, Eye } from 'lucide-react';
import { mockCodingProblems } from '@/lib/mockData';

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
  autoOffer,
  setAutoOffer,
  qCount,
  setQCount,
  enableSourcing,
  setEnableSourcing,
  voiceProfile,
  setVoiceProfile,
  
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
    <div className="space-y-6">
      {/* 1. Visual Stage Sequence Builder */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <Settings className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">Recruitment Process Designer</h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Toggle and customize the evaluation pipeline. Candidates flow through active stages sequentially.
        </p>

        {/* Visual Pipeline flow map */}
        <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-2xl flex flex-wrap items-center gap-2 justify-center select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
              Sourced
            </span>
            <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
          </div>

          {isActive('screening') && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-900/60 px-2.5 py-1 rounded-lg">
                AI Screen
              </span>
              <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
            </div>
          )}

          {isActive('assessment') && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-900/60 px-2.5 py-1 rounded-lg">
                MCQ + Coding
              </span>
              <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
            </div>
          )}

          {isActive('voice_screen') && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-900/60 px-2.5 py-1 rounded-lg">
                Voice Screen
              </span>
              <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
            </div>
          )}

          {isActive('panel') && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/60 px-2.5 py-1 rounded-lg">
                Live Panel
              </span>
              <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
            </div>
          )}

          <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-1 rounded-lg">
            Decision
          </span>
        </div>

        {/* Stage Toggles */}
        <div className="space-y-3.5 pt-2">
          {/* Resume Screen */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`h-8 w-8 rounded-xl flex items-center justify-center border transition-all ${isActive('screening') ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                <Eye className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">AI Resume Screening</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Scan &amp; rank applications</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive('screening')}
                onChange={() => toggleStage('screening')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* MCQ + Coding Assessment */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`h-8 w-8 rounded-xl flex items-center justify-center border transition-all ${isActive('assessment') ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                <ClipboardCheck className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">MCQ &amp; Coding Assessment</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">LeetCode-style online testing</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive('assessment')}
                onChange={() => toggleStage('assessment')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* AI Voice Screen */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`h-8 w-8 rounded-xl flex items-center justify-center border transition-all ${isActive('voice_screen') ? 'bg-purple-50 dark:bg-purple-950/80 border-purple-200 dark:border-purple-900 text-purple-600 dark:text-purple-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                <AudioLines className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">AI Voice Screening</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Conversational speech agent round</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive('voice_screen')}
                onChange={() => toggleStage('voice_screen')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Live Panel */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`h-8 w-8 rounded-xl flex items-center justify-center border transition-all ${isActive('panel') ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                <Video className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Live Panel / Take-Home</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Human interview or review</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive('panel')}
                onChange={() => toggleStage('panel')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Online Assessment Config */}
      {isActive('assessment') && (
        <div className="rounded-3xl border border-amber-200/60 dark:border-amber-900/60 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4 animate-in slide-in-from-top-3 duration-250">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 border-b border-slate-200/60 dark:border-slate-800 pb-3 font-extrabold">
            <Code className="h-4.5 w-4.5" />
            <h3 className="text-sm font-display">Online Assessment Configuration</h3>
          </div>

          <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {/* Coding Challenge Selection */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Select Coding Challenge
              </label>
              <select
                value={assessmentConfig.codingProblemId}
                onChange={(e) => handleConfigChange('codingProblemId', e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-extrabold focus:outline-none cursor-pointer"
              >
                {mockCodingProblems.map((prob) => (
                  <option key={prob.id} value={prob.id}>
                    {prob.title} ({prob.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {/* MCQ question count */}
            <div className="flex justify-between items-center py-1 border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
              <div>
                <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100">Quantity of MCQ Questions</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">Evaluates logic, architecture</span>
              </div>
              <div className="flex items-center gap-2 select-none border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-white dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => handleConfigChange('mcqCount', Math.max(1, assessmentConfig.mcqCount - 1))}
                  className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer font-extrabold"
                >
                  -
                </button>
                <span className="w-5 text-center font-extrabold text-slate-900 dark:text-slate-100">{assessmentConfig.mcqCount}</span>
                <button
                  type="button"
                  onClick={() => handleConfigChange('mcqCount', Math.min(10, assessmentConfig.mcqCount + 1))}
                  className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer font-extrabold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Assessment passing score */}
            <div className="pt-2">
              <div className="flex justify-between mb-1.5 text-[11px] font-extrabold text-slate-900 dark:text-slate-100">
                <span>Assessment Passing Score</span>
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
        </div>
      )}

      {/* 3. Pipeline Agents Config */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <Settings className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">Pipeline Agents Config</h3>
        </div>

        <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {/* Sourcing Agent */}
          <div className="flex justify-between items-center py-1">
            <div>
              <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                Sourcing Agent
                <span className="group relative inline-block cursor-help">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  <span className="invisible group-hover:visible absolute z-50 bg-slate-800 text-white text-[9px] font-bold p-2 rounded-lg -top-8 -left-20 w-44 shadow-lg text-center leading-normal">
                    Auto-scrape, match and contact potential candidates.
                  </span>
                </span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">Auto-source candidate profiles</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableSourcing}
                onChange={(e) => setEnableSourcing(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Min Shortlist Score Slider */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex justify-between mb-1.5 text-[11px] font-extrabold text-slate-900 dark:text-slate-100">
              <span className="flex items-center gap-1">
                Min Shortlist Score
                <span className="group relative inline-block cursor-help">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  <span className="invisible group-hover:visible absolute z-50 bg-slate-800 text-white text-[9px] font-bold p-2 rounded-lg -top-8 -left-24 w-48 shadow-lg text-center leading-normal">
                    Candidates scoring below this value are auto-rejected.
                  </span>
                </span>
              </span>
              <span className="font-extrabold text-brand-600 dark:text-orange-400">{minScore}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-brand-600 dark:accent-orange-500 cursor-pointer"
            />
          </div>

          {/* Auto Offer Trigger */}
          <div className="flex justify-between items-center py-1 border-t border-slate-200/60 dark:border-slate-800">
            <div>
              <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                Auto-Offer Contract
                <span className="group relative inline-block cursor-help">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  <span className="invisible group-hover:visible absolute z-50 bg-slate-800 text-white text-[9px] font-bold p-2 rounded-lg -top-8 -left-20 w-44 shadow-lg text-center leading-normal">
                    Send employment contracts automatically if matching threshold.
                  </span>
                </span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">Instantly trigger contract draft</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoOffer}
                onChange={(e) => setAutoOffer(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Voice Profile select */}
          {isActive('voice_screen') && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <AudioLines className="h-3.5 w-3.5 text-indigo-500" />
                Interviewer Agent Voice
              </label>
              <select
                value={voiceProfile}
                onChange={(e) => setVoiceProfile(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-extrabold focus:outline-none cursor-pointer"
              >
                <option value="Serena (Warm/Professional)">Serena (Warm/Professional)</option>
                <option value="Marcus (Technical/Direct)">Marcus (Technical/Direct)</option>
                <option value="Charlotte (Conversational)">Charlotte (Conversational/Friendly)</option>
                <option value="David (Assertive/Analytical)">David (Assertive/Analytical)</option>
              </select>
            </div>
          )}

          {/* Question Count stepper */}
          {isActive('voice_screen') && (
            <div className="flex justify-between items-center py-1 border-t border-slate-200/60 dark:border-slate-800">
              <div>
                <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  Voice Screening Questions
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">Quantity of Voice Queries</span>
              </div>
              <div className="flex items-center gap-2 select-none border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-white dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setQCount((p: number) => Math.max(3, p - 1))}
                  className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer font-extrabold"
                >
                  -
                </button>
                <span className="w-5 text-center font-extrabold text-slate-900 dark:text-slate-100">{qCount}</span>
                <button
                  type="button"
                  onClick={() => setQCount((p: number) => Math.min(10, p + 1))}
                  className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer font-extrabold"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
