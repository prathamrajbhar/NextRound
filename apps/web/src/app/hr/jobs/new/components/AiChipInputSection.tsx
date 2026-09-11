'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AiChipInputSectionProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
  onAdd: (val: string) => void;
  onRemove: (val: string) => void;
  placeholder: string;
  badgeClasses: string;
  removeBtnClasses: string;
  focusBorderClasses: string;
  emptyMessage?: string;
}

export function AiChipInputSection({
  title,
  icon,
  items,
  onAdd,
  onRemove,
  placeholder,
  badgeClasses,
  removeBtnClasses,
  focusBorderClasses,
  emptyMessage,
}: AiChipInputSectionProps) {
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    const trimmed = newValue.trim();
    if (trimmed) {
      onAdd(trimmed);
      setNewValue('');
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
        {icon}
        {title}
      </span>
      <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 min-h-[48px] items-center">
        {items.length === 0 && emptyMessage && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic pl-1">
            {emptyMessage}
          </span>
        )}
        {items.map((item) => (
          <span
            key={item}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 group transition-all border ${badgeClasses}`}
          >
            {item}
            <button
              type="button"
              onClick={() => onRemove(item)}
              className={`opacity-70 hover:opacity-100 cursor-pointer p-0.5 ${removeBtnClasses}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1 max-w-[140px] ml-1">
          <input
            type="text"
            placeholder={placeholder}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            className={`w-full bg-transparent border-b border-slate-300 dark:border-slate-700 focus:outline-none text-slate-900 dark:text-slate-100 text-[11px] py-1 font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 ${focusBorderClasses}`}
          />
          <button
            type="button"
            onClick={handleAdd}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
