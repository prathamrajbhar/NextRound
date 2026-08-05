import { Application } from './types';

export const mockApplicationsPart2: Application[] = [
  {
    id: 'app-505',
    candidateName: 'Aarav Sharma',
    candidateEmail: 'aarav.sharma@gmail.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    jobId: 'job-102',
    jobTitle: 'Product Manager — Payments Flow',
    orgName: 'Razorpay',
    status: 'decided',
    stage: 'Decision',
    appliedDate: '2026-06-29',
    resumeUrl: 'aarav_sharma_pm.pdf',
    skills: ['Payment Operations', 'SQL Analytics', 'Idempotency Design', 'Merchant Onboarding'],
    targetRoles: ['Product Manager', 'Senior Product Manager'],
    scores: {
      composite: 88,
      technical: 85,
      communication: 90,
      problemSolving: 88,
      experience: 89,
      confidence: 92
    },
    biasReport: {
      overallScore: 97,
      flaggedPhrases: [],
      genderBiasCheck: 'Passed.',
      originBiasCheck: 'Passed.',
      explanation: 'Analysis verified evaluation tags are free of geographic bias filters.'
    },
    reasoning: 'Aarav displayed deep expertise in payment retry mechanics, merchant onboarding dropdown optimization, and API error codes. Exceeded Razorpay PM threshold (85%) with a score of 88%. Hired.',
    decision: 'hire',
    transcript: [
      {
        question: 'How do you design a retry logic policy for failed payment authorizations?',
        answer: 'I would prioritize a multi-layered policy. For transient errors like network dropouts, we implement immediate exponential backoff retries with jitter. For processing errors like card declines, we present descriptive UI responses to prompt alternative payment methods. Crucially, all API requests carry idempotency keys to prevent duplicate billing.',
        score: 92,
        feedback: 'Excellent metrics-first approach with clear action items.'
      }
    ],
    audioUrl: '/mock-audio-3.mp3',
    proctorFlags: [],
    engagementSignal: {
      eyeContact: 95,
      speakingRate: 'Normal (138 WPM)',
      confidenceScore: 91
    }
  },
  {
    id: 'app-506',
    candidateName: 'Aditi Rao',
    candidateEmail: 'aditi.rao@yahoo.co.in',
    candidateAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    jobId: 'job-103',
    jobTitle: 'Full Stack Engineer — Billing & Ledgers',
    orgName: 'CRED',
    status: 'screening',
    stage: 'Screened',
    appliedDate: '2026-07-02',
    resumeUrl: 'aditi_rao_cred_cv.pdf',
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'React', 'Docker'],
    targetRoles: ['Full Stack Engineer', 'Backend Developer']
  },
  {
    id: 'app-507',
    candidateName: 'Amit Verma',
    candidateEmail: 'amit.verma@gmail.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    jobId: 'job-103',
    jobTitle: 'Full Stack Engineer — Billing & Ledgers',
    orgName: 'CRED',
    status: 'sourced',
    stage: 'Sourced',
    appliedDate: '2026-07-04',
    resumeUrl: 'amit_verma_billing.pdf',
    skills: ['Node.js', 'PostgreSQL', 'TypeScript', 'Prisma', 'REST APIs'],
    targetRoles: ['Full Stack Engineer']
  },
  {
    id: 'app-508',
    candidateName: 'Sneha Gupta',
    candidateEmail: 'sneha.gupta@outlook.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    jobId: 'job-102',
    jobTitle: 'Product Manager — Payments Flow',
    orgName: 'Razorpay',
    status: 'interviewed',
    stage: 'Interview',
    appliedDate: '2026-06-30',
    resumeUrl: 'sneha_gupta_pm_resume.pdf',
    skills: ['User Research', 'Product Analytics', 'Figma Wireframing', 'Agile Scrum'],
    targetRoles: ['Product Manager', 'Associate PM'],
    scores: {
      composite: 83,
      technical: 80,
      communication: 88,
      problemSolving: 81,
      experience: 82,
      confidence: 85
    },
    biasReport: {
      overallScore: 98,
      flaggedPhrases: [],
      genderBiasCheck: 'Passed.',
      originBiasCheck: 'Passed.',
      explanation: 'Parameters aligned on product execution capabilities.'
    },
    reasoning: 'Sneha has a strong grip on UI flows and user personas. She had slightly lower depth in API integrations and compliance regulations, putting her score right below Razorpay PM hiring threshold (85%). Recommended for review.',
    decision: 'hold',
    transcript: [
      {
        question: 'How do you measure checkout page drop-offs and prioritize solutions?',
        answer: 'I set up funnel tracking using tools like Mixpanel. By looking at steps from clicking buy to completing payment authorization, we pinpoint the highest drop-off rate. If it happens on 3DS authorization, we look at loading latency or missing local payment integrations. I prioritize solutions that target the high-volume merchants first.',
        score: 81,
        feedback: 'Practical funnel analysis, but missed checking dynamic payment methods routing.'
      }
    ],
    audioUrl: '/mock-audio-2.mp3',
    proctorFlags: [],
    engagementSignal: {
      eyeContact: 88,
      speakingRate: 'Normal (130 WPM)',
      confidenceScore: 82
    }
  },
  {
    id: 'app-509',
    candidateName: 'Devendra Kumar',
    candidateEmail: 'dev.kumar@gmail.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    jobId: 'job-104',
    jobTitle: 'Lead Data Scientist — AI Assistant',
    orgName: 'Zoho',
    status: 'decided',
    stage: 'Decision',
    appliedDate: '2026-07-01',
    resumeUrl: 'devendra_kumar_data_science.pdf',
    skills: ['Python', 'PyTorch', 'Transformers', 'MLOps', 'Vector Search', 'SQL'],
    targetRoles: ['Lead Data Scientist', 'AI Engineer'],
    scores: {
      composite: 90,
      technical: 93,
      communication: 82,
      problemSolving: 92,
      experience: 91,
      confidence: 88
    },
    biasReport: {
      overallScore: 98,
      flaggedPhrases: [],
      genderBiasCheck: 'Passed.',
      originBiasCheck: 'Passed.',
      explanation: 'Auditing verified scoring maps solely to coding and model training tasks.'
    },
    reasoning: 'Devendra has highly exceptional skills in transformer models, vector retrieval latency, and semantic search matching. Fully exceeds Zoho Lead Data Scientist threshold (88%) with composite score of 90%.',
    decision: 'hire',
    transcript: [
      {
        question: 'How do you handle vocabulary mismatch in semantic search queries for CRM records?',
        answer: 'We implement hybrid search combining dense semantic embeddings (using a model like multilingual Sentence-BERT) with sparse keyword search (BM25). By normalizing and blending their scores using Reciprocal Rank Fusion (RRF), we catch both synonym-based matches and exact matches, ensuring high-recall domain queries.',
        score: 93,
        feedback: 'Expert knowledge of hybrid indexing search techniques.'
      }
    ],
    audioUrl: '/mock-audio-3.mp3',
    proctorFlags: [],
    engagementSignal: {
      eyeContact: 90,
      speakingRate: 'Normal (135 WPM)',
      confidenceScore: 89
    }
  },
  {
    id: 'app-510',
    candidateName: 'Kavita Krishnan',
    candidateEmail: 'kavita.k@gmail.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150',
    jobId: 'job-105',
    jobTitle: 'Backend Engineer — Core Trading Systems',
    orgName: 'Zerodha',
    status: 'sourced',
    stage: 'Sourced',
    appliedDate: '2026-07-04',
    resumeUrl: 'kavita_krishnan_backend.pdf',
    skills: ['Go', 'gRPC', 'PostgreSQL', 'Redis Cluster', 'Kafka', 'System Design'],
    targetRoles: ['Backend Engineer', 'Systems Engineer']
  },
  {
    id: 'app-511',
    candidateName: 'Neha Sharma',
    candidateEmail: 'neha.sharma@outlook.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150',
    jobId: 'job-107',
    jobTitle: 'Frontend Engineer — Seller Portal',
    orgName: 'Meesho',
    status: 'screening',
    stage: 'Screened',
    appliedDate: '2026-07-02',
    resumeUrl: 'neha_sharma_meesho.pdf',
    skills: ['React', 'Next.js', 'Redux', 'Responsive UI', 'CSS Grid'],
    targetRoles: ['Frontend Developer']
  },
  {
    id: 'app-512',
    candidateName: 'Rahul Nair',
    candidateEmail: 'rahul.nair@gmail.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    jobId: 'job-106',
    jobTitle: 'Staff Infrastructure Engineer',
    orgName: 'Ola Electric',
    status: 'interview_scheduled',
    stage: 'Interview',
    appliedDate: '2026-07-03',
    resumeUrl: 'rahul_nair_infra.pdf',
    skills: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD Pipelines', 'Prometheus', 'Golang'],
    targetRoles: ['Staff Infrastructure Engineer', 'DevOps Lead'],
    scheduledSlots: ['2026-07-06 11:00 AM', '2026-07-06 03:00 PM', '2026-07-07 10:00 AM'],
    confirmedSlot: '2026-07-06 11:00 AM'
  }
];
