'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from '@/lib/lucide-google-icons';
import { cn } from '@/lib/cn';
import { CompanyLogo } from './CompanyLogo';

export interface SearchableSelectOption {
  value: string; // unique key — orgId for companies, role title for roles
  label: string; // display string — orgName / role title
  logoUrl?: string;
  sublabel?: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  selected: SearchableSelectOption | null;
  onSelect: (option: SearchableSelectOption) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  error?: string;
  className?: string;
  wrapperClassName?: string;
}

export function SearchableSelect({
  options,
  selected,
  onSelect,
  placeholder = 'Select an option...',
  icon,
  loading = false,
  disabled = false,
  emptyMessage = 'No options available',
  error,
  className,
  wrapperClassName,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? '');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [prevSelectedValue, setPrevSelectedValue] = useState(selected?.value ?? null);

  const nextSelectedValue = selected?.value ?? null;
  if (nextSelectedValue !== prevSelectedValue) {
    setPrevSelectedValue(nextSelectedValue);
    setQuery(selected?.label ?? '');
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.trim().toLowerCase())
  );
  const openDropdown = () => {
    if (query === selected?.label) setQuery('');
    setActiveIndex(-1);
    setIsOpen(true);
  };
  const handleFocus = () => {
    if (!disabled) openDropdown();
  };
  const pick = (option: SearchableSelectOption) => {
    onSelect(option);
    setQuery(option.label);
    setIsOpen(false);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) openDropdown();
      else if (filteredOptions.length > 0)
        setActiveIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (isOpen && filteredOptions.length > 0)
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (event.key === 'Enter') {
      if (isOpen && activeIndex >= 0 && activeIndex < filteredOptions.length) {
        event.preventDefault();
        pick(filteredOptions[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };
  return (
    <div ref={containerRef} className={cn('relative w-full', wrapperClassName)}>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onFocus={handleFocus}
          onBlur={() => setQuery(selected?.label ?? '')}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'w-full py-2.5 text-sm rounded-xl bg-white/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 transition-all glass-input pr-10',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium',
            'focus:outline-none focus:bg-white dark:focus:bg-slate-800',
            icon ? 'pl-10' : 'pl-4',
            disabled && 'opacity-60 cursor-not-allowed',
            error && 'border-danger-300 focus:border-danger-500',
            className
          )}
        />
        {loading ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-brand-500 dark:border-orange-400 border-t-transparent animate-spin" />
        ) : (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (isOpen) setIsOpen(false);
              else openDropdown();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer flex items-center justify-center"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} />
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/60 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-xl backdrop-blur-md glass-panel py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {loading ? (
            <div className="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
              Loading posted options...
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => {
              const isActive = index === activeIndex;
              const isSelected = selected?.value === opt.value;
              return (
                <div
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(opt);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'px-3.5 py-2 text-xs font-semibold cursor-pointer transition-all flex items-center gap-2.5',
                    isActive
                      ? 'bg-brand-600 dark:bg-orange-600 text-white'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/60',
                    isSelected && !isActive && 'text-brand-600 dark:text-orange-400 bg-brand-50/50 dark:bg-orange-950/40'
                  )}
                >
                  {opt.logoUrl ? (
                    <CompanyLogo name={opt.label} logoUrl={opt.logoUrl} size="sm" className="flex-shrink-0" />
                  ) : null}
                  <span className="flex-1 min-w-0 flex flex-col">
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className={cn('text-[10px] font-bold', isActive ? 'text-white/80' : 'text-slate-400')}>
                        {opt.sublabel}
                      </span>
                    )}
                  </span>
                  {isSelected && <span className="text-[10px] font-bold flex-shrink-0">Selected</span>}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
              {query.trim() ? 'No matching posted option' : emptyMessage}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs font-semibold text-danger-600 dark:text-danger-400">{error}</p>
      )}
    </div>
  );
}
