export interface MockCandidateProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  headline: string;
  location: string;
  yearsExperience: number;
  skills: string[];
  appliedJobId: string;
  appliedJobTitle: string;
  orgName: string;
  stage: 'SOURCED' | 'SCREENING' | 'VOICE_INTERVIEW' | 'HR_ROUND' | 'EVALUATION' | 'DECISION' | 'OFFER' | 'REJECTED';
  scores: {
    composite: number;
    technical: number;
    communication: number;
    culturalFit: number;
    problemSolving: number;
    confidence: number;
  };
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'NEUTRAL' | 'NO_HIRE';
  appliedDate: string;
  resumeSummary: string;
  resumeUrl: string;
  keySkills: string[];
  redFlags: string[];
  proctoringTelemetry: {
    faceDetections: number;
    gazeDeviations: number;
    multipleFacesDetected: boolean;
    audioNoiseLevel: 'low' | 'moderate' | 'high';
    trustScore: number;
  };
  timeline: Array<{
    stage: string;
    date: string;
    note: string;
    passed: boolean;
  }>;
}

export const MOCK_CANDIDATES: MockCandidateProfile[] = [
  {
    id: 'cand-101',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    headline: 'Senior Full Stack Engineer | Ex-Swiggy, React 19 & Distributed Node',
    location: 'Bengaluru, India',
    yearsExperience: 6,
    skills: ['React 19', 'Next.js 16', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Redis'],
    appliedJobId: 'job-101',
    appliedJobTitle: 'Senior Frontend Engineer — Consumer Platform',
    orgName: 'Swiggy',
    stage: 'EVALUATION',
    scores: {
      composite: 89,
      technical: 92,
      communication: 88,
      culturalFit: 86,
      problemSolving: 90,
      confidence: 94
    },
    recommendation: 'STRONG_HIRE',
    appliedDate: '2026-07-02',
    resumeSummary: 'Full-stack software architect with 6 years of experience optimizing high-traffic food delivery apps. Led team of 5 engineers to reduce checkout bundle size by 42%.',
    resumeUrl: '/documents/ananya_iyer_cv.pdf',
    keySkills: ['Micro-frontends', 'Server Actions', 'Query Indexing', 'Web Vitals'],
    redFlags: [],
    proctoringTelemetry: {
      faceDetections: 1,
      gazeDeviations: 0,
      multipleFacesDetected: false,
      audioNoiseLevel: 'low',
      trustScore: 99
    },
    timeline: [
      { stage: 'Sourced', date: '2026-07-02', note: 'AI Sourcing agent matched candidate profile with 94% fit', passed: true },
      { stage: 'Screened', date: '2026-07-03', note: 'Automated resume screening score: 92/100', passed: true },
      { stage: 'Assessment', date: '2026-07-05', note: 'Completed Virtualized List coding challenge in 22 mins with 100% test pass rate', passed: true },
      { stage: 'Voice Interview', date: '2026-07-08', note: 'Completed AI Voice Screen session with Serena agent. Technical score 92.', passed: true }
    ]
  },
  {
    id: 'cand-102',
    name: 'Rohan Verma',
    email: 'rohan.verma@razorpay.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    headline: 'Lead AI Engineer | Ex-Razorpay, LangGraph & Gemini 2.5',
    location: 'Bengaluru, India',
    yearsExperience: 5,
    skills: ['Python 3.13', 'FastAPI', 'LangGraph', 'Gemini API', 'PyTorch', 'Vector Search', 'pgvector'],
    appliedJobId: 'job-104',
    appliedJobTitle: 'Lead AI / ML Engineer',
    orgName: 'NextRound',
    stage: 'DECISION',
    scores: {
      composite: 94,
      technical: 96,
      communication: 91,
      culturalFit: 95,
      problemSolving: 94,
      confidence: 96
    },
    recommendation: 'STRONG_HIRE',
    appliedDate: '2026-07-01',
    resumeSummary: 'Pioneered zero-latency agentic RAG search pipeline for enterprise financial audit systems. Expert in token streaming, tool call execution, and state persistence.',
    resumeUrl: '/documents/rohan_verma_resume.pdf',
    keySkills: ['LangGraph', 'Quantized Model Inference', 'BM25 Hybrid Search', 'RAG Pipelines'],
    redFlags: [],
    proctoringTelemetry: {
      faceDetections: 1,
      gazeDeviations: 1,
      multipleFacesDetected: false,
      audioNoiseLevel: 'low',
      trustScore: 98
    },
    timeline: [
      { stage: 'Sourced', date: '2026-07-01', note: 'Direct applicant via AI marketplace', passed: true },
      { stage: 'Screened', date: '2026-07-02', note: 'Resume screening score: 96/100', passed: true },
      { stage: 'Voice Interview', date: '2026-07-06', note: 'AI Voice interview passed with highest technical score in cohort', passed: true },
      { stage: 'Evaluation', date: '2026-07-10', note: 'Bias Audit cleared. Zero demographic flags.', passed: true }
    ]
  },
  {
    id: 'cand-103',
    name: 'Priya Sharma',
    email: 'priya.sharma@cred.club',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    headline: 'Senior Backend Engineer | Go, Distributed Ledgers & Redis',
    location: 'Bengaluru, India',
    yearsExperience: 4,
    skills: ['Go', 'Node.js', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes'],
    appliedJobId: 'job-103',
    appliedJobTitle: 'Full Stack Engineer — Billing & Ledgers',
    orgName: 'CRED',
    stage: 'VOICE_INTERVIEW',
    scores: {
      composite: 84,
      technical: 88,
      communication: 80,
      culturalFit: 82,
      problemSolving: 85,
      confidence: 86
    },
    recommendation: 'HIRE',
    appliedDate: '2026-07-05',
    resumeSummary: 'Designed double-entry ledger database tables processing 4M+ daily transactions at CRED with zero drift anomalies.',
    resumeUrl: '/documents/priya_sharma_cv.pdf',
    keySkills: ['Distributed Locking', 'Transactional Outbox Pattern', 'Idempotent APIs'],
    redFlags: [],
    proctoringTelemetry: {
      faceDetections: 1,
      gazeDeviations: 2,
      multipleFacesDetected: false,
      audioNoiseLevel: 'low',
      trustScore: 96
    },
    timeline: [
      { stage: 'Sourced', date: '2026-07-05', note: 'Sourced via Github portfolio analysis', passed: true },
      { stage: 'Screened', date: '2026-07-06', note: 'Screening passed', passed: true }
    ]
  },
  {
    id: 'cand-104',
    name: 'David Kim',
    email: 'david.kim@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    headline: 'DevOps & Reliability Engineer | Kubernetes, Terraform & AWS',
    location: 'Remote (Bengaluru)',
    yearsExperience: 7,
    skills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'Prometheus', 'Grafana', 'CI/CD'],
    appliedJobId: 'job-106',
    appliedJobTitle: 'Staff Infrastructure Engineer',
    orgName: 'Ola Electric',
    stage: 'OFFER',
    scores: {
      composite: 92,
      technical: 95,
      communication: 90,
      culturalFit: 92,
      problemSolving: 91,
      confidence: 94
    },
    recommendation: 'STRONG_HIRE',
    appliedDate: '2026-06-25',
    resumeSummary: 'Maintained 99.99% multi-region uptime for cloud IoT ingestion clusters handling 50,000 requests per second.',
    resumeUrl: '/documents/david_kim_resume.pdf',
    keySkills: ['Zero Trust Network Policies', 'Chaos Mesh', 'GitOps / ArgoCD'],
    redFlags: [],
    proctoringTelemetry: {
      faceDetections: 1,
      gazeDeviations: 0,
      multipleFacesDetected: false,
      audioNoiseLevel: 'low',
      trustScore: 100
    },
    timeline: [
      { stage: 'Sourced', date: '2026-06-25', note: 'Applied online', passed: true },
      { stage: 'Screened', date: '2026-06-26', note: 'Passed screening', passed: true },
      { stage: 'Voice Interview', date: '2026-07-01', note: 'Scored 95/100', passed: true },
      { stage: 'Decision', date: '2026-07-05', note: 'Auto-offer triggered by threshold >= 88%', passed: true }
    ]
  },
  {
    id: 'cand-105',
    name: 'Michael Zhang',
    email: 'michael.zhang@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    headline: 'Frontend UX Specialist | Next.js, WebGL & Micro-animations',
    location: 'Mumbai, India',
    yearsExperience: 4,
    skills: ['Next.js', 'React', 'Tailwind CSS', 'Framer Motion', 'Three.js', 'TypeScript'],
    appliedJobId: 'job-108',
    appliedJobTitle: 'UI Engineer — Search & Recommendations',
    orgName: 'Flipkart',
    stage: 'SCREENING',
    scores: {
      composite: 76,
      technical: 78,
      communication: 74,
      culturalFit: 76,
      problemSolving: 75,
      confidence: 80
    },
    recommendation: 'NEUTRAL',
    appliedDate: '2026-07-08',
    resumeSummary: 'Specialist in crafting smooth web interfaces with high framerate CSS animations and accessible design system components.',
    resumeUrl: '/documents/michael_zhang_cv.pdf',
    keySkills: ['Design Systems', 'Framer Motion', 'Web Vitals'],
    redFlags: ['Needs broader experience in server-side performance tuning'],
    proctoringTelemetry: {
      faceDetections: 1,
      gazeDeviations: 1,
      multipleFacesDetected: false,
      audioNoiseLevel: 'moderate',
      trustScore: 92
    },
    timeline: [
      { stage: 'Sourced', date: '2026-07-08', note: 'Applied via job board', passed: true }
    ]
  },
  {
    id: 'cand-106',
    name: 'Elena Rostova',
    email: 'elena.rostova@tech.io',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    headline: 'Staff Systems Engineer | Rust, C++ & Low Latency Systems',
    location: 'Bengaluru, India',
    yearsExperience: 8,
    skills: ['Rust', 'C++', 'Python', 'Redis Streams', 'Linux Kernel', 'Distributed Systems'],
    appliedJobId: 'job-109',
    appliedJobTitle: 'Staff Systems Engineer — 10-Min Dispatch AI',
    orgName: 'Zepto',
    stage: 'EVALUATION',
    scores: {
      composite: 95,
      technical: 98,
      communication: 90,
      culturalFit: 92,
      problemSolving: 96,
      confidence: 95
    },
    recommendation: 'STRONG_HIRE',
    appliedDate: '2026-07-06',
    resumeSummary: 'Built sub-millisecond dispatch engines handling 200,000 spatial queries per minute. Author of 2 open-source Rust concurrency libraries.',
    resumeUrl: '/documents/elena_rostova_cv.pdf',
    keySkills: ['Lock-free Data Structures', 'SIMD Parallelism', 'Spatial Indexing'],
    redFlags: [],
    proctoringTelemetry: {
      faceDetections: 1,
      gazeDeviations: 0,
      multipleFacesDetected: false,
      audioNoiseLevel: 'low',
      trustScore: 100
    },
    timeline: [
      { stage: 'Sourced', date: '2026-07-06', note: 'Top tier candidate sourced', passed: true },
      { stage: 'Screened', date: '2026-07-07', note: 'Passed screening score: 98/100', passed: true },
      { stage: 'Voice Interview', date: '2026-07-09', note: 'Voice interview score: 96/100', passed: true }
    ]
  },
  {
    id: 'cand-107',
    name: 'Marcus Vance',
    email: 'marcus.vance@postman.com',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    headline: 'Senior Developer Advocate | API Specs, OpenAPI & Tech Writing',
    location: 'Remote',
    yearsExperience: 5,
    skills: ['OpenAPI / Swagger', 'TypeScript', 'Node.js', 'Postman', 'Technical Blogging'],
    appliedJobId: 'job-110',
    appliedJobTitle: 'Senior Developer Advocate — API Platform',
    orgName: 'Postman',
    stage: 'HR_ROUND',
    scores: {
      composite: 88,
      technical: 82,
      communication: 96,
      culturalFit: 90,
      problemSolving: 84,
      confidence: 96
    },
    recommendation: 'STRONG_HIRE',
    appliedDate: '2026-07-07',
    resumeSummary: 'Renowned tech speaker and developer relations lead. Created Postman collections used by over 100,000 developers.',
    resumeUrl: '/documents/marcus_vance_resume.pdf',
    keySkills: ['Developer Evangelism', 'OpenAPI 3.1 Specs', 'Community Growth'],
    redFlags: [],
    proctoringTelemetry: {
      faceDetections: 1,
      gazeDeviations: 0,
      multipleFacesDetected: false,
      audioNoiseLevel: 'low',
      trustScore: 98
    },
    timeline: [
      { stage: 'Sourced', date: '2026-07-07', note: 'Applied via Postman portal', passed: true },
      { stage: 'Voice Interview', date: '2026-07-11', note: 'Communication score 96/100', passed: true }
    ]
  },
  {
    id: 'cand-108',
    name: 'Ananya Patel',
    email: 'ananya.patel@meesho.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    headline: 'Frontend Engineer | React Native & Tier-3 Web Optimization',
    location: 'Bengaluru, India',
    yearsExperience: 3,
    skills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'PWA', 'Webpack'],
    appliedJobId: 'job-107',
    appliedJobTitle: 'Frontend Engineer — Seller Portal',
    orgName: 'Meesho',
    stage: 'OFFER',
    scores: {
      composite: 82,
      technical: 84,
      communication: 80,
      culturalFit: 84,
      problemSolving: 80,
      confidence: 85
    },
    recommendation: 'HIRE',
    appliedDate: '2026-07-03',
    resumeSummary: 'Built low-bandwidth seller catalog portals loaded seamlessly on 2G/3G mobile connections for Tier-3 Indian cities.',
    resumeUrl: '/documents/ananya_patel_cv.pdf',
    keySkills: ['Mobile Browser Profiling', 'Service Workers', 'Bundle Splitting'],
    redFlags: [],
    proctoringTelemetry: {
      faceDetections: 1,
      gazeDeviations: 0,
      multipleFacesDetected: false,
      audioNoiseLevel: 'low',
      trustScore: 97
    },
    timeline: [
      { stage: 'Sourced', date: '2026-07-03', note: 'Direct application', passed: true },
      { stage: 'Voice Interview', date: '2026-07-06', note: 'Passed interview', passed: true }
    ]
  }
];
