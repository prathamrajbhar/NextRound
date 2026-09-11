import { Gift } from '@/lib/lucide-google-icons';

export interface NextStepItem {
  icon: typeof Gift;
  label: string;
  desc: string;
  href: string;
  isScreeningModal?: boolean;
  tone: 'emerald' | 'indigo' | 'purple' | 'amber';
  badge: string;
}

export const toneClass: Record<string, string> = {
  emerald:
    'border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 hover:border-emerald-400 dark:hover:border-emerald-600',
  indigo:
    'border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 hover:border-indigo-400 dark:hover:border-indigo-600',
  purple:
    'border-purple-200/80 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 hover:border-purple-400 dark:hover:border-purple-600',
  amber:
    'border-amber-200/80 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 hover:border-amber-400 dark:hover:border-amber-600',
};

export const badgeToneClass: Record<string, string> = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200',
  purple: 'bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200',
  amber: 'bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200',
};
