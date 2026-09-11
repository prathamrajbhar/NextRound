'use client';

import React from 'react';
import { Plus, X } from '@/lib/lucide-google-icons';
import { inputCls, labelCls } from './CandidateOnboardingShell';

interface TagInputProps {
  label: string;
  placeholder: string;
  hint?: string;
  tags: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}

export function TagInput({ label, placeholder, hint, tags, onAdd, onRemove }: TagInputProps) {
  const [draft, setDraft] = React.useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(draft);
    setDraft('');
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 shadow-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:text-white cursor-pointer"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex gap-2.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm px-5 cursor-pointer flex items-center justify-center border border-slate-700 transition-all shadow-sm"
          aria-label={`Add ${label}`}
        >
          <Plus className="h-4.5 w-4.5" />
        </button>
      </form>
      {hint && <p className="text-xs text-slate-400 mt-1.5 leading-normal">{hint}</p>}
    </div>
  );
}
