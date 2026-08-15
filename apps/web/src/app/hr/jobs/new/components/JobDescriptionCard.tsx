'use client';

import React, { useRef } from 'react';
import { Sparkles, Bold, Italic, List, Heading, FileText } from 'lucide-react';

interface JobDescriptionProps {
  jd: string;
  setJd: (val: string) => void;
  onAiAssist: () => void;
  assisting: boolean;
}

const TEMPLATES = [
  {
    name: 'Software Engineer',
    text: `### Role Overview\nWe are looking for a Senior Frontend Engineer to build high-performance web applications using React, TypeScript, and Next.js.\n\n### Key Responsibilities\n- Design and implement interactive, responsive user interfaces.\n- Optimize loading performance and web vitals.\n- Collaborate with backend engineers to integrate REST/GraphQL APIs.\n\n### Requirements\n- 5+ years of experience with modern frontend frameworks.\n- Strong expertise in TypeScript, TailwindCSS, and state management.\n- Experience with Next.js App Router and server components.`
  },
  {
    name: 'Product Manager',
    text: `### Role Overview\nWe are seeking a Technical Product Manager to lead the roadmap and execution of our recruitment automation platform.\n\n### Key Responsibilities\n- Define product requirements, user stories, and feature specifications.\n- Collaborate with engineering, design, and marketing to ship updates weekly.\n- Analyze product metrics and user feedback to prioritize the backlog.\n\n### Requirements\n- 4+ years of experience in product management for B2B SaaS products.\n- Deep understanding of API integrations, LLMs, or AI agent architectures.\n- Excellent communication and stakeholder management skills.`
  },
  {
    name: 'UX Designer',
    text: `### Role Overview\nWe are looking for a Senior Product Designer to craft intuitive, beautiful, and accessible recruitment workflows.\n\n### Key Responsibilities\n- Design wireframes, user flows, and interactive mockups.\n- Build and maintain our premium glassmorphic UI component library.\n- Conduct user research sessions and translate insights into design solutions.\n\n### Requirements\n- 5+ years of experience in UX/UI design for web and mobile products.\n- Proficiency in Figma and creating reusable design systems.\n- Strong portfolio demonstrating interactive prototyping and clean aesthetics.`
  }
];

export default function JobDescriptionCard({
  jd,
  setJd,
  onAiAssist,
  assisting,
}: JobDescriptionProps) {
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

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
      <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <FileText className="h-5 w-5" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Job Description</h3>
        </div>
        <button
          type="button"
          onClick={onAiAssist}
          disabled={!jd || assisting}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 dark:hover:bg-purple-900/80 px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles className={`h-4 w-4 ${assisting ? 'animate-spin text-purple-600 dark:text-purple-400' : 'text-purple-600 dark:text-purple-400'}`} />
          {assisting ? 'AI is reading JD...' : 'AI Auto-Fill'}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">Sample Templates:</span>
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.name}
            type="button"
            onClick={() => setJd(tmpl.text)}
            className="text-[11px] font-extrabold bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 px-3 py-1 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            {tmpl.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-1.5 rounded-xl">
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
          title="Header"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <Heading className="h-4 w-4" />
        </button>
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-2" />
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold ml-auto pr-2 select-none">
          {jd.length} chars
        </span>
      </div>

      <textarea
        ref={textareaRef}
        required
        rows={10}
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste role responsibilities, required skills, and expectations here or choose a sample template above..."
        className="w-full px-4 py-3.5 text-xs font-medium rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all glass-input leading-relaxed"
      />
    </div>
  );
}
