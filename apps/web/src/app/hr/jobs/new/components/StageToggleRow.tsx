'use client';

import React from 'react';

interface StageToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  activeColorClass: string;
}

export function StageToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  activeColorClass,
}: StageToggleRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span
          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
            checked ? activeColorClass : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}
        >
          {icon}
        </span>
        <div>
          <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">
            {title}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
            {description}
          </span>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500" />
      </label>
    </div>
  );
}
