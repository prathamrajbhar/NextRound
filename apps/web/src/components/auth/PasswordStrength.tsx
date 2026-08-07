'use client';

const LEVELS = [
  { label: 'Too weak', bar: 'bg-rose-500/80', text: 'text-rose-400' },
  { label: 'Weak', bar: 'bg-rose-500/80', text: 'text-rose-400' },
  { label: 'Fair', bar: 'bg-amber-400/80', text: 'text-amber-300' },
  { label: 'Good', bar: 'bg-orange-400/90', text: 'text-orange-300' },
  { label: 'Strong', bar: 'bg-emerald-500/90', text: 'text-emerald-300' },
] as const;

export function passwordScore(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(LEVELS.length - 1, score);
}

/** Four-segment strength meter shown once the user starts typing a password. */
export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const score = passwordScore(password);
  const level = LEVELS[score];

  return (
    <div className="mt-2.5">
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= score ? level.bar : 'bg-white/10'}`}
          />
        ))}
      </div>
      <p className={`mt-1.5 text-[11px] font-bold ${level.text}`}>{level.label}</p>
    </div>
  );
}
