'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  
  icon?: React.ReactNode;
  
  error?: string;
  
  hint?: string;
  label?: string;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, wrapperClassName, icon, error, hint, label, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className={cn('w-full', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full py-2.5 text-sm rounded-xl bg-white/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 transition-all glass-input',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium',
              'focus:outline-none',
              icon ? 'pl-10 pr-4' : 'px-4',
              error && 'border-danger-300 focus:border-danger-500',
              props.disabled && 'opacity-60 cursor-not-allowed',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs font-semibold text-danger-600 dark:text-danger-400">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs font-medium text-slate-450 dark:text-slate-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  hint?: string;
  label?: string;
  wrapperClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, wrapperClassName, error, hint, label, id, ...props }, ref) => {
    const areaId = id || props.name;
    return (
      <div className={cn('w-full', wrapperClassName)}>
        {label && (
          <label htmlFor={areaId} className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          className={cn(
            'w-full px-4 py-2.5 text-sm rounded-xl bg-white/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 transition-all glass-input',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium resize-y',
            'focus:outline-none',
            error && 'border-danger-300 focus:border-danger-500',
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-semibold text-danger-600 dark:text-danger-400">{error}</p>}
        {!error && hint && <p className="mt-1.5 text-xs font-medium text-slate-450 dark:text-slate-400">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
