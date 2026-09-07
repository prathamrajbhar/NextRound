'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FileText, Sparkles, Search, Plus } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { useResumeHistory } from '@/hooks/queries';
import { ResumesListSkeleton } from '@/components/ui';
import type { ResumeHistoryItem, ResumeItem } from './_components/resume.types';
import { printResumeHtml } from './_components/resumePrintTemplate';
import { ResumeCard } from './_components/ResumeCard';
import { ResumeDeleteModal } from './_components/ResumeDeleteModal';
import { EditResumeModal } from './_components/EditResumeModal';

export default function CandidateResumesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ResumeHistoryItem | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data, isLoading } = useResumeHistory();

  const history = useMemo(
    () => ((data?.history ?? []) as ResumeHistoryItem[]),
    [data]
  );

  useEffect(() => {
    if (history.length > 0 && primaryId === null) {
      setPrimaryId(history[0].id);
    }
  }, [history, primaryId]);

  const handleDownloadPdf = (item: ResumeHistoryItem) => {
    printResumeHtml(item);
  };

  const handleSaveEditedResume = (updatedItem: ResumeItem) => {
    const updated = history.map((h) =>
      h.id === updatedItem.id ? { ...h, ...updatedItem } : h
    );
    queryClient.setQueryData(['resume-history'], { history: updated });
  };

  const handleDeleteResume = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const performDelete = async (id: string) => {
    try {
      await apiClient.delete(`/resume-builder/${id}`);
      const remaining = history.filter((h) => h.id !== id);
      queryClient.setQueryData(['resume-history'], { history: remaining });
      if (primaryId === id) {
        setPrimaryId(remaining.length > 0 ? remaining[0].id : null);
      }
    } finally {
      setDeleteConfirmationId(null);
    }
  };

  const filteredHistory = history.filter(
    (item) =>
      item.targetRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.targetCompany && item.targetCompany.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold text-brand-600 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/80 border border-brand-200/60 dark:border-orange-900/60 mb-1.5">
            <Sparkles className="h-3 w-3 text-brand-500 dark:text-orange-400" />
            <span>RESUME VAULT • AI ATS GENERATED DOCUMENTS</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            My Generated ATS Resumes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Edit, preview, and download your AI voice generated ATS resumes.
          </p>
        </div>

        <Link
          href="/candidate/resume-builder"
          className="px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Generate New Resume</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 backdrop-blur-md glass-panel">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by target role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
        </div>

        <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
          {filteredHistory.length} Resumes
        </span>
      </div>

      {isLoading ? (
        <ResumesListSkeleton count={6} />
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 space-y-3">
          <FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
            No Resumes Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'No resumes match your search query.'
              : 'You have not generated any voice ATS resumes yet.'}
          </p>
          {!searchQuery && (
            <Link
              href="/candidate/resume-builder"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 dark:bg-orange-600 text-white font-extrabold text-xs shadow-md mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>Start Voice Session</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHistory.map((item) => (
            <ResumeCard
              key={item.id}
              item={item}
              isPrimary={primaryId === item.id}
              onSetPrimary={setPrimaryId}
              onEdit={setEditingItem}
              onDownload={handleDownloadPdf}
              onDelete={handleDeleteResume}
            />
          ))}
        </div>
      )}

      <EditResumeModal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        resumeItem={editingItem}
        onSave={handleSaveEditedResume}
      />

      <ResumeDeleteModal
        isOpen={Boolean(deleteConfirmationId)}
        onClose={() => setDeleteConfirmationId(null)}
        onConfirm={() => {
          if (deleteConfirmationId) {
            void performDelete(deleteConfirmationId);
          }
        }}
      />
    </div>
  );
}
