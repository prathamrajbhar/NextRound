'use client';

import React, { useRef, useState } from 'react';
import { Sparkles, Bold, Italic, List, Heading, FileText, Wand2 } from '@/lib/lucide-google-icons';
import { AiJdGeneratorModal } from './AiJdGeneratorModal';

interface JobDescriptionProps {
  jd: string;
  setJd: (val: string) => void;
  title: string;
  department: string;
  experienceLevel: string;
  locationType: string;
  onAiAssist: () => void;
  onGenerateJd: (params: {
    title: string;
    department: string;
    experienceLevel: string;
    locationType: string;
    keySkills: string;
    objectives: string;
    tone: string;
  }) => Promise<void>;
  assisting: boolean;
}

export default function JobDescriptionCard({
  jd,
  setJd,
  title,
  department,
  experienceLevel,
  locationType,
  onAiAssist,
  onGenerateJd,
  assisting,
}: JobDescriptionProps) {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
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

  const handleModalGenerate = async (params: {
    title: string;
    department: string;
    experienceLevel: string;
    locationType: string;
    keySkills: string;
    objectives: string;
    tone: string;
  }) => {
    await onGenerateJd(params);
    setIsGeneratorOpen(false);
  };

  return (
    <>
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-6 md:p-7 shadow-sm backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5 text-brand-600 dark:text-brand-400">
            <div className="h-8 w-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">Job Specification &amp; Responsibilities</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Detailed role expectations, required skillsets, and benefits</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsGeneratorOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-brand-500/20 active:scale-95"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>AI Write Professional JD</span>
            </button>

            <button
              type="button"
              onClick={onAiAssist}
              disabled={!jd || assisting}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className={`h-3.5 w-3.5 ${assisting ? 'animate-spin text-brand-500' : 'text-slate-500'}`} />
              <span>{assisting ? 'Parsing...' : 'AI Re-parse'}</span>
            </button>
          </div>
        </div>

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
          rows={11}
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Click 'AI Write Professional JD' above to auto-generate a comprehensive, high-tier description or paste your custom role specifications here..."
          className="w-full px-4 py-3 text-xs font-normal rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all leading-relaxed"
        />
      </div>

      <AiJdGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        initialTitle={title}
        initialDepartment={department}
        initialExperienceLevel={experienceLevel}
        initialLocationType={locationType}
        onGenerate={handleModalGenerate}
        loading={assisting}
      />
    </>
  );
}

