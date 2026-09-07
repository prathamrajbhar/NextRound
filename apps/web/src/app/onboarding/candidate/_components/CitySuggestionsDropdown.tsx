'use client';

import React from 'react';
import { MapPin, Loader2, AlertCircle } from '@/lib/lucide-google-icons';
import { CitySuggestion } from '@/hooks/useCitySearch';

interface CitySuggestionsDropdownProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  results: CitySuggestion[];
  highlightedIndex: number;
  draft: string;
  onSelect: (item: CitySuggestion) => void;
  onHighlight: (index: number) => void;
}

export function CitySuggestionsDropdown({
  isOpen,
  isLoading,
  error,
  results,
  highlightedIndex,
  draft,
  onSelect,
  onHighlight,
}: CitySuggestionsDropdownProps) {
  if (!isOpen) return null;

  return (
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
                onClick={() => onSelect(item)}
                onMouseEnter={() => onHighlight(index)}
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
  );
}
