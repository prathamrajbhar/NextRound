'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui';
import { Sparkles, Wand2, ArrowRight } from '@/lib/lucide-google-icons';

interface AiJdGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: { prompt: string }) => Promise<void>;
  loading: boolean;
}

export function AiJdGeneratorModal({
  isOpen,
  onClose,
  onGenerate,
  loading,
}: AiJdGeneratorModalProps) {
  const [promptText, setPromptText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || loading) return;
    await onGenerate({ prompt: promptText.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Describe What You Want in the Job Description"
      description="Write in your own words what this role is, required tech or skills, experience, and what the person will do. AI will generate a complete, executive, ATS-friendly Job Description."
      icon={<Wand2 className="h-5 w-5 text-brand-500" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="space-y-2">
          <textarea
            required
            autoFocus
            rows={5}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="In your own words, describe the role... (e.g. We need a Senior Fullstack React/Next.js and Node engineer with 5+ years experience to build real-time dashboard and AI voice interview interface. Must know PostgreSQL and Tailwind. Fast-paced startup environment.)"
            className="w-full px-4 py-3 text-xs font-normal rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all leading-relaxed"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>The AI will craft role overview, responsibilities, requirements, and competency rubrics.</span>
            <span>{promptText.length} chars</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/70 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!promptText.trim() || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white font-black text-xs shadow-md shadow-brand-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Sparkles className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'AI Writing Professional JD...' : 'Generate Job Description'}</span>
            {!loading && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </form>
    </Modal>
  );
}
