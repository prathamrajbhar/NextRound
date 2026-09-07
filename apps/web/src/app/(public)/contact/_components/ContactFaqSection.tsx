'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from '@/lib/lucide-google-icons';
import { CONTACT_FAQS } from './contact.data';

export function ContactFaqSection() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto border-t border-slate-200/60 dark:border-slate-800 pt-16">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-display">
          Contact &amp; Support FAQs
        </h2>
      </div>

      <div className="space-y-3">
        {CONTACT_FAQS.map((faq, idx) => {
          const isOpen = activeFaq === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 shadow-2xs backdrop-blur-md glass-panel overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(isOpen ? null : idx)}
                className="w-full px-6 py-3.5 flex justify-between items-center text-left font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400 flex-shrink-0" />
                  {faq.question}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-6 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 leading-relaxed font-medium">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
