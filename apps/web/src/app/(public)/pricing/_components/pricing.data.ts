export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  popular: boolean;
  badge: string;
  features: string[];
  buttonText: string;
  href: string;
  highlight: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function getPricingPlans(billingCycle: 'monthly' | 'annual'): PricingPlan[] {
  return [
    {
      name: 'Free Starter Plan',
      price: '₹0',
      period: 'forever',
      description: 'Perfect for small teams experiencing automated technical AI recruitment.',
      popular: false,
      badge: 'Free Tier',
      features: [
        'Post up to 3 active job openings',
        'Automated AI resume screening',
        'Interactive AI voice interview room',
        'Standard candidate scorecards & transcripts',
        'Automated scoring rubrics',
      ],
      buttonText: 'Get Started Free',
      href: '/signup',
      highlight: false,
    },
    {
      name: 'Pro Recruiter',
      price: billingCycle === 'annual' ? '₹3,299' : '₹4,199',
      period: 'per month',
      description: 'Ideal for growing engineering teams automating high-volume pipelines.',
      popular: true,
      badge: 'Most Popular',
      features: [
        'Post up to 15 active job openings',
        'Custom evaluation rubrics & question generator',
        'Online MCQ & LeetCode-style coding tests',
        'Priority AI Voice interviewer (3 persona voices)',
        'Composite scorecard evaluation metrics',
        'Candidate PDF dossier export',
      ],
      buttonText: 'Start 14-Day Free Trial',
      href: '/signup',
      highlight: true,
    },
    {
      name: 'Enterprise Scale',
      price: billingCycle === 'annual' ? '₹9,999' : '₹12,499',
      period: 'per month',
      description: 'Custom evaluation rubrics, team collaboration workflows, and multi-user roles.',
      popular: false,
      badge: 'Enterprise',
      features: [
        'Unlimited active job openings',
        'Custom ATS integration support',
        'Multi-user team roles (Admin, Recruiter, Reviewer)',
        'Candidate engagement & gaze video telemetry',
        'Dedicated SLA & account support manager',
      ],
      buttonText: 'Contact Sales',
      href: '/contact',
      highlight: false,
    },
  ];
}

export const PRICING_FAQS: FaqItem[] = [
  {
    question: 'Is NextRound free to try?',
    answer:
      'Yes! Our Free Starter Plan gives you lifetime access to post up to 3 active jobs, run automated AI resume screening, and conduct AI voice interviews with zero credit card required.',
  },
  {
    question: 'How do AI voice interviews work?',
    answer:
      'When a candidate passes initial screening, they select a 15-minute slot. In our secure voice room, an AI interviewer asks technical questions, records answers, and generates immediate scorecard analytics.',
  },
  {
    question: 'Can I upgrade or downgrade my plan at any time?',
    answer:
      'Absolutely. You can switch between Monthly and Annual billing or upgrade your plan anytime from your Organization Settings tab.',
  },
  {
    question: 'How is candidate privacy protected?',
    answer:
      'All candidate data and interview recordings are strictly encrypted with secure storage and strict role-based access control.',
  },
];
