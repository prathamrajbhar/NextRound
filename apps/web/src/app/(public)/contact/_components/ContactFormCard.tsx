'use client';

import React, { useState } from 'react';
import { MessageSquare, Send } from '@/lib/lucide-google-icons';
import { CONTACT_QUICK_PROMPTS } from './contact.data';

export function ContactFormCard() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject] = useState('Enterprise Sales & Demo');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    const subjectLine = encodeURIComponent(subject);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:support@nextround.ai?subject=${subjectLine}&body=${body}`;
  };

  return (
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
            {CONTACT_QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMessage(prompt)}
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
  );
}
