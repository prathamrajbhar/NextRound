'use client';

import React from 'react';
import { Mail, Save } from '@/lib/lucide-google-icons';

type TemplateKey = 'interview' | 'assessment' | 'offer' | 'rejection';

interface TemplateItem {
  subject: string;
  body: string;
}

interface EmailTemplatesTabProps {
  activeTemplate: TemplateKey;
  setActiveTemplate: (val: TemplateKey) => void;
  templates: Record<TemplateKey, TemplateItem>;
  setTemplates: React.Dispatch<React.SetStateAction<Record<TemplateKey, TemplateItem>>>;
  onSave: () => void;
}

export function EmailTemplatesTab({
  activeTemplate,
  setActiveTemplate,
  templates,
  setTemplates,
  onSave,
}: EmailTemplatesTabProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
            <Mail className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
            Candidate Communication Templates
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Customize automated emails sent to applicants during screening.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'interview', label: 'Interview Invitation' },
          { id: 'assessment', label: 'Assessment Test Link' },
          { id: 'offer', label: 'Offer Letter' },
          { id: 'rejection', label: 'Rejection Courtesy' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTemplate(t.id as TemplateKey)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
              activeTemplate === t.id
                ? 'bg-brand-600 dark:bg-orange-600 text-white border-transparent shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Subject Line
          </label>
          <input
            type="text"
            value={templates[activeTemplate].subject}
            onChange={(e) =>
              setTemplates({
                ...templates,
                [activeTemplate]: { ...templates[activeTemplate], subject: e.target.value },
              })
            }
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Email Body Content
          </label>
          <textarea
            rows={8}
            value={templates[activeTemplate].body}
            onChange={(e) =>
              setTemplates({
                ...templates,
                [activeTemplate]: { ...templates[activeTemplate], body: e.target.value },
              })
            }
            className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none leading-relaxed"
          />
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
            Available Dynamic Variables
          </span>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-brand-600 dark:text-orange-400 font-bold">
            <span>{'{{candidate_name}}'}</span>
            <span>{'{{role_title}}'}</span>
            <span>{'{{company_name}}'}</span>
            <span>{'{{interview_link}}'}</span>
            <span>{'{{assessment_link}}'}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSave}
            className="px-5 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Email Template</span>
          </button>
        </div>
      </div>
    </div>
  );
}
