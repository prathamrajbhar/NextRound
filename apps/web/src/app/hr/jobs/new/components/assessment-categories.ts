import React from 'react';
import { Cpu, Brain, BookOpen, BarChart3 } from '@/lib/lucide-google-icons';

export interface CategoryMetaItem {
  label: string;
  icon: React.ElementType;
  color: string;
  badge: string;
}

export const CATEGORY_META: Record<string, CategoryMetaItem> = {
  'Quantitative Aptitude': {
    label: 'Quantitative Aptitude',
    icon: Cpu,
    color: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
  },
  'Logical Reasoning': {
    label: 'Logical Reasoning',
    icon: Brain,
    color: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
  },
  'Verbal Ability': {
    label: 'Verbal Ability',
    icon: BookOpen,
    color: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
  },
  'Data Interpretation': {
    label: 'Data Interpretation',
    icon: BarChart3,
    color: 'text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
  },
};
