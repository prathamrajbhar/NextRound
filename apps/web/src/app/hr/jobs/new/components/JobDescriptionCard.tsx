'use client';

import React, { useRef, useState } from 'react';
import { Sparkles, Bold, Italic, List, Heading, FileText, Wand2, ArrowRight } from '@/lib/lucide-google-icons';

interface JobDescriptionProps {
  jd: string;
  setJd: (val: string) => void;
  title?: string;
  experienceLevel?: string;
  onGenerateJd: (params: { prompt: string; experienceLevel?: string }) => Promise<void>;
  assisting: boolean;
  assistStep?: string;
}

export default function JobDescriptionCard({
  jd,
  setJd,
  title,
  experienceLevel,
  onGenerateJd,
  assisting,
  assistStep,
}: JobDescriptionProps) {
  const [promptText, setPromptText] = useState('');
  const [showPromptBar, setShowPromptBar] = useState(!jd);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = prefix + (selectedText || 'text') + suffix;

    setJd(text.substring(0, start) + replacement + text.substring(end));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText || 'text').length);
    }, 0);
  };

  const handleInlineGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || assisting) return;
    try {
      await onGenerateJd({ prompt: promptText.trim(), experienceLevel });
      setShowPromptBar(false);
    } catch {
      // Handled via toast in hook
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-6 md:p-7 shadow-sm backdrop-blur-md space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5 text-brand-600 dark:text-brand-400">
          <div className="h-8 w-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">Job Specification</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Executive role scope, duties, and core qualifications</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPromptBar((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 ${
            showPromptBar
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
              : 'text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 shadow-brand-500/20'
          }`}
        >
          <Wand2 className="h-3.5 w-3.5" />
          <span>{showPromptBar ? 'Hide AI Writer' : 'AI Generate JD'}</span>
        </button>
      </div>

      {showPromptBar && (
        <form
          onSubmit={handleInlineGenerate}
          className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-900/60 space-y-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-800 dark:text-brand-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Describe the role in your own words:
            </span>
            <span className="text-[10px] text-brand-600/80 dark:text-brand-400 font-semibold">
              AI crafts description, stack &amp; scoring matrix
            </span>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={`e.g. ${experienceLevel || 'Engineer'} to build real-time dashboard and AI platform. Must know PostgreSQL, TypeScript, Python. High ownership startup culture.`}
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-brand-200 dark:border-brand-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {assisting ? (assistStep || 'AI is crafting professional job description...') : `${promptText.length} characters`}
            </span>
            <button
              type="submit"
              disabled={!promptText.trim() || assisting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white font-bold text-xs shadow-sm shadow-brand-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <Sparkles className={`h-3.5 w-3.5 ${assisting ? 'animate-spin' : ''}`} />
              <span>{assisting ? 'Drafting...' : 'Generate Job Description'}</span>
              {!assisting && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 p-1.5 rounded-xl">
        <button
          type="button"
          onClick={() => applyFormat('**', '**')}
          title="Bold"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('*', '*')}
          title="Italic"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('\n- ')}
          title="Bullet List"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('\n### ')}
          title="Heading"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <Heading className="h-4 w-4" />
        </button>
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-2" />
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold ml-auto pr-2 select-none">
          {jd.length} characters
        </span>
      </div>

      <textarea
        ref={textareaRef}
        required
        rows={12}
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Type or paste role overview, duties, and requirements here, or use the AI Generator above..."
        className="w-full px-4 py-3 text-xs font-normal rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all leading-relaxed"
      />
    </div>
  );
}


