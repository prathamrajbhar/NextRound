'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from '@/lib/lucide-google-icons';

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs: FaqItem[] = [
    {
      question: "How does HireOS verify candidate identity and prevent cheating?",
      answer: "We use client-side tracking to monitor tab switches, background audio disruptions, and face presence. Proctoring alerts are saved for HR review and do not automatically impact candidate scores.",
    },
    {
      question: "How does the AI grading engine ensure unbiased evaluations?",
      answer: "Evaluations are based strictly on pre-defined rubrics. The AI evaluates text transcripts and conceptual answers, completely ignoring personal identifiers like location, university names, or voice tone.",
    },
    {
      question: "Is candidate data secure and isolated?",
      answer: "Yes. HireOS uses multi-tenant data boundaries. Candidate resumes, transcripts, and scores are encrypted and accessible only to authorized managers.",
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mb-24 w-full text-left">
      <div className="text-center mb-12">
        <span className="text-xs font-black text-brand-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
          FAQ
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Everything you need to know about our voice screening assessments.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="h-4.5 w-4.5 text-slate-400 dark:text-slate-550" />
                ) : (
                  <ChevronDown className="h-4.5 w-4.5 text-slate-400 dark:text-slate-550" />
                )}
              </button>

              <div
                className={`transition-all duration-305 ease-in-out overflow-hidden ${
                  isOpen ? 'max-h-[160px] border-t border-slate-100 dark:border-slate-850 p-5' : 'max-h-0'
                }`}
              >
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
