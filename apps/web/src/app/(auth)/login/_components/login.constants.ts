import { Activity, LayoutDashboard, ShieldCheck } from '@/lib/lucide-google-icons';
import { AuthBenefit } from '@/components/auth/AuthShell';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LOGIN_BENEFITS: AuthBenefit[] = [
  {
    icon: LayoutDashboard,
    title: 'One workspace for hiring',
    description: 'Jobs, candidates, interviews and offers — managed from a single dashboard.',
  },
  {
    icon: Activity,
    title: 'Live multi-stage scorecards',
    description: 'Follow structured evaluations in real time as every candidate progresses.',
  },
  {
    icon: ShieldCheck,
    title: 'Org-scoped by design',
    description: 'Role-based access keeps each tenant’s data isolated and auditable.',
  },
];
