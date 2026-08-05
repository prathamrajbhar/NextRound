import { Application } from './types';

export const mockApplications: Application[] = [
  {
    id: 'app-501',
    candidateName: 'Ananya Iyer',
    candidateEmail: 'ananya.iyer@gmail.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    jobId: 'job-101',
    jobTitle: 'Senior Frontend Engineer — Consumer Platform',
    orgName: 'Swiggy',
    status: 'decided',
    stage: 'Decision',
    appliedDate: '2026-07-02',
    resumeUrl: 'ananya_iyer_cv.pdf',
    skills: ['React', 'Next.js', 'TypeScript', 'Web Performance Optimization', 'CSS Architecture', 'Webpack/Vite'],
    targetRoles: ['Senior Frontend Engineer', 'UI Lead'],
    scores: {
      composite: 89,
      technical: 92,
      communication: 85,
      problemSolving: 90,
      experience: 88,
      confidence: 95
    },
    biasReport: {
      overallScore: 98,
      flaggedPhrases: [],
      genderBiasCheck: 'Passed. Evaluated purely on frontend architectural patterns and system design performance.',
      originBiasCheck: 'Passed. Normalized scoring for regional universities vs tier-1 colleges.',
      explanation: 'The Screening and Evaluation Agents evaluated technical qualifications without identifying markers. Recommendation is highly objective.'
    },
    reasoning: 'Ananya demonstrated exceptional mastery of React Concurrent features, virtualized lists for high-volume menu components, and optimized Next.js prefetching. Her answers during the AI voice interview showed structured communication and clear ownership. She meets the hiring threshold (82%) with a composite score of 89%.',
    decision: 'hire',
    transcript: [
      {
        question: 'How would you optimize list rendering for a food delivery menu containing thousands of nested items?',
        answer: 'I would implement windowed list rendering using react-window or custom virtualization. By rendering only the items visible in the viewport and a small buffer, we keep the DOM node count low, significantly improving scroll performance and reducing layout calculation times. I would also memoize render cards using React.memo and prevent inline function instantiations to avoid unnecessary re-renders.',
        score: 95,
        feedback: 'Extremely accurate description of Server Component serialization and dependency isolation.'
      },
      {
        question: 'Describe how you would debug a layout shift (CLS) bottleneck on the Swiggy checkout page.',
        answer: 'I would use the Chrome DevTools Performance panel or Web Vitals library to isolate the layout shift occurrences. For the checkout page, CLS is often caused by dynamically loaded payment option elements or late CSS stylesheets. I would enforce explicit aspect-ratio values on image placeholders, reserve space for components like dynamic coupon banners, and preload critical stylesheets.',
        score: 88,
        feedback: 'Good demonstration of utilizing performance tooling, though could have expanded on server-side response delays.'
      }
    ],
    audioUrl: '/mock-audio.mp3',
    proctorFlags: [
      { timestamp: '02:15', type: 'Off-screen gaze', severity: 'low', description: 'Candidate looked away from screen for 4 seconds' }
    ],
    engagementSignal: {
      eyeContact: 92,
      speakingRate: 'Normal (142 WPM)',
      confidenceScore: 90
    }
  },
  {
    id: 'app-502',
    candidateName: 'Vikram Malhotra',
    candidateEmail: 'vikram.malhotra@outlook.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    jobId: 'job-102',
    jobTitle: 'Product Manager — Payments Flow',
    orgName: 'Razorpay',
    status: 'interviewed',
    stage: 'Decision',
    appliedDate: '2026-07-01',
    resumeUrl: 'vikram_malhotra_pm.pdf',
    skills: ['Product Strategy', 'SQL Analytics', 'API Integration', 'Payment Gateways', 'User Research'],
    targetRoles: ['Product Manager', 'Technical PM'],
    scores: {
      composite: 74,
      technical: 70,
      communication: 80,
      problemSolving: 72,
      experience: 75,
      confidence: 88
    },
    biasReport: {
      overallScore: 99,
      flaggedPhrases: [],
      genderBiasCheck: 'Passed.',
      originBiasCheck: 'Passed.',
      explanation: 'Evaluation metrics show uniform performance ratings.'
    },
    reasoning: 'Candidate showed great skills in communication and API design, but had gaps in pricing optimization calculations and multi-tenant ledger setups. The composite score of 74% falls below Razorpay\'s threshold of 85%.',
    decision: 'hold',
    transcript: [
      {
        question: 'How would you design a product roadmap for localizing payment methods in Southeast Asia?',
        answer: 'I would first review transaction volumes to identify key payment channels (e.g., e-wallets, bank transfers). Then, I would prioritize standardizing the API layer so merchants can add new options with minimal code. Finally, I would release it in stages starting with high-volume merchant partners to gather feedback and monitor success rates.',
        score: 74,
        feedback: 'Correct high-level concept but lacks technical explanation of localization and regulatory requirements.'
      }
    ],
    audioUrl: '/mock-audio-2.mp3',
    proctorFlags: [],
    engagementSignal: {
      eyeContact: 85,
      speakingRate: 'Slow (115 WPM)',
      confidenceScore: 78
    }
  },
  {
    id: 'app-503',
    candidateName: 'Rohan Deshmukh',
    candidateEmail: 'rohan.deshmukh@gmail.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    jobId: 'job-101',
    jobTitle: 'Senior Frontend Engineer — Consumer Platform',
    orgName: 'Swiggy',
    status: 'hr_round',
    stage: 'HR Round',
    hrRoundStatus: 'SCHEDULED',
    hrRoundScheduledAt: '2026-07-24 19:30:00',
    appliedDate: '2026-07-03',
    resumeUrl: 'rohan_deshmukh_resume.pdf',
    skills: ['React', 'TypeScript', 'Node.js', 'Vite', 'State Management', 'System Architecture'],
    targetRoles: ['Frontend Developer', 'Software Engineer'],
    scheduledSlots: ['2026-07-05 10:00 AM', '2026-07-05 02:00 PM', '2026-07-06 11:30 AM'],
    confirmedSlot: '2026-07-05 10:00 AM',
    scores: {
      composite: 86,
      technical: 88,
      communication: 82,
      problemSolving: 85,
      experience: 89,
      confidence: 90
    },
    biasReport: {
      overallScore: 97,
      flaggedPhrases: [],
      genderBiasCheck: 'Passed.',
      originBiasCheck: 'Passed.',
      explanation: 'Recommendation is highly objective.'
    },
    reasoning: 'Demonstrated competent understanding of senior software engineering architecture. Clean execution paths, solid Big-O analysis, and virtualized list implementation.',
    transcript: [
      {
        question: 'How do you handle virtualization for long scroll lists containing thousands of items?',
        answer: 'I use windowing libraries like react-window to compute dynamic row height indices and maintain 60fps scrolling performance.',
        score: 92,
        feedback: 'Excellent explanation of virtualized DOM windowing and scroll throttling.'
      }
    ],
    audioUrl: '/mock-audio.mp3',
    engagementSignal: {
      eyeContact: 96,
      speakingRate: 'Normal (140 WPM)',
      confidenceScore: 90
    }
  },
  {
    id: 'app-504',
    candidateName: 'Priya Patel',
    candidateEmail: 'priya.patel@techcorp.in',
    candidateAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    jobId: 'job-101',
    jobTitle: 'Senior Frontend Engineer — Consumer Platform',
    orgName: 'Swiggy',
    status: 'screening',
    stage: 'Screened',
    appliedDate: '2026-07-03',
    resumeUrl: 'priya_patel_cv.pdf',
    skills: ['Next.js', 'React Query', 'Tailwind CSS', 'TypeScript', 'GraphQL', 'AWS'],
    targetRoles: ['Senior Frontend Engineer'],
    scores: {
      composite: 84,
      technical: 86,
      communication: 80,
      problemSolving: 84,
      experience: 86,
      confidence: 88
    },
    biasReport: {
      overallScore: 98,
      flaggedPhrases: [],
      genderBiasCheck: 'Passed.',
      originBiasCheck: 'Passed.',
      explanation: 'Analysis verified evaluation tags are free of geographic bias filters.'
    },
    reasoning: 'Strong proficiency with Next.js server actions, React Query caching policies, and atomic CSS design systems.',
    transcript: [
      {
        question: 'How do you manage client-side state caching across route changes?',
        answer: 'I leverage React Query with stale-while-revalidate policies to eliminate redundant network requests.',
        score: 88,
        feedback: 'Good grasp of state management and cache key invalidation.'
      }
    ],
    audioUrl: '/mock-audio-2.mp3',
    engagementSignal: {
      eyeContact: 94,
      speakingRate: 'Normal (138 WPM)',
      confidenceScore: 88
    }
  }
];
