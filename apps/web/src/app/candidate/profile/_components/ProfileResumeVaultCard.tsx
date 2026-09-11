'use client';

import React from 'react';
import {
  FileText,
  UploadCloud,
  Download,
  Trash2,
  Loader2,
  Sparkles,
  Zap,
} from '@/lib/lucide-google-icons';

interface ResumeHistoryItem {
  id: string;
  targetRole: string;
  createdAt: string;
  resumePdfUrl?: string;
}

interface ProfileResumeVaultCardProps {
  resumeName: string;
  resumeDate: string;
  resumeUrl: string;
  uploadingResume: boolean;
  generatedResumes: ResumeHistoryItem[];
  onUploadResume: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteResume: () => void;
}

export function ProfileResumeVaultCard({
  resumeName,
  resumeDate,
  resumeUrl,
  uploadingResume,
  generatedResumes,
  onUploadResume,
  onDeleteResume,
}: ProfileResumeVaultCardProps) {
  return (
    <>
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 flex items-center justify-between">
          <span>Active Resume PDF</span>
          <span className="text-[10px] text-emerald-500 font-bold">PDF Format</span>
        </h3>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-brand-50/50 dark:bg-orange-950/40 border border-brand-100 dark:border-orange-900/60 text-brand-700 dark:text-orange-300 shadow-sm">
          <FileText className="h-6 w-6 flex-shrink-0 text-brand-600 dark:text-orange-400" />
          <div className="min-w-0 flex-grow">
            <span className="text-xs font-extrabold truncate block">{resumeName}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold block mt-0.5">
              {resumeDate || 'PDF Resume Attached'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {resumeUrl && (
              <>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-orange-400 cursor-pointer transition-colors"
                  title="Download Resume"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={onDeleteResume}
                  disabled={uploadingResume}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer transition-colors disabled:opacity-50"
                  title="Delete Resume"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        <label className="w-full text-center text-xs font-extrabold text-brand-600 dark:text-orange-400 hover:text-brand-700 dark:hover:text-orange-300 transition-colors py-3 cursor-pointer block border border-dashed border-brand-200 dark:border-orange-900/60 bg-brand-50/10 dark:bg-orange-950/20 rounded-2xl shadow-inner hover:bg-brand-50/20 dark:hover:bg-orange-950/40">
          {uploadingResume ? (
            <div className="flex flex-col items-center justify-center gap-1">
              <Loader2 className="h-5 w-5 text-brand-500 dark:text-orange-400 animate-spin" />
              <span>Uploading &amp; Syncing details...</span>
            </div>
          ) : (
            <>
              <UploadCloud className="h-5 w-5 mx-auto mb-1 text-brand-500 dark:text-orange-400" />
              <span>Upload &amp; Sync Resume PDF</span>
            </>
          )}
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={onUploadResume}
            disabled={uploadingResume}
            className="hidden"
          />
        </label>
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
            Generated ATS Resumes Vault
          </h3>
          <span className="text-[10px] font-extrabold text-slate-400">{generatedResumes.length} Saved</span>
        </div>

        {generatedResumes.length === 0 ? (
          <div className="text-center py-6 text-slate-400 space-y-1">
            <FileText className="h-6 w-6 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-semibold">No AI Voice Resumes Yet</p>
            <p className="text-[10px] text-slate-500">Generate resumes using AI Voice Studio.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {generatedResumes.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block truncate">
                    {item.targetRole}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <a
                  href={item.resumePdfUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-orange-950/80 text-brand-600 dark:text-orange-400 border border-brand-200 dark:border-orange-900 text-[10px] font-extrabold hover:bg-brand-100 transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  <Zap className="h-3 w-3" />
                  <span>View PDF</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
