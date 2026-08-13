'use client';

import React from 'react';
import { FileText, Download, ShieldCheck, Maximize2 } from 'lucide-react';

interface EmbeddedDocumentProps {
  orgName: string;
  jobTitle: string;
  candidateName: string;
  baseSalary: string;
  joiningDate: string;
  onOpenModal: () => void;
}

export function EmbeddedDocumentViewer({
  orgName,
  jobTitle,
  candidateName,
  baseSalary,
  joiningDate,
  onOpenModal,
}: EmbeddedDocumentProps) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm space-y-4">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Official Employment Agreement Document
            </h3>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Employment contract document
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onOpenModal}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Full Screen
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {}
      <div className="bg-slate-100 dark:bg-slate-950 p-5 sm:p-7 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5 font-sans shadow-inner max-h-[460px] overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5 text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
          {}
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {orgName} India Private Limited
              </h2>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Corporate Talent Acquisition & Employment Legal Services
              </span>
            </div>
            <div className="text-right text-[10px] font-mono text-slate-400">
              <span>DOC REF: {orgName.toUpperCase()}-2026-CONFIDENTIAL</span>
            </div>
          </div>

          {}
          <div className="space-y-2">
            <p>Dear <strong>{candidateName}</strong>,</p>
            <p>
              We are pleased to formally offer you employment with <strong>{orgName}</strong> in the position of <strong>{jobTitle}</strong>.
            </p>
            <p>
              Your initial Annual Base CTC will be <strong>{baseSalary}</strong>, payable in monthly installments in accordance with standard payroll practices. Your target joining date is scheduled for <strong>{joiningDate}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">Legal Contingencies:</span>
            <p className="text-slate-600 dark:text-slate-400 leading-normal">
              This employment offer is contingent upon successful reference checks, background verification, and your execution of company non-disclosure agreements.
            </p>
          </div>

          {}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
              Offer Document
            </div>
            <span className="text-slate-400 text-[10px]">Page 1 of 1</span>
          </div>
        </div>
      </div>
    </section>
  );
}
