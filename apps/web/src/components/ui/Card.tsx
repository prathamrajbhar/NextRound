'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export type CardAccent = 'none' | 'indigo' | 'emerald' | 'purple' | 'amber' | 'rose';

const accentClass: Record<CardAccent, string> = {
  none: '',
  indigo: 'glass-card-indigo',
  emerald: 'glass-card-emerald',
  purple: 'glass-card-purple',
  amber: '',
  rose: '',
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: CardAccent;
  
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, accent = 'none', hoverable = true, padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass-card',
          hoverable && 'glass-panel-hover',
          accentClass[accent],
          paddingClass[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between gap-3 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5', className)} {...props}>
      {children}
    </p>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-slate-100/70 dark:border-slate-800 flex items-center gap-3', className)} {...props}>
      {children}
    </div>
  );
}
