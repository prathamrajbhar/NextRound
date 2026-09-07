'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, Plus, X, AlertCircle } from '@/lib/lucide-google-icons';
import { inputCls, labelCls } from './CandidateOnboardingShell';
import { useCitySearch, CitySuggestion } from '@/hooks/useCitySearch';

interface CityAutocompleteInputProps {
  label: string;
  placeholder: string;
  hint?: string;
  tags: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}

export function CityAutocompleteInput({
  label,
  placeholder,
  hint,
  tags,
  onAdd,
  onRemove,
}: CityAutocompleteInputProps) {
  const [draft, setDraft] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, isLoading, error } = useCitySearch(draft, 300);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open dropdown when results or loading or error are active
  useEffect(() => {
    if (draft.trim().length >= 2) {
      setIsOpen(true);
      setHighlightedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [draft, results]);

  const handleSelect = (item: CitySuggestion) => {
    onAdd(item.formatted);
    setDraft('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;

    if (isOpen && highlightedIndex >= 0 && results[highlightedIndex]) {
      handleSelect(results[highlightedIndex]);
      return;
    }

    onAdd(trimmed);
    setDraft('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className={labelCls}>{label}</label>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 shadow-sm"
            >
              <MapPin className="h-3.5 w-3.5 text-orange-400 shrink-0" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:text-white cursor-pointer ml-0.5 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleManualAdd} className="flex gap-2.5 relative">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => {
              if (draft.trim().length >= 2) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`${inputCls} pr-10`}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
            ) : (
              <MapPin className="h-4 w-4 text-slate-500" />
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!draft.trim()}
          className="shrink-0 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-bold text-sm px-5 cursor-pointer flex items-center justify-center border border-slate-700 transition-all shadow-sm"
          aria-label={`Add ${label}`}
        >
          <Plus className="h-4.5 w-4.5" />
        </button>
      </form>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
          {isLoading && results.length === 0 ? (
            <div className="p-4 text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
              Searching global cities...
            </div>
          ) : error ? (
            <div className="p-3.5 text-xs font-bold text-rose-300 bg-rose-500/10 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          ) : results.length > 0 ? (
            <ul className="py-1 divide-y divide-slate-800/50">
              {results.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                      highlightedIndex === index
                        ? 'bg-orange-500/15 text-orange-200'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-slate-800/90 text-orange-400 border border-slate-700/50">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate text-white">{item.name}</div>
                      <div className="text-xs text-slate-400 truncate">
                        {[item.state, item.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : draft.trim().length >= 2 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching cities found. Press <span className="text-orange-400 font-bold">Enter</span> to add &quot;{draft.trim()}&quot;.
            </div>
          ) : null}
        </div>
      )}

      {hint && <p className="text-xs text-slate-400 mt-1.5 leading-normal">{hint}</p>}
    </div>
  );
}
