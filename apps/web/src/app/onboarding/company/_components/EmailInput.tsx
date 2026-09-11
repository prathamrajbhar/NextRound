'use client';

import React, { useState } from 'react';
import { Plus, X } from '@/lib/lucide-google-icons';
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
        <div className="space-y-1.5 mb-3">
          {emails.map((email) => (
            <div
              key={email}
              className="flex items-center justify-between p-2 rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-slate-200"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={() => onRemove(email)}
                className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                aria-label={`Remove ${email}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 cursor-pointer flex items-center justify-center gap-1 border border-white/15 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </form>
    </div>
  );
}
