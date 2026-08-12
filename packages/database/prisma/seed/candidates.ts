export interface CandidateDef {
  email: string;
  fullName: string;
  headline: string;
  phone: string;
  location: string;
  timezone: string;
  bio: string;
  skills: string[];
  targetRoles: string[];
  yoe: number;
  workMode: string;
  currentCtc: number;
  expectedSalary: number;
  noticePeriod: string;
  workAuthorization: string;
  proudProject: string;
  workValues: string[];
  parsedResume: Record<string, unknown>;
  resumeUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
}

export const CANDIDATES: CandidateDef[] = [
  {
    email: 'pratham@gmail.com',
    fullName: 'Pratham Rajbhar',
    headline: 'Senior Full-Stack Engineer & Distributed AI Architect',
    phone: '+91 98192 83746',
    location: 'Bengaluru, India',
    timezone: 'Asia/Kolkata',
    bio: 'Full-stack software architect with 5.5+ years building distributed cloud platforms, real-time web applications, and autonomous AI agents. Passionate about TypeScript, React/Next.js performance, Go/Node.js microservices, and PostgreSQL optimization.',
    skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Go', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'AWS', 'System Design', 'GraphQL'],
    targetRoles: ['Senior Full-Stack Engineer', 'Lead Platform Architect', 'Staff Software Engineer'],
    yoe: 5.5,
    workMode: 'Hybrid (Bengaluru)',
    currentCtc: 2800000,
    expectedSalary: 4200000,
    noticePeriod: '15 days',
    workAuthorization: 'Indian Citizen',
    proudProject: 'Architected and built an end-to-end AI hiring platform with real-time audio interview analysis, automated proctoring telemetry, and high-throughput evaluation scoring.',
    workValues: ['Technical Rigor', 'High Velocity Shipping', 'Radical Transparency'],
    resumeUrl: 'https://storage.nextround.dev/resumes/pratham/pratham_rajbhar_resume.pdf',
    githubUrl: 'https://github.com/prathamrajbhar',
    linkedinUrl: 'https://linkedin.com/in/prathamrajbhar',
    portfolioUrl: 'https://prathamrajbhar.dev',
    parsedResume: {
      education: [{ institution: 'Indian Institute of Information Technology (IIIT)', degree: 'B.Tech in Computer Science', year: 2021 }],
      experience: [
        { company: 'HyperScale Labs', role: 'Senior Software Engineer', duration: '2023 - Present', highlights: ['Led core API performance optimization', 'Managed Redis caching strategy'] },
        { company: 'FinTech Core India', role: 'Full Stack Developer', duration: '2021 - 2023', highlights: ['Built real-time transaction dashboard', 'Implemented micro-frontends'] },
      ],
    },
  },
  {
    email: 'rahul.backend@gmail.com',
    fullName: 'Rahul Sharma',
    headline: 'Senior Backend Systems Engineer (Go & Rust)',
    phone: '+91 97123 45678',
    location: 'Pune, India',
    timezone: 'Asia/Kolkata',
    bio: 'Systems engineer with 6+ years of experience in designing high-throughput API gateways, distributed consensus engines, and event-driven financial ledger pipelines using Go, Rust, and Kafka.',
    skills: ['Go', 'Rust', 'Kafka', 'gRPC', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'Distributed Systems'],
    targetRoles: ['Senior Backend Engineer', 'Systems Architect', 'Tech Lead'],
    yoe: 6.2,
    workMode: 'In-Office',
    currentCtc: 2400000,
    expectedSalary: 3500000,
    noticePeriod: 'Immediate',
    workAuthorization: 'Indian Citizen',
    proudProject: 'Redesigned core settlement pipeline to process 10,000 requests/sec with sub-5ms latency, eliminating database locks using a lock-free distributed ring buffer.',
    workValues: ['Low Latency', 'System Safety', 'Zero Downtime'],
    resumeUrl: 'https://storage.nextround.dev/resumes/rahul/rahul_sharma_resume.pdf',
    githubUrl: 'https://github.com/rahulsharma-tech',
    linkedinUrl: 'https://linkedin.com/in/rahulsharma-sys',
    portfolioUrl: 'https://rahulsharma.dev',
    parsedResume: {
      education: [{ institution: 'Pune Institute of Computer Technology', degree: 'B.E. in Computer Engineering', year: 2020 }],
      experience: [
        { company: 'PayFast India', role: 'Backend Engineer II', duration: '2020 - Present', highlights: ['Owned ledger synchronization service', 'Migrated legacy node backend to Go'] },
      ],
    },
  },
  {
    email: 'sneha.ui@gmail.com',
    fullName: 'Sneha Patel',
    headline: 'Senior UI Engineer & Interactive Design Technologist',
    phone: '+91 97234 56789',
    location: 'Mumbai, India',
    timezone: 'Asia/Kolkata',
    bio: 'Frontend-focused UI architect with 7+ years of experience building beautiful 120fps client consoles, accessible design systems, and highly interactive WebGL interfaces.',
    skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'WebGL', 'Three.js', 'Framer Motion', 'Zustand', 'CSS Grid'],
    targetRoles: ['Senior UI Engineer', 'Frontend Architect', 'Lead Frontend Developer'],
    yoe: 7.1,
    workMode: 'Remote (India)',
    currentCtc: 2200000,
    expectedSalary: 3200000,
    noticePeriod: '30 days',
    workAuthorization: 'Indian Citizen',
    proudProject: 'Created a highly responsive WebGL dashboard with fluid layout animations and custom CSS grid structures for complex financial stock charts.',
    workValues: ['Aesthetics', 'Pixel Perfection', 'User Accessibility'],
    resumeUrl: 'https://storage.nextround.dev/resumes/sneha/sneha_patel_resume.pdf',
    githubUrl: 'https://github.com/snehapatel-design',
    linkedinUrl: 'https://linkedin.com/in/snehapatel-ui',
    portfolioUrl: 'https://snehapatel.design',
    parsedResume: {
      education: [{ institution: 'NID Mumbai', degree: 'B.Des in Interaction Design', year: 2019 }],
      experience: [
        { company: 'Creative Studio', role: 'UI Engineer Lead', duration: '2019 - Present', highlights: ['Managed custom design library', 'Integrated WebGL charts'] },
      ],
    },
  },
  {
    email: 'vikram.ai@gmail.com',
    fullName: 'Vikram Malhotra',
    headline: 'Staff AI Systems & LLM Platform Engineer',
    phone: '+91 97345 67890',
    location: 'Gurgaon, India',
    timezone: 'Asia/Kolkata',
    bio: 'Frontier AI researcher and systems architect with 8+ years specializing in fine-tuning, quantization, and deployment of open-source LLMs at scale using PyTorch, Ray, and vLLM.',
    skills: ['Python', 'PyTorch', 'FastAPI', 'Ray', 'vLLM', 'LangChain', 'Vector DBs', 'CUDA', 'MLOps'],
    targetRoles: ['Staff LLM Systems Engineer', 'Senior AI Engineer', 'AI Team Lead'],
    yoe: 8.5,
    workMode: 'Hybrid (NCR)',
    currentCtc: 4000000,
    expectedSalary: 5500000,
    noticePeriod: '60 days',
    workAuthorization: 'Indian Citizen',
    proudProject: 'Deployed a custom medical transcription LLM with vLLM, optimizing tensor parallelism to cut memory usage by 40% and serving 100k+ healthcare queries daily.',
    workValues: ['Model Efficiency', 'Strict Privacy', 'Empirical Benchmarks'],
    resumeUrl: 'https://storage.nextround.dev/resumes/vikram/vikram_malhotra_resume.pdf',
    githubUrl: 'https://github.com/vikrammalhotra-ai',
    linkedinUrl: 'https://linkedin.com/in/vikrammalhotra-llm',
    portfolioUrl: 'https://vikrammalhotra.ai',
    parsedResume: {
      education: [{ institution: 'IIT Delhi', degree: 'M.Tech in Artificial Intelligence', year: 2018 }],
      experience: [
        { company: 'BioHealth AI', role: 'Lead AI Engineer', duration: '2018 - Present', highlights: ['Built clinical NLP engine', 'Optimized pipeline throughput'] },
      ],
    },
  },
];
