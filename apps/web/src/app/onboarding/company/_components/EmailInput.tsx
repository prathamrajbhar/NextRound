'use client';

import React, { useState } from 'react';
import { Plus, X, Mail } from '@/lib/lucide-google-icons';
import { inputCls, labelCls } from './CompanyOnboardingShell';

interface EmailInputProps {
  label: string;
  placeholder: string;
  emails: string[];
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
}

export function EmailInput({ label, placeholder, emails, onAdd, onRemove }: EmailInputProps) {
  const [draft, setDraft] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = draft.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      onAdd(email);
      setDraft('');
    }
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>
      {emails.length > 0 && (
        <div className="space-y-2 mb-3.5">
          {emails.map((email) => (
            <div
              key={email}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/60 text-sm font-medium text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-orange-400" />
                <span>{email}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(email)}
                className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer p-1"
                aria-label={`Remove ${email}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex gap-2.5">
        <input
          type="email"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 cursor-pointer flex items-center justify-center gap-1.5 border border-slate-800 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4 text-orange-400" />
          Add
        </button>
      </form>
    </div>
  );
}
