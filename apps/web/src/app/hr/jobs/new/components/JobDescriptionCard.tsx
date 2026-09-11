'use client';

import React, { useRef } from 'react';
import { Sparkles, Bold, Italic, List, Heading, FileText } from '@/lib/lucide-google-icons';

interface JobDescriptionProps {
  jd: string;
  setJd: (val: string) => void;
  onAiAssist: () => void;
  assisting: boolean;
}

const TEMPLATES = [
  {
    name: 'Frontend Engineer',
    text: `### Role Overview\nWe are looking for a Senior Frontend Engineer to build high-performance web applications using React, TypeScript, and Next.js.\n\n### Key Responsibilities\n- Design and implement interactive, responsive user interfaces.\n- Optimize loading performance and web vitals.\n- Collaborate with backend engineers to integrate REST/GraphQL APIs.\n\n### Requirements\n- 5+ years of experience with modern frontend frameworks.\n- Strong expertise in TypeScript, TailwindCSS, and state management.\n- Experience with Next.js App Router and server components.`
  },
  {
    name: 'Fullstack / Backend',
    text: `### Role Overview\nWe are looking for a Staff Backend Engineer to scale our distributed cloud services and asynchronous data workflows.\n\n### Key Responsibilities\n- Architect robust, low-latency REST and gRPC microservices.\n- Manage PostgreSQL schemas, query optimization, and Redis caching layers.\n- Ensure 99.9% uptime with comprehensive automated testing and observability.\n\n### Requirements\n- 6+ years building production-grade services in Node.js/Go/Python.\n- Deep understanding of relational databases and event-driven architecture.\n- Experience deploying with Docker, Kubernetes, or serverless runtimes.`
  },
  {
    name: 'Technical PM',
    text: `### Role Overview\nWe are seeking a Technical Product Manager to lead the roadmap and execution of our recruitment automation platform.\n\n### Key Responsibilities\n- Define product requirements, user stories, and feature specifications.\n- Collaborate with engineering, design, and marketing to ship updates weekly.\n- Analyze product metrics and user feedback to prioritize the backlog.\n\n### Requirements\n- 4+ years of experience in product management for B2B SaaS products.\n- Deep understanding of API integrations, LLMs, or AI agent architectures.\n- Excellent communication and stakeholder management skills.`
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

        <button
          type="button"
          onClick={onAiAssist}
          disabled={!jd || assisting}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 dark:text-brand-300 border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <Sparkles className={`h-3.5 w-3.5 ${assisting ? 'animate-spin text-brand-500' : 'text-brand-600 dark:text-brand-400'}`} />
          <span>{assisting ? 'Parsing with Gemini AI...' : 'AI Extract & Enhance'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quick Templates:</span>
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.name}
            type="button"
            onClick={() => setJd(tmpl.text)}
            className="text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-700 px-3 py-1 rounded-xl transition-all cursor-pointer"
          >
            {tmpl.name}
          </button>
        ))}
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
        rows={9}
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Detail responsibilities, tech stacks, experience levels, and culture requirements here..."
        className="w-full px-4 py-3 text-xs font-normal rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all leading-relaxed"
      />
    </div>
  );
}
