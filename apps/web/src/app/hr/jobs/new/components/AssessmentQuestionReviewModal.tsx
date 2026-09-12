'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui';
import { Check, CheckCircle2, Trash2, Sparkles, Layers, AlertCircle, Edit, RotateCcw } from '@/lib/lucide-google-icons';
import { AssessmentQuestion, AssessmentDifficulty } from '@/types/assessment-question';

interface AssessmentQuestionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: AssessmentQuestion[];
  onSave: (questions: AssessmentQuestion[]) => void;
  roleTitle?: string;
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

export function AssessmentQuestionReviewModal({
  isOpen,
  onClose,
  questions: initialQuestions,
  onSave,
  roleTitle,
}: AssessmentQuestionReviewModalProps) {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(initialQuestions);
  const [selectedTab, setSelectedTab] = useState<'all' | AssessmentDifficulty>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sync state when initialQuestions change or modal opens
  React.useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions, isOpen]);

  const easyCount = questions.filter((q) => q.difficulty === 'easy').length;
  const intCount = questions.filter((q) => q.difficulty === 'intermediate').length;
  const advCount = questions.filter((q) => q.difficulty === 'advanced').length;

  const filteredQuestions = selectedTab === 'all'
    ? questions
    : questions.filter((q) => q.difficulty === selectedTab);

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleUpdateQuestionText = (id: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question: text } : q))
    );
  };

  const handleSetCorrectIndex = (id: string, index: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, correctIndex: index } : q))
    );
  };

  const handleUpdateOption = (id: string, optionIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const newOptions = [...q.options];
        newOptions[optionIndex] = text;
        return { ...q, options: newOptions };
      })
    );
  };

  const handleApply = () => {
    onSave(questions);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Review AI-Generated Assessment Questions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {roleTitle ? `Generated for ${roleTitle}` : 'Customized question set for this job'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full pt-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{questions.length} total questions</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{easyCount} Easy</span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{intCount} Mid</span>
            <span>•</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">{advCount} Adv</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={questions.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Set as Assessment ({questions.length} Qs)</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tier Tabs Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedTab('all')}
            className={`flex-1 text-xs font-bold py-1.5 px-2.5 rounded-lg transition-all ${
              selectedTab === 'all'
                ? 'bg-white dark:bg-slate-750 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Questions ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('easy')}
            className={`flex-1 text-xs font-bold py-1.5 px-2.5 rounded-lg transition-all ${
              selectedTab === 'easy'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            Easy ({easyCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('intermediate')}
            className={`flex-1 text-xs font-bold py-1.5 px-2.5 rounded-lg transition-all ${
              selectedTab === 'intermediate'
                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-amber-600'
            }`}
          >
            Intermediate ({intCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('advanced')}
            className={`flex-1 text-xs font-bold py-1.5 px-2.5 rounded-lg transition-all ${
              selectedTab === 'advanced'
                ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-purple-600'
            }`}
          >
            Advanced ({advCount})
          </button>
        </div>

        {/* Questions List */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">No questions found in this category.</p>
            </div>
          ) : (
            filteredQuestions.map((q, qIndex) => {
              const badge = DIFFICULTY_BADGES[q.difficulty] || DIFFICULTY_BADGES.intermediate;
              const isEditing = editingId === q.id;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl p-4 bg-white dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-400">#{qIndex + 1}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {q.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingId(isEditing ? null : q.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={isEditing ? 'Done Editing' : 'Edit Question Text'}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={q.question}
                      onChange={(e) => handleUpdateQuestionText(q.id, e.target.value)}
                      className="w-full text-xs font-medium rounded-xl p-2 bg-slate-50 dark:bg-slate-800 border border-brand-300 dark:border-brand-700 focus:outline-none"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {q.question}
                    </p>
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIndex) => {
                      const isCorrect = q.correctIndex === optIndex;

                      return (
                        <div
                          key={optIndex}
                          onClick={() => handleSetCorrectIndex(q.id, optIndex)}
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
                              onChange={(e) => handleUpdateOption(q.id, optIndex, e.target.value)}
                              className="w-full bg-transparent text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="truncate">{opt}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
                      <strong className="text-slate-700 dark:text-slate-300">Explanation:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
