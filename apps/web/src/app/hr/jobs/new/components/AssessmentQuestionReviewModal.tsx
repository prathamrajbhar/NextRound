'use client';

import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui';
import { Check, Sparkles, Cpu, Brain, BookOpen, BarChart3, HelpCircle } from '@/lib/lucide-google-icons';
import { AssessmentQuestion } from '@/types/assessment-question';
import { QuestionReviewItem } from './QuestionReviewItem';

interface AssessmentQuestionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: AssessmentQuestion[];
  onSave: (questions: AssessmentQuestion[]) => void;
  roleTitle?: string;
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string; badge: string }> = {
  'Quantitative Aptitude': {
    label: 'Quantitative Aptitude',
    icon: Cpu,
    color: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
  },
  'Logical Reasoning': {
    label: 'Logical Reasoning',
    icon: Brain,
    color: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
  },
  'Verbal Ability': {
    label: 'Verbal Ability',
    icon: BookOpen,
    color: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
  },
  'Data Interpretation': {
    label: 'Data Interpretation',
    icon: BarChart3,
    color: 'text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  React.useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions, isOpen]);

  const easyCount = useMemo(() => questions.filter((q) => q.difficulty === 'easy').length, [questions]);
  const intCount = useMemo(() => questions.filter((q) => q.difficulty === 'intermediate').length, [questions]);
  const advCount = useMemo(() => questions.filter((q) => q.difficulty === 'advanced').length, [questions]);

  // Unique categories actually present in generated questions
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set);
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (selectedCategory === 'all') return questions;
    return questions.filter((q) => q.category === selectedCategory);
  }, [questions, selectedCategory]);

  const handleDelete = (id: string) => setQuestions((prev) => prev.filter((q) => q.id !== id));
  const handleUpdateQuestionText = (id: string, text: string) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, question: text } : q)));
  const handleSetCorrectIndex = (id: string, index: number) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, correctIndex: index } : q)));
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
      size="2xl"
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
              {roleTitle ? `Generated for ${roleTitle}` : 'Customized question set categorized for this role'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full pt-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{questions.length} total questions</span>
            {easyCount > 0 && (
              <>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{easyCount} Easy</span>
              </>
            )}
            {intCount > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{intCount} Intermediate</span>
              </>
            )}
            {advCount > 0 && (
              <>
                <span>•</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">{advCount} Advanced</span>
              </>
            )}
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
        {/* Category-Wise Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`text-xs font-bold py-1.5 px-3 rounded-lg transition-all ${
              selectedCategory === 'all'
                ? 'bg-white dark:bg-slate-750 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Questions ({questions.length})
          </button>
          {availableCategories.map((cat) => {
            const count = questions.filter((q) => q.category === cat).length;
            const meta = CATEGORY_META[cat] || {
              label: cat,
              icon: HelpCircle,
              color: 'text-slate-600',
              badge: 'bg-slate-100 text-slate-700',
            };
            const Icon = meta.icon;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-750 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                <span>{cat}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Questions List */}
        <div className="space-y-3 max-h-[58vh] overflow-y-auto pr-1">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">No questions found in this category.</p>
            </div>
          ) : (
            filteredQuestions.map((q, qIndex) => (
              <QuestionReviewItem
                key={q.id}
                question={q}
                index={qIndex}
                isEditing={editingId === q.id}
                onToggleEdit={() => setEditingId(editingId === q.id ? null : q.id)}
                onDelete={handleDelete}
                onUpdateQuestionText={handleUpdateQuestionText}
                onSetCorrectIndex={handleSetCorrectIndex}
                onUpdateOption={handleUpdateOption}
              />
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
