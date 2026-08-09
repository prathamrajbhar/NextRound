/**
 * Offer terms derived from the Job record so offers reflect the actual posting
 * instead of hardcoded defaults.
 *
 * Job.salary is a display string ("$120k - $150k", "₹25L", "$150,000",
 * "₹1.3L - ₹1.8L") — take the top-of-band as an annual figure. A suffix attached
 * to each figure sets the multiplier: K = 1e3, L/lakh = 1e5, Cr/cr = 1e7.
 * Decimals (₹1.8L) are handled per-match so the lakh multiplier is never skipped.
 * Equity lives on the Job's `thresholds.equity`.
 *
 * Both helpers return `null` when a term is genuinely absent so callers never
 * emit a made-up offer.
 */

function parseSalaryBand(jobSalary: string): number | null {
  const matches = jobSalary.match(/[\d,]+(?:\.\d+)?\s*(?:k|cr|l|lakh|lpa)?/gi);
  if (!matches || matches.length === 0) return null;
  const values = matches.map((m) => {
    const num = parseFloat(m.replace(/,/g, ''));
    const suffix = m.replace(/[\d.,\s]/g, '').toLowerCase();
    if (suffix.startsWith('cr')) return num * 10000000;
    if (suffix === 'l' || suffix.startsWith('lakh') || suffix === 'lpa') return num * 100000;
    if (suffix === 'k') return num * 1000;
    return num;
  });
  const max = Math.max(...values);
  return Number.isFinite(max) ? Math.round(max) : null;
}

export function deriveSalary(jobSalary: string | null | undefined): number | null {
  if (!jobSalary || !jobSalary.trim()) return null;
  return parseSalaryBand(jobSalary);
}

export function deriveEquity(job: { thresholds?: unknown }): string | null {
  const thr = job.thresholds && typeof job.thresholds === 'object' ? (job.thresholds as Record<string, unknown>) : {};
  const equity = thr.equity;
  return typeof equity === 'string' && equity ? equity : null;
}
