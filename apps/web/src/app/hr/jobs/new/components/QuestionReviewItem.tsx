'use client';

import React from 'react';
import { Check, Trash2, Edit } from '@/lib/lucide-google-icons';
import { AssessmentQuestion, AssessmentDifficulty } from '@/types/assessment-question';

interface QuestionReviewItemProps {
  question: AssessmentQuestion;
  index: number;
  isEditing: boolean;
  onToggleEdit: () => void;
  onDelete: (id: string) => void;
  onUpdateQuestionText: (id: string, text: string) => void;
  onSetCorrectIndex: (id: string, index: number) => void;
  onUpdateOption: (id: string, optionIndex: number, text: string) => void;
}

const DIFFICULTY_BADGES: Record<AssessmentDifficulty, { label: string; bg: string; text: string; border: string }> = {
  easy: {
    label: 'Easy',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200/80 dark:border-emerald-800/60',
  },
  intermediate: {
    label: 'Intermediate',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200/80 dark:border-amber-800/60',
  },
  advanced: {
    label: 'Advanced',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200/80 dark:border-purple-800/60',
  },
};

export function QuestionReviewItem({
  question: q,
  index,
  isEditing,
  onToggleEdit,
  onDelete,
  onUpdateQuestionText,
  onSetCorrectIndex,
  onUpdateOption,
}: QuestionReviewItemProps) {
  const badge = DIFFICULTY_BADGES[q.difficulty] || DIFFICULTY_BADGES.intermediate;

  return (
    <div className="rounded-2xl p-4 bg-white dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-400">#{index + 1}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}>
            {badge.label}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {q.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleEdit}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isEditing ? 'Done Editing' : 'Edit Question Text'}
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(q.id)}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            title="Delete Question"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <textarea
          rows={2}
          value={q.question}
          onChange={(e) => onUpdateQuestionText(q.id, e.target.value)}
          className="w-full text-xs font-medium rounded-xl p-2 bg-slate-50 dark:bg-slate-800 border border-brand-300 dark:border-brand-700 focus:outline-none"
        />
      ) : (
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
          {q.question}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {q.options.map((opt, optIndex) => {
          const isCorrect = q.correctIndex === optIndex;

          return (
            <div
              key={optIndex}
              onClick={() => onSetCorrectIndex(q.id, optIndex)}
              className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                isCorrect
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-200 font-semibold'
                  : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 border ${
                  isCorrect
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {isCorrect && <Check className="h-2.5 w-2.5 stroke-[3]" />}
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={opt}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onUpdateOption(q.id, optIndex, e.target.value)}
                  className="w-full bg-transparent text-xs focus:outline-none"
                />
              ) : (
                <span className="truncate">{opt}</span>
              )}
            </div>
          );
        })}
      </div>

      {q.explanation && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
          <strong className="text-slate-700 dark:text-slate-300">Explanation:</strong> {q.explanation}
        </p>
      )}
    </div>
  );
}
