'use client';

import React from 'react';
import type { AuthIcon } from '@/components/auth/AuthShell';

interface AuthFieldProps {
  id: string;
  label: string;
  icon: AuthIcon;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  autoFocus?: boolean;
  error?: string;
  labelRight?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

const inputCls =
  'h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 text-sm text-white placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-orange-400/20';

export default function AuthField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  required,
  autoFocus,
  error,
  labelRight,
  rightSlot,
}: AuthFieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="block text-[11px] font-bold text-slate-400">
          {label}
        </label>
        {labelRight}
      </div>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputCls} ${rightSlot ? 'pr-10' : 'pr-4'} ${error
              ? 'border-rose-500/50 focus:border-rose-400 focus:ring-rose-400/20'
              : 'focus:border-orange-400/70 focus:bg-slate-950/80'
            }`}
        />
        {rightSlot}
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[11px] font-semibold text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
