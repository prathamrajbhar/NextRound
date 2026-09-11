'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle } from '@/lib/lucide-google-icons';
import { inputCls } from './CandidateOnboardingShell';
import { useCitySearch, CitySuggestion } from '@/hooks/useCitySearch';

interface SingleCityInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SingleCityInput({
  value,
  onChange,
  placeholder = 'e.g. Bengaluru, India',
  className = '',
}: SingleCityInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, isLoading, error } = useCitySearch(value, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: CitySuggestion) => {
    onChange(item.formatted);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
        e.preventDefault();
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value.trim().length >= 2) {
              setIsOpen(true);
              setHighlightedIndex(-1);
            } else {
              setIsOpen(false);
            }
          }}
          onFocus={() => {
            if (value.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          className={`${inputCls} pl-10 pr-10 ${className}`}
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-orange-400" />}
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto">
          {isLoading && results.length === 0 ? (
            <div className="p-3.5 text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
              Searching cities...
            </div>
          ) : error ? (
            <div className="p-3 text-xs font-bold text-rose-300 bg-rose-500/10 flex items-center gap-2">
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
          ) : value.trim().length >= 2 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              No matching cities found.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
