import {
  TalentPoolCandidate,
  QuestionBankItem,
  OnboardingRecord,
  CandidatePortfolio,
  SuccessPrediction
} from './extendedTypes';

export const mockTalentPool: TalentPoolCandidate[] = [
  { id: 'tp-1', name: 'Ishaan Kapoor', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', currentTitle: 'Senior DevOps Engineer', currentCompany: 'Freshworks', location: 'Chennai, TN', skills: ['Kubernetes', 'Terraform', 'AWS', 'Go'], source: 'LinkedIn', sourcedDate: '2026-06-20', tags: ['DevOps Engineer', 'High priority'], status: 'contacted', matchScore: 88, lastContactDate: '2026-06-22' },
  { id: 'tp-2', name: 'Meghana Reddy', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', currentTitle: 'Staff Software Engineer', currentCompany: 'Uber', location: 'Bengaluru, KA', skills: ['Distributed Systems', 'Go', 'Kafka'], source: 'Referral', sourcedDate: '2026-06-15', tags: ['Backend', 'Referral by Karthik R.'], status: 'in_pipeline', matchScore: 94, notes: 'Referred for Staff Infrastructure Engineer role. Strong system design background.', lastContactDate: '2026-07-01' },
  { id: 'tp-3', name: 'Yash Oberoi', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', currentTitle: 'Frontend Engineer', currentCompany: 'CRED', location: 'Bengaluru, KA', skills: ['React', 'TypeScript', 'Design Systems'], source: 'GitHub', sourcedDate: '2026-07-01', tags: ['Frontend'], status: 'new', matchScore: 79 }
];

export const mockQuestionBank: QuestionBankItem[] = [
  { id: 'qb-1', question: 'How would you design a rate limiter for a public API handling 50k requests/sec?', category: 'system_design', role: 'Backend Engineer', difficulty: 'hard', tags: ['scalability', 'distributed systems'], usageCount: 34, avgScore: 74, idealAnswerNotes: 'Look for token bucket / sliding window discussion.', createdBy: 'Karthik Rajan' },
  { id: 'qb-2', question: 'Tell me about a time you disagreed with a product decision. How did you handle it?', category: 'behavioral', role: 'All roles', difficulty: 'medium', tags: ['communication', 'conflict resolution'], usageCount: 58, avgScore: 81, idealAnswerNotes: 'Strong answers show structured escalation.', createdBy: 'Priyanka Das' }
];

export const mockOnboarding: OnboardingRecord[] = [
  {
    id: 'onboard-1',
    applicationId: 'app-505',
    candidateName: 'Aarav Sharma',
    candidateAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    jobTitle: 'Product Manager — Payments Flow',
    orgName: 'Razorpay',
    startDate: '2026-08-01',
    buddyName: 'Sanya Kapoor',
    managerName: 'Priyanka Das',
    progressPercent: 62,
    tasks: [
      { id: 'ot-1', title: 'Sign employment contract & NDA', category: 'paperwork', owner: 'New Hire', status: 'completed', dueDate: '2026-07-10' },
      { id: 'ot-2', title: 'Provision laptop & peripherals', category: 'equipment', owner: 'IT', status: 'completed', dueDate: '2026-07-25' }
    ]
  }
];

export const mockPortfolios: CandidatePortfolio[] = [
  {
    slug: 'ananya-iyer',
    applicationId: 'app-501',
    name: 'Ananya Iyer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    headline: 'Senior Frontend Engineer — Performance & Design Systems',
    location: 'Bengaluru, KA',
    bio: 'I build fast, accessible interfaces at scale.',
    skills: ['React', 'Next.js', 'TypeScript', 'Web Performance Optimization', 'CSS Architecture'],
    yearsExperience: 6,
    achievements: ['Reduced checkout page CLS by 78% through layout-stability engineering'],
    projects: [
      { title: 'Virtualized Menu Renderer', description: 'Open-source virtualization library.', tags: ['React', 'Performance'], link: 'https://github.com/ananyaiyer/virtual-menu' }
    ],
    verifiedScores: [
      { label: 'Technical Assessment (AI-verified)', score: 92 }
    ],
    socialLinks: [
      { label: 'GitHub', url: 'https://github.com/ananyaiyer' }
    ],
    isPublic: true
  }
];

export const mockSuccessPredictions: SuccessPrediction[] = [
  {
    applicationId: 'app-501',
    successProbability: 91,
    confidenceLevel: 'high',
    contributingFactors: [
      { factor: 'Technical assessment score in top 5% of historical hires', impact: 'positive', weight: 32 }
    ],
    similarCandidates: [
      { applicationId: 'sim-hist-1', name: 'Karthik Subramaniam', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', similarityScore: 94, outcome: 'hired_success', sharedTraits: ['React performance specialization'], jobTitle: 'Senior Frontend Engineer', orgName: 'Swiggy' }
    ],
    retentionForecast12mo: 88,
    performanceForecast: 'top_performer'
  }
];
