'use client';

import React from 'react';
import { Star, Edit, Download, Trash2 } from '@/lib/lucide-google-icons';
import type { ResumeHistoryItem } from './resume.types';

interface ResumeCardProps {
  item: ResumeHistoryItem;
  isPrimary: boolean;
  onSetPrimary: (id: string) => void;
  onEdit: (item: ResumeHistoryItem) => void;
  onDownload: (item: ResumeHistoryItem) => void;
  onDelete: (id: string) => void;
}

export function ResumeCard({
  item,
  isPrimary,
  onSetPrimary,
  onEdit,
  onDownload,
  onDelete,
}: ResumeCardProps) {
  const hasSummary = Boolean(item.generatedResume?.summary);
  const rawSkills = item.generatedResume?.skills;
  const skillsList: string[] = Array.isArray(rawSkills) && typeof rawSkills[0] === 'string'
    ? (rawSkills as string[])
    : ['TypeScript', 'React', 'Node.js', 'System Scale'];

  return (
    <div
      className={`p-4.5 sm:p-5 rounded-2xl border transition-all duration-200 space-y-3 flex flex-col justify-between backdrop-blur-md glass-panel ${
        isPrimary
          ? 'border-brand-500 dark:border-orange-500 bg-brand-500/5 dark:bg-orange-500/10 ring-2 ring-brand-500/20 shadow-md'
          : 'border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
      }`}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-2.5">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                {item.targetRole}
              </h3>
              {isPrimary && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Star className="h-2.5 w-2.5 fill-current" /> Primary
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              Generated{' '}
              {new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-brand-50 dark:bg-orange-950/80 text-brand-600 dark:text-orange-400 border border-brand-200 dark:border-orange-900 flex-shrink-0">
            {typeof item.generatedResume?.atsScore === 'number'
              ? `ATS ${Math.round(item.generatedResume.atsScore)}%`
              : 'ATS'}
          </span>
        </div>

        {hasSummary && item.generatedResume && (
          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed bg-white/50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 font-medium">
            {item.generatedResume.summary}
          </p>
        )}

        <div className="flex flex-wrap gap-1 pt-0.5">
          {skillsList.slice(0, 4).map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Edit className="h-3.5 w-3.5 text-brand-500 dark:text-orange-400" />
            <span>Edit Resume</span>
          </button>

          <button
            type="button"
            onClick={() => onDownload(item)}
            className="py-2 px-3 rounded-xl bg-brand-600 dark:bg-orange-600 text-white text-xs font-black hover:bg-brand-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-0.5 text-[10px]">
          {!isPrimary ? (
            <button
              type="button"
              onClick={() => onSetPrimary(item.id)}
              className="font-extrabold text-slate-500 hover:text-brand-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Star className="h-3 w-3" />
              <span>Set Primary</span>
            </button>
          ) : (
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" /> Active Primary
            </span>
          )}

          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
