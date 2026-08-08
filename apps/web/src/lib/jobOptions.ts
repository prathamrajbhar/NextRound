import type { Job } from '@/types';
import type { SearchableSelectOption } from '@/components/ui';

export interface DerivedJobOptions {
  /** Unique posted companies (deduped by orgId), newest first, with open-role counts. */
  companies: SearchableSelectOption[];
  /** orgId -> unique job titles posted by that company. */
  rolesByOrgId: Record<string, string[]>;
}

/** Accepts the `/jobs` payload in either the flat-array or `{ jobs: [...] }` shape. */
export function normalizeJobs(raw: unknown): Job[] {
  if (Array.isArray(raw)) return raw as Job[];
  if (raw && typeof raw === 'object' && 'jobs' in raw && Array.isArray((raw as { jobs: Job[] }).jobs)) {
    return (raw as { jobs: Job[] }).jobs;
  }
  return [];
}

/** Derives posted-company + per-company role options from live job listings. */
export function deriveJobOptions(jobs: Job[]): DerivedJobOptions {
  const byOrg = new Map<string, { name: string; logoUrl: string; roles: Set<string> }>();
  for (const job of jobs) {
    let entry = byOrg.get(job.orgId);
    if (!entry) {
      entry = { name: job.orgName, logoUrl: job.orgLogo, roles: new Set<string>() };
      byOrg.set(job.orgId, entry);
    }
    if (job.title) entry.roles.add(job.title);
  }

  const companies: SearchableSelectOption[] = [];
  const rolesByOrgId: Record<string, string[]> = {};
  for (const [orgId, entry] of byOrg) {
    const roles = Array.from(entry.roles);
    companies.push({
      value: orgId,
      label: entry.name,
      logoUrl: entry.logoUrl || undefined,
      sublabel: `${roles.length} open role${roles.length === 1 ? '' : 's'}`,
    });
    rolesByOrgId[orgId] = roles;
  }
  return { companies, rolesByOrgId };
}
