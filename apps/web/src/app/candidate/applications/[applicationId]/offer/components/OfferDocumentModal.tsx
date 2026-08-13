'use client';

import React from 'react';
import { X, Download, Printer, ShieldCheck, Building2 } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgName: string;
  jobTitle: string;
  candidateName: string;
  baseSalary: string;
  joiningDate: string;
}

export function OfferDocumentModal({
  isOpen,
  onClose,
  orgName,
  jobTitle,
  candidateName,
  baseSalary,
  joiningDate,
}: DocumentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-500" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Official Offer Letter Preview
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200 text-xs font-serif leading-relaxed bg-slate-100/50 dark:bg-slate-950/50">
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 space-y-6 font-sans">
            {}
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  {orgName} India Pvt. Ltd.
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Human Resources & Global Recruitment Office
                </p>
              </div>
              <div className="text-right text-[10px] font-mono text-slate-400 dark:text-slate-500">
                <span>REF: {orgName.toUpperCase()}-OFFER-2026</span>
                <span className="block">Date: August 6, 2026</span>
              </div>
            </div>

            {}
            <div className="space-y-1 font-sans">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Dear {candidateName},</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                We are delighted to formally offer you the position of <strong className="text-slate-900 dark:text-white">{jobTitle}</strong> at <strong className="text-brand-600 dark:text-brand-400">{orgName}</strong>.
              </p>
            </div>

            {}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Summary of Employment Terms
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Position Title:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{jobTitle}</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Annual Base CTC:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{baseSalary}</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Target Joining Date:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{joiningDate}</span>
                </li>
              </ul>
            </div>

            {}
            <div className="space-y-2 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              <p>
                This offer is contingent upon successful completion of reference checks, background verification, and your acceptance of company confidentiality policies.
              </p>
            </div>

            {}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Authorized Signatory</span>
                <span className="font-italic text-sm font-serif text-slate-800 dark:text-slate-200">{orgName} Talent Team</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                Digitally Verified
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
