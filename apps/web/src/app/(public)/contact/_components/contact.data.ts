export interface ContactFaq {
  question: string;
  answer: string;
}

export const CONTACT_QUICK_PROMPTS = [
  'We want to test AI voice screening for 50 applicants.',
  'How do I set up automated coding tests for frontend roles?',
  'What is the pricing for enterprise multi-recruiter accounts?',
];

export const CONTACT_FAQS: ContactFaq[] = [
  {
    question: 'How fast does your team respond to inquiries?',
    answer:
      'Our sales and technical support teams respond within 2 hours during business hours. Critical inquiries receive priority response.',
  },
  {
    question: 'Can I request a custom live AI voice demo for my team?',
    answer:
      'Yes! Select "Enterprise Sales & Demo" or email sales@nextround.ai to schedule a 15-minute tailored walk-through with our product team.',
  },
  {
    question: 'Is phone or dedicated Slack channel support available?',
    answer:
      'Enterprise customers receive a dedicated Slack Connect channel and a named Account Manager available for direct phone calls.',
  },
];
