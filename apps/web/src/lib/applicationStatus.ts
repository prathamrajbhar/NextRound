










export type ApplicationStatusBadgePalette = 'card' | 'table' | 'banner' | 'hr';

export const APPLICATION_STATUS_BADGE_CLASSES: Record<
  ApplicationStatusBadgePalette,
  Record<string, string>
> = {
  
  card: {
    decided: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    interview_scheduled: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    default: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  },
  
  table: {
    decided: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/60',
    interview_scheduled: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-900/60',
    default: 'bg-brand-50 dark:bg-orange-950/60 text-brand-700 dark:text-orange-300 border-brand-100 dark:border-orange-900/60',
  },
  
  
  
  banner: {
    decided: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    interview_scheduled: 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    default: 'bg-brand-50 dark:bg-orange-950/80 text-brand-700 dark:text-orange-300 border-brand-200 dark:border-orange-800',
  },
  
  hr: {
    decided: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    default: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
};


export function getApplicationStatusBadgeClasses(
  status: string,
  palette: ApplicationStatusBadgePalette
): string {
  const styles = APPLICATION_STATUS_BADGE_CLASSES[palette];
  return styles[status] ?? styles.default;
}


export function formatApplicationStatus(status: string): string {
  return status.replace('_', ' ');
}
