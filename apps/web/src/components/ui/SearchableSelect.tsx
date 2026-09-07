'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from '@/lib/lucide-google-icons';
import { cn } from '@/lib/cn';
import { SearchableSelectDropdown } from './SearchableSelectDropdown';

export interface SearchableSelectOption {
  value: string;
  label: string;
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

      <SearchableSelectDropdown
        isOpen={isOpen}
        disabled={disabled}
        loading={loading}
        filteredOptions={filteredOptions}
        selected={selected}
        activeIndex={activeIndex}
        query={query}
        emptyMessage={emptyMessage}
        onPick={pick}
        onHoverIndex={setActiveIndex}
      />

      {error && (
        <p className="mt-1.5 text-xs font-semibold text-danger-600 dark:text-danger-400">{error}</p>
      )}
    </div>
  );
}
