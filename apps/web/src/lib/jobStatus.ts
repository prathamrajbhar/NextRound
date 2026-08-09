/**
 * Job lifecycle status badge colors.
 *
 * The classes below are the exact strings previously duplicated inline in the
 * shared JobCard and the HR job list's status dropdown. Kept byte-identical so
 * consolidation changes no rendered pixel; each surface keeps its own base
 * size/padding classes and appends only the status-dependent colors.
 */

export type JobStatusBadgePalette = 'card' | 'select';

export const JOB_STATUS_BADGE_CLASSES: Record<
  JobStatusBadgePalette,
  Record<string, string>
> = {
  // Shared JobCard — translucent soft fill.
  card: {
    active: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60',
    draft: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60',
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  },
  // HR job list status dropdown — slightly stronger fill than the card.
  select: {
    active: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60',
    draft: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  },
};

/** Status-dependent badge colors for the given palette (falls back to `default`). */
export function getJobStatusBadgeClasses(status: string, palette: JobStatusBadgePalette): string {
  const styles = JOB_STATUS_BADGE_CLASSES[palette];
  return styles[status] ?? styles.default;
}
