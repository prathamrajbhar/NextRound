'use client';

import React from 'react';
import { cn } from '@/lib/cn';
import { CompanyLogo } from './CompanyLogo';
import { SearchableSelectOption } from './SearchableSelect';

interface SearchableSelectDropdownProps {
  isOpen: boolean;
  disabled?: boolean;
  loading: boolean;
  filteredOptions: SearchableSelectOption[];
  selected: SearchableSelectOption | null;
  activeIndex: number;
  query: string;
  emptyMessage: string;
  onPick: (opt: SearchableSelectOption) => void;
  onHoverIndex: (index: number) => void;
}

export function SearchableSelectDropdown({
  isOpen,
  disabled,
  loading,
  filteredOptions,
  selected,
  activeIndex,
  query,
  emptyMessage,
  onPick,
  onHoverIndex,
}: SearchableSelectDropdownProps) {
  if (!isOpen || disabled) return null;

  return (
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
                onPick(opt);
              }}
              onMouseEnter={() => onHoverIndex(index)}
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
  );
}
