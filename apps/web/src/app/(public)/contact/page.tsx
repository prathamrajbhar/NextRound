'use client';

import React, { useState } from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import {
  Mail,
  MapPin,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  Building2,
} from '@/lib/lucide-google-icons';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject] = useState('Enterprise Sales & Demo');
  const [message, setMessage] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const quickPrompts = [
    'We want to test AI voice screening for 50 applicants.',
    'How do I set up automated coding tests for frontend roles?',
    'What is the pricing for enterprise multi-recruiter accounts?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    const subjectLine = encodeURIComponent(subject);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:support@nextround.ai?subject=${subjectLine}&body=${body}`;
  };

  const handleSelectPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  const faqs = [
    {
      question: 'How fast does your team respond to inquiries?',
      answer: 'Our sales and technical support teams respond within 2 hours during business hours. Critical inquiries receive priority response.',
    },
    {
      question: 'Can I request a custom live AI voice demo for my team?',
      answer: 'Yes! Select "Enterprise Sales & Demo" or email sales@nextround.ai to schedule a 15-minute tailored walk-through with our product team.',
    },
    {
      question: 'Is phone or dedicated Slack channel support available?',
      answer: 'Enterprise customers receive a dedicated Slack Connect channel and a named Account Manager available for direct phone calls.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex-1 w-full animate-in fade-in duration-300">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/80 border border-brand-200/60 dark:border-orange-900/60 px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="h-3 w-3" />
            Connect With NextRound
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-3 font-display">
            Let&apos;s Build Your AI Hiring Pipeline
          </h1>

          <p className="mt-4 text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-medium leading-relaxed">
            Have questions about enterprise sales, AI voice screening, or candidate practice? Schedule a demo or send us a message below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto mb-20">
          <div className="lg:col-span-2 rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 sm:p-8 shadow-md backdrop-blur-md glass-panel space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-brand-600 dark:text-orange-400" />
                  Send Us a Message
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Fill out the form below and our team will get back to you within 2 hours.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Karan Malhotra"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="karan@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                  Quick Suggestions (Click to fill)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPrompt(prompt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-orange-950/60 hover:text-brand-600 dark:hover:text-orange-400 transition-colors text-left"
                    >
                      + &quot;{prompt}&quot;
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Message Body
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Describe your hiring needs or inquiry..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 leading-relaxed placeholder:text-slate-400"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Message</span>
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-display border-b border-slate-200/60 dark:border-slate-800 pb-2">
                Direct Contact Channels
              </h4>

              <div className="space-y-3 text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-brand-50 dark:bg-orange-950/60 text-brand-600 dark:text-orange-400 flex items-center justify-center border border-brand-200 dark:border-orange-800 flex-shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Support Email</span>
                    <a href="mailto:support@nextround.ai" className="text-slate-900 dark:text-slate-100 font-extrabold hover:underline">
                      support@nextround.ai
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 flex-shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Enterprise Sales</span>
                    <a href="mailto:sales@nextround.ai" className="text-slate-900 dark:text-slate-100 font-extrabold hover:underline">
                      sales@nextround.ai
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 flex-shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Global Offices</span>
                    <span className="text-slate-900 dark:text-slate-100 font-extrabold block">
                      Bengaluru, KA &amp; San Francisco, CA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto border-t border-slate-200/60 dark:border-slate-800 pt-16">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-display">
              Contact &amp; Support FAQs
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
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
      </main>

      <PublicFooter />
    </div>
  );
}
