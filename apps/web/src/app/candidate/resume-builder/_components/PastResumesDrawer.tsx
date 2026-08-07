'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  Calendar,
  ExternalLink,
  Loader2,
} from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import { GeneratedResumeData } from '../../resumes/_components/EditResumeModal';

interface ResumeHistoryItem {
  id: string;
  targetRole: string;
  targetCompany: string;
  status: string;
  generatedResume: GeneratedResumeData | null;
  resumePdfUrl: string | null;
  createdAt: string;
  endedAt: string | null;
}

interface PastResumesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResume?: (resume: GeneratedResumeData) => void;
}

export function PastResumesDrawer({ isOpen, onClose, onSelectResume }: PastResumesDrawerProps) {
  const [history, setHistory] = useState<ResumeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ history: ResumeHistoryItem[] }>('/resume-builder/history');
      if (res?.history) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error('Failed to fetch resume builder history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchHistory();
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, fetchHistory]);

  const handleCopyText = (item: ResumeHistoryItem) => {
    if (!item.generatedResume) return;
    const r = item.generatedResume;
    const fullText = `${r.name || 'Candidate Name'}\n${r.title || item.targetRole} | ${r.email || ''}\n\nSUMMARY\n${r.summary || ''}\n\nEXPERIENCE\n` +
      ((r.experience as Array<{ role?: string; company?: string; highlights?: string[] }>) || [])
        .map((e) => `${e.role || ''} - ${e.company || ''}\n` + (e.highlights || []).map((h: string) => `• ${h}`).join('\n'))
        .join('\n\n');
    
    navigator.clipboard.writeText(fullText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-brand-50 dark:bg-orange-950/80 border border-brand-200 dark:border-orange-900 flex items-center justify-center text-brand-600 dark:text-orange-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Past Generated Resumes</h2>
              <p className="text-[10px] text-slate-500 font-semibold">Your AI Voice Generated Resume History</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2 text-xs font-semibold">
              <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
              <span>Loading resume vault...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Sparkles className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No generated resumes found.</p>
              <p className="text-[10px] text-slate-500">Complete a 15-minute voice session to generate your first ATS resume.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{item.targetRole}</h3>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="capitalize font-bold text-brand-600 dark:text-orange-400">{item.status}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-brand-50 dark:bg-orange-950/80 text-brand-600 dark:text-orange-400 border border-brand-200 dark:border-orange-900">
                    ATS Ready
                  </span>
                </div>

                {item.generatedResume?.summary && (
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    {item.generatedResume.summary}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => handleCopyText(item)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {copiedId === item.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedId === item.id ? 'Copied!' : 'Copy Text'}</span>
                  </button>

                  {item.resumePdfUrl ? (
                    <a
                      href={item.resumePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 rounded-xl bg-brand-600 dark:bg-orange-600 text-white text-[10px] font-extrabold hover:bg-brand-700 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Download className="h-3 w-3" />
                      <span>PDF</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => item.generatedResume && onSelectResume?.(item.generatedResume)}
                      className="py-1.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-extrabold hover:bg-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>View</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-center">
          <p className="text-[10px] text-slate-400 font-semibold">Resumes are automatically parsed and saved to your profile vault.</p>
        </div>

      </div>
    </div>
  );
}
