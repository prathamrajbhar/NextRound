export interface DynamicConversationTurn {
  id: number;
  aiMessage: string;
  topicTag: string;
  simulatedUserAnswer: string;
  extractedInsights: {
    type: 'Experience' | 'Metric' | 'Skill' | 'Project';
    label: string;
    value: string;
  }[];
}

export interface ATSResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  atsScore: number;
  scoreBreakdown: {
    label: string;
    score: number;
    description: string;
  }[];
  experience: {
    company: string;
    role: string;
    location: string;
    period: string;
    highlights: string[];
  }[];
  projects: {
    title: string;
    techStack: string[];
    description: string;
    impact: string;
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }[];
  certifications: string[];
}

export const mockDynamicTurns: DynamicConversationTurn[] = [
  {
    id: 1,
    topicTag: 'Work Experience & Scale',
    aiMessage: "Hi Ananya! I'm excited to help you build your resume today. To kick off our interview naturally, walk me through your primary role at Swiggy. What systems were you responsible for, and what was the scale of traffic?",
    simulatedUserAnswer: "At Swiggy, I served as Senior Full Stack Engineer, leading core delivery tracking and order dispatch services handling 2.5 million daily active users across tier-1 cities.",
    extractedInsights: [
      { type: 'Experience', label: 'Company & Role', value: 'Swiggy — Senior Full Stack Engineer' },
      { type: 'Metric', label: 'System Scale', value: '2.5M Daily Active Users' }
    ]
  },
  {
    id: 2,
    topicTag: 'Tech Stack & Architecture',
    aiMessage: "Handling 2.5 million daily active users is impressive! When order traffic spikes during lunch or dinner hours, what tech stack and caching strategy did you rely on to keep response times fast?",
    simulatedUserAnswer: "We used Next.js 14 App Router for server streaming, WebSockets for live driver location tracking, and Redis distributed caching for rapid dispatch lookups.",
    extractedInsights: [
      { type: 'Skill', label: 'Core Stack', value: 'Next.js 14, WebSockets, Redis, TypeScript' },
      { type: 'Project', label: 'Real-time System', value: 'Live Delivery Dispatch Engine' }
    ]
  },
  {
    id: 3,
    topicTag: 'Quantified Performance Impact',
    aiMessage: "That's a solid architectural setup. For your resume bullet points, numbers speak loudest — what exact performance gains or latency improvements resulted from that Redis and WebSockets implementation?",
    simulatedUserAnswer: "By implementing Redis caching and SSR route splitting, we cut peak order dispatch latency from 3.8s down to 850ms — a 78% reduction — and boosted Google Lighthouse performance to 98, driving a 14.2% conversion lift.",
    extractedInsights: [
      { type: 'Metric', label: 'Latency Drop', value: '78% reduction (850ms vs 3.8s)' },
      { type: 'Metric', label: 'Conversion', value: '+14.2% checkout conversion lift' }
    ]
  },
  {
    id: 4,
    topicTag: 'DevOps & Cloud Infrastructure',
    aiMessage: "That 78% latency drop is huge! How about cloud deployment and DevOps? Did you work with AWS, Docker containers, or automated CI/CD pipelines?",
    simulatedUserAnswer: "Yes! I managed AWS deployments using CloudFront CDN and S3, containerized microservices with Docker, and optimized PostgreSQL queries using Prisma ORM.",
    extractedInsights: [
      { type: 'Skill', label: 'Cloud & DevOps', value: 'AWS (S3, CloudFront, Lambda), Docker, PostgreSQL' },
      { type: 'Skill', label: 'ORM & Database', value: 'Prisma ORM & PostgreSQL Indexing' }
    ]
  },
  {
    id: 5,
    topicTag: 'Team Leadership & Mentorship',
    aiMessage: "Fantastic. Lastly, did you take on any cross-functional engineering leadership, code reviews, or mentorship responsibilities for junior developers on the team?",
    simulatedUserAnswer: "I regularly led technical architecture design reviews and directly mentored 5 junior engineers on full-stack web best practices.",
    extractedInsights: [
      { type: 'Experience', label: 'Leadership', value: 'Mentored 5 engineers & led design reviews' }
    ]
  }
];

export const mockGeneratedResume: ATSResumeData = {
  name: 'Ananya Iyer',
  title: 'Senior Full Stack & AI Product Engineer',
  email: 'ananya.iyer@example.com',
  phone: '+91 98765 43210',
  location: 'Bengaluru, India',
  linkedin: 'linkedin.com/in/ananyaiyer',
  github: 'github.com/ananyaiyer',
  portfolio: 'ananyaiyer.dev',
  summary: 'High-impact Senior Full Stack Engineer with 5+ years of experience architecting distributed web systems, AI agent workflows, and real-time streaming interfaces. Track record of scaling consumer apps to 2.5M+ DAU while reducing cloud latency by up to 78%.',
  atsScore: 96,
  scoreBreakdown: [
    { label: 'Action Verbs', score: 98, description: 'Strong leadership verbs used across all bullet points' },
    { label: 'Quantified Metrics', score: 95, description: 'Every role includes verified metrics and percentage lifts' },
    { label: 'Keyword Match', score: 96, description: '96% alignment with Tier-1 Tech Full-Stack expectations' },
    { label: 'ATS Format Compliance', score: 95, description: 'Single-column structure optimized for Parsing Engines' }
  ],
  experience: [
    {
      company: 'Swiggy',
      role: 'Senior Full Stack Engineer',
      location: 'Bengaluru, KA',
      period: '2023 - Present',
      highlights: [
        'Architected real-time order tracking dispatch engine using Next.js 14, WebSockets, and Redis, reducing peak latency by 78% (850ms vs 3.8s).',
        'Spearheaded frontend performance overhaul across core checkout flows, elevating Google Lighthouse score from 64 to 98 and lifting conversion by 14.2%.',
        'Mentored 5 junior engineers and led bi-weekly technical architecture design reviews for high-throughput microservices handling 2.5M DAU.'
      ]
    },
    {
      company: 'Razorpay',
      role: 'Software Development Engineer II',
      location: 'Bengaluru, KA',
      period: '2021 - 2023',
      highlights: [
        'Engineered merchant onboarding workflow with automated KYC validation, cutting merchant time-to-first-transaction from 48 hours to 12 minutes.',
        'Designed idempotent payment webhooks processing 1.4M events daily with 99.999% availability during peak festive sales.',
        'Decreased bundle payload size by 38% through dynamic route splitting, tree-shaking, and SVG icon optimization.'
      ]
    }
  ],
  projects: [
    {
      title: 'NextRound Voice Evaluator Engine',
      techStack: ['Next.js', 'TypeScript', 'WebRTC', 'TailwindCSS', 'Redis'],
      description: 'Built a real-time conversational voice interview simulator with sub-200ms latency audio stream processing and automated AI feedback generator.',
      impact: 'Adopted by 4,500+ candidates for AI interview practice with 94% positive satisfaction score.'
    },
    {
      title: 'Distributed Log Aggregator',
      techStack: ['Go', 'Kafka', 'Elasticsearch', 'Docker'],
      description: 'Developed high-throughput log processing pipeline capable of ingesting 100K logs/sec with real-time anomaly detection alerts.',
      impact: 'Reduced mean time to resolution (MTTR) by 35% for infrastructure incidents.'
    }
  ],
  skills: [
    {
      category: 'Languages & Core',
      items: ['TypeScript', 'JavaScript (ESNext)', 'Python', 'Go', 'HTML5/CSS3', 'SQL']
    },
    {
      category: 'Frameworks & Libraries',
      items: ['React 18', 'Next.js 14 (App Router)', 'Node.js', 'Express', 'TailwindCSS', 'Zod', 'Prisma ORM']
    },
    {
      category: 'DevOps & Databases',
      items: ['PostgreSQL', 'Redis', 'Docker', 'AWS (S3, Lambda, CloudFront)', 'Git', 'Kafka']
    }
  ],
  education: [
    {
      degree: 'B.Tech in Computer Science & Engineering',
      institution: 'National Institute of Technology (NIT), Surathkal',
      year: '2017 - 2021',
      gpa: '8.9 / 10.0'
    }
  ],
  certifications: [
    'AWS Certified Solutions Architect – Associate (2023)',
    'Meta Certified Front-End Developer (2022)'
  ]
};
