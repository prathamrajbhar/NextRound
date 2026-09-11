'use client';

import React from 'react';
import { Brain, BookOpen, BarChart3, Cpu, ClipboardCheck } from '@/lib/lucide-google-icons';

interface AssessmentConfig {
  mcqCount: number;
  codingProblemId: string;
  passingScore: number;
  mcqDistribution?: Record<string, number>;
}

interface AssessmentConfigDetailsProps {
  assessmentConfig: AssessmentConfig;
  setAssessmentConfig: React.Dispatch<React.SetStateAction<AssessmentConfig>>;
}

const CATEGORIES = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
] as const;

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Quantitative Aptitude': Cpu,
  'Logical Reasoning': Brain,
  'Verbal Ability': BookOpen,
  'Data Interpretation': BarChart3,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Quantitative Aptitude': 'text-amber-500 dark:text-amber-400',
  'Logical Reasoning': 'text-purple-500 dark:text-purple-400',
  'Verbal Ability': 'text-emerald-500 dark:text-emerald-400',
  'Data Interpretation': 'text-brand-500 dark:text-brand-400',
};

const PRESETS = [
  { name: 'Quick (8Q)', dist: { 'Quantitative Aptitude': 2, 'Logical Reasoning': 2, 'Verbal Ability': 2, 'Data Interpretation': 2 } },
  { name: 'Standard (20Q)', dist: { 'Quantitative Aptitude': 5, 'Logical Reasoning': 5, 'Verbal Ability': 5, 'Data Interpretation': 5 } },
  { name: 'Comprehensive (40Q)', dist: { 'Quantitative Aptitude': 10, 'Logical Reasoning': 10, 'Verbal Ability': 10, 'Data Interpretation': 10 } },
];

export function AssessmentConfigDetails({
  assessmentConfig,
  setAssessmentConfig,
}: AssessmentConfigDetailsProps) {
  const distribution = assessmentConfig.mcqDistribution || {
    'Quantitative Aptitude': Math.ceil(assessmentConfig.mcqCount / 4),
    'Logical Reasoning': Math.floor((assessmentConfig.mcqCount + 2) / 4),
    'Verbal Ability': Math.floor((assessmentConfig.mcqCount + 1) / 4),
    'Data Interpretation': Math.floor(assessmentConfig.mcqCount / 4),
  };

  const handleCategoryCountChange = (category: string, newCount: number) => {
    const updatedDist = {
      ...distribution,
      [category]: Math.max(0, newCount),
    };
    const totalCount = Object.values(updatedDist).reduce((sum, val) => sum + val, 0);
    setAssessmentConfig({
      ...assessmentConfig,
      mcqCount: totalCount,
      mcqDistribution: updatedDist,
    });
  };

  const resetEqual = () => {
    const equalDist = Math.floor(assessmentConfig.mcqCount / 4);
    const remainder = assessmentConfig.mcqCount % 4;
    const newDist = {
      'Quantitative Aptitude': equalDist + (remainder > 0 ? 1 : 0),
      'Logical Reasoning': equalDist + (remainder > 1 ? 1 : 0),
      'Verbal Ability': equalDist + (remainder > 2 ? 1 : 0),
      'Data Interpretation': equalDist,
    };
    setAssessmentConfig({
      ...assessmentConfig,
      mcqDistribution: newDist,
    });
  };

  return (
    <div className="pl-9 pr-1 pt-2 space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Assessment Questions</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
            {assessmentConfig.mcqCount} MCQs
          </span>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            ≈ {Math.ceil(assessmentConfig.mcqCount * 1.5)} min
          </span>
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Question Distribution
          </span>
          <button
            type="button"
            onClick={resetEqual}
            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            Reset Equal
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {CATEGORIES.map((cat) => {
            const count = distribution[cat] || 0;
            const Icon = CATEGORY_ICONS[cat] || ClipboardCheck;
            const colorClass = CATEGORY_COLORS[cat] || 'text-slate-500';
            return (
              <div key={cat} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-850/80 border border-slate-200/60 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${colorClass}`} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{cat}</span>
                </div>
                <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-white dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => handleCategoryCountChange(cat, count - 1)}
                    className="h-5 w-5 rounded bg-slate-50 dark:bg-slate-750 text-slate-800 dark:text-slate-200 flex items-center justify-center cursor-pointer font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={count <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={count}
                    onChange={(e) => handleCategoryCountChange(cat, Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                    className="w-7 text-center font-extrabold text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCategoryCountChange(cat, Math.min(50, count + 1))}
                    className="h-5 w-5 rounded bg-slate-50 dark:bg-slate-750 text-slate-800 dark:text-slate-200 flex items-center justify-center cursor-pointer font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-1.5 pt-1 items-center">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mr-1">Presets:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                const totalCount = Object.values(preset.dist).reduce((sum, val) => sum + val, 0);
                setAssessmentConfig({
                  ...assessmentConfig,
                  mcqCount: totalCount,
                  mcqDistribution: preset.dist,
                });
              }}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1 border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Passing Threshold</span>
          <span className="text-amber-600 dark:text-amber-400 font-extrabold">{assessmentConfig.passingScore}%</span>
        </div>
        <input
          type="range"
          min="50"
          max="95"
          value={assessmentConfig.passingScore}
          onChange={(e) => setAssessmentConfig({ ...assessmentConfig, passingScore: Number(e.target.value) })}
          className="w-full accent-amber-500 cursor-pointer"
        />
      </div>
    </div>
  );
}
