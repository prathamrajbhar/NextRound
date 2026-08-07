import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting NextRound database seeding with realistic enterprise data...');

  // Clean existing data in reverse order of foreign key dependencies
  await prisma.talentBookmark.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.prepContent.deleteMany({});
  await prisma.mockSession.deleteMany({});
  await prisma.agentLog.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.codingSubmission.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.candidateProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  console.log('🧹 Cleaned existing database tables.');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Organizations
  const acmeOrg = await prisma.organization.create({
    data: {
      name: 'Acme Cloud Labs',
      logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      industry: 'Enterprise SaaS & Cloud Infrastructure',
      size: '500-1000 employees',
      settings: {
        autoOfferEnabled: true,
        defaultThreshold: 80,
        defaultVoice: 'Serena',
        domain: 'acmecloud.io',
      },
    },
  });

  const nexusOrg = await prisma.organization.create({
    data: {
      name: 'Nexus AI Studios',
      logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      industry: 'Artificial Intelligence & Large Language Models',
      size: '50-200 employees',
      settings: {
        autoOfferEnabled: false,
        defaultThreshold: 85,
        defaultVoice: 'Alloy',
        domain: 'nexusai.dev',
      },
    },
  });

  const stripeFlowOrg = await prisma.organization.create({
    data: {
      name: 'StripeFlow Fintech',
      logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      industry: 'High-Frequency Payments & Digital Banking',
      size: '1000+ employees',
      settings: {
        autoOfferEnabled: true,
        defaultThreshold: 82,
        defaultVoice: 'Nova',
        domain: 'stripeflow.com',
      },
    },
  });

  console.log('🏢 Created 3 Organizations (Acme Cloud Labs, Nexus AI Studios, StripeFlow Fintech).');

  // 2. Create HR Users
  const hrUser1 = await prisma.user.create({
    data: {
      email: 'hr@acmecloud.io',
      password_hash: passwordHash,
      role: 'hr',
      org_id: acmeOrg.id,
    },
  });

  const hrUser2 = await prisma.user.create({
    data: {
      email: 'recruiter@nexusai.dev',
      password_hash: passwordHash,
      role: 'hr',
      org_id: nexusOrg.id,
    },
  });

  const hrUser3 = await prisma.user.create({
    data: {
      email: 'talent@stripeflow.com',
      password_hash: passwordHash,
      role: 'hr',
      org_id: stripeFlowOrg.id,
    },
  });

  console.log('👤 Created 3 HR Admin Accounts (Password: Password123!).');

  // 3. Create Candidate Users & Profiles
  const candidateDefs = [
    {
      email: 'candidate.alex@gmail.com',
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'GraphQL', 'Docker'],
      targetRoles: ['Senior Full-Stack Engineer', 'Frontend Tech Lead'],
      salary: 165000,
      notice: '2 weeks',
      auth: 'US Citizen',
      proudProject: 'Architected micro-frontend platform reducing page load latency by 45% for 2M daily active users.',
      values: ['Technical Autonomy', 'Continuous Mentorship', 'High Velocity Shipping'],
    },
    {
      email: 'candidate.priya@yahoo.com',
      skills: ['Python', 'PyTorch', 'CUDA', 'FastAPI', 'LangChain', 'Kubernetes'],
      targetRoles: ['AI Research Engineer', 'ML Infrastructure Engineer'],
      salary: 195000,
      notice: '1 month',
      auth: 'H-1B Visa',
      proudProject: 'Trained and quantized 70B parameter LLM for low-latency edge inference with 4-bit AWQ.',
      values: ['Research Rigor', 'Open Source Contribution', 'Ethical AI Development'],
    },
    {
      email: 'candidate.marcus@outlook.com',
      skills: ['Go', 'Rust', 'Kubernetes', 'gRPC', 'Distributed Systems', 'Kafka'],
      targetRoles: ['Staff Backend Engineer', 'Infrastructure Architect'],
      salary: 210000,
      notice: 'Immediate',
      auth: 'US Citizen',
      proudProject: 'Built zero-downtime event streaming pipeline handling 500,000 events/second during Black Friday surge.',
      values: ['System Reliability', 'Clean Code Principles', 'Ownership Culture'],
    },
    {
      email: 'candidate.elena@dev.io',
      skills: ['React', 'Next.js', 'TailwindCSS', 'WebGL', 'Three.js', 'Performance Optimization'],
      targetRoles: ['Staff Frontend Engineer', 'UI/UX Systems Specialist'],
      salary: 175000,
      notice: '2 weeks',
      auth: 'Green Card Holder',
      proudProject: 'Created custom WebGL particle renderer and Design System component library used across 12 product lines.',
      values: ['Design Precision', 'Accessibility Standards', 'User Delight'],
    },
    {
      email: 'candidate.david@mit.edu',
      skills: ['Python', 'C++', 'Algorithms', 'Distributed DBs', 'System Design'],
      targetRoles: ['Backend Software Engineer', 'Core Database Engineer'],
      salary: 155000,
      notice: 'Immediate',
      auth: 'OPT / EAD',
      proudProject: 'Implemented lock-free concurrent B-Tree index structure in C++ achieving 3x throughput improvement over standard locks.',
      values: ['Algorithmic Efficiency', 'Deep Technical Understanding', 'Code Elegance'],
    },
    {
      email: 'candidate.sophia@stanford.edu',
      skills: ['TypeScript', 'Python', 'AWS', 'Serverless', 'PostgreSQL', 'Redis'],
      targetRoles: ['Full-Stack Developer', 'Product Engineer'],
      salary: 160000,
      notice: '3 weeks',
      auth: 'US Citizen',
      proudProject: 'Built collaborative real-time whiteboarding application using WebSockets and Conflict-Free Replicated Data Types (CRDTs).',
      values: ['Product-Centric Engineering', 'Cross-Functional Collaboration', 'Agile Velocity'],
    },
  ];

  const candidateProfiles = [];
  for (const c of candidateDefs) {
    const u = await prisma.user.create({
      data: {
        email: c.email,
        password_hash: passwordHash,
        role: 'candidate',
      },
    });

    const cp = await prisma.candidateProfile.create({
      data: {
        user_id: u.id,
        skills: c.skills,
        target_roles: c.targetRoles,
        expected_salary: c.salary,
        notice_period: c.notice,
        work_authorization: c.auth,
        proud_project: c.proudProject,
        work_values: c.values,
        resume_url: `https://storage.nextround.dev/resumes/${u.id}/resume.pdf`,
        github_url: `https://github.com/${c.email.split('@')[0]}`,
        linkedin_url: `https://linkedin.com/in/${c.email.split('@')[0]}`,
      },
    });

    candidateProfiles.push({ user: u, profile: cp, def: c });
  }

  console.log('🎓 Created 6 Candidate Accounts & Profiles (Password: Password123!).');

  // 4. Create Jobs
  const job1 = await prisma.job.create({
    data: {
      org_id: acmeOrg.id,
      title: 'Senior Full-Stack Engineer (React & Node.js)',
      description: `Acme Cloud Labs is seeking a Senior Full-Stack Engineer to architect high-throughput web applications.

Responsibilities:
- Build modular React UI components using modern Hooks and state machines
- Design resilient REST and GraphQL backend services in Node.js / Express
- Optimize SQL query execution plans on PostgreSQL databases
- Write comprehensive unit and integration tests with Jest and Vitest

Requirements:
- 5+ years of experience with TypeScript, React, and Node.js
- Deep understanding of distributed caching with Redis and database indexing
- Excellent asynchronous communication skills`,
      rubric: {
        technical: 30,
        communication: 25,
        problemSolving: 25,
        experience: 20,
      },
      thresholds: {
        minScore: 80,
        autoOffer: true,
      },
      status: 'active',
    },
  });

  const job2 = await prisma.job.create({
    data: {
      org_id: nexusOrg.id,
      title: 'AI Systems & LLM Infrastructure Engineer',
      description: `Nexus AI Studios is scaling our high-performance inference engine. We are hiring an AI Systems Engineer to optimize Model Serving pipelines.

Responsibilities:
- Implement GPU kernel acceleration using PyTorch, CUDA, and TensorRT
- Build auto-scaling vLLM and Triton inference clusters on Kubernetes
- Design memory-efficient KV-cache management algorithms for multi-tenant serving

Requirements:
- Strong background in Python, C++, and PyTorch internals
- Hands-on experience scaling 70B+ parameter transformer models in production`,
      rubric: {
        technical: 40,
        communication: 20,
        problemSolving: 25,
        experience: 15,
      },
      thresholds: {
        minScore: 85,
        autoOffer: false,
      },
      status: 'active',
    },
  });

  const job3 = await prisma.job.create({
    data: {
      org_id: stripeFlowOrg.id,
      title: 'Staff Backend Distributed Systems Architect',
      description: `StripeFlow Fintech processes billions of dollars in daily transactions. We require a Staff Architect to drive core ledger engine architecture.

Responsibilities:
- Lead design of ultra-reliable transaction processing services in Go and Rust
- Ensure 99.999% system availability under extreme load spikes
- Mentor senior engineering staff across 4 global core platform pods`,
      rubric: {
        technical: 35,
        communication: 30,
        problemSolving: 20,
        experience: 15,
      },
      thresholds: {
        minScore: 82,
        autoOffer: true,
      },
      status: 'active',
    },
  });

  console.log('💼 Created 3 Active Enterprise Jobs.');

  // 5. Create Applications across different stages
  const alexProfile = candidateProfiles[0].profile;
  const priyaProfile = candidateProfiles[1].profile;
  const marcusProfile = candidateProfiles[2].profile;
  const elenaProfile = candidateProfiles[3].profile;
  const davidProfile = candidateProfiles[4].profile;
  const sophiaProfile = candidateProfiles[5].profile;

  // App 1: Alex -> Job 1 (Offered & Accepted)
  const app1 = await prisma.application.create({
    data: {
      candidate_id: alexProfile.id,
      job_id: job1.id,
      status: 'accepted',
      hr_round_status: 'passed',
      hr_round_completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // App 2: Priya -> Job 2 (Evaluation Stage)
  const app2 = await prisma.application.create({
    data: {
      candidate_id: priyaProfile.id,
      job_id: job2.id,
      status: 'evaluation',
    },
  });

  // App 3: Marcus -> Job 3 (Offered Stage)
  const app3 = await prisma.application.create({
    data: {
      candidate_id: marcusProfile.id,
      job_id: job3.id,
      status: 'offered',
    },
  });

  // App 4: Elena -> Job 1 (Assessment Stage)
  const app4 = await prisma.application.create({
    data: {
      candidate_id: elenaProfile.id,
      job_id: job1.id,
      status: 'assessment',
    },
  });

  // App 5: David -> Job 2 (Interview Scheduled Stage)
  const app5 = await prisma.application.create({
    data: {
      candidate_id: davidProfile.id,
      job_id: job2.id,
      status: 'interview_scheduled',
    },
  });

  // App 6: Sophia -> Job 1 (Screening Stage)
  const app6 = await prisma.application.create({
    data: {
      candidate_id: sophiaProfile.id,
      job_id: job1.id,
      status: 'screening_completed',
    },
  });

  console.log('📋 Created 6 Pipeline Applications across all stages (accepted, offered, evaluation, assessment, interview_scheduled, screening).');

  // 6. Create Evaluations
  await prisma.evaluation.create({
    data: {
      application_id: app1.id,
      stage: 'final_hiring_decision',
      resume_score: 92,
      interview_score: 90,
      aptitude_score: 88,
      coding_score: 94,
      composite_score: 91,
      confidence: 0.96,
      bias_flag: false,
      bias_report: {
        genderBiasDetected: false,
        nameOriginBiasDetected: false,
        ageBiasDetected: false,
        fairnessScore: 99.8,
      },
      decision: 'hire',
      reasoning: 'Alex demonstrated exceptional software architecture depth, 94% coding pass rate, and clear technical communication.',
    },
  });

  await prisma.evaluation.create({
    data: {
      application_id: app2.id,
      stage: 'ai_evaluation_node',
      resume_score: 95,
      interview_score: 89,
      aptitude_score: 92,
      coding_score: 96,
      composite_score: 93,
      confidence: 0.94,
      bias_flag: false,
      bias_report: {
        fairnessScore: 99.9,
      },
      decision: 'hire',
      reasoning: 'Priya possesses world-class PyTorch and CUDA optimization expertise. Outstanding candidate for AI Infrastructure.',
    },
  });

  console.log('📊 Created Evaluation Scorecards with zero-bias audit validation.');

  // 7. Create Interviews & Transcripts
  await prisma.interview.create({
    data: {
      application_id: app1.id,
      status: 'completed',
      scheduled_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      video_consent: true,
      proctor_flags: {
        gazeOffScreenCount: 0,
        multiplePersonsDetected: false,
        audioDisruptionCount: 0,
        proctorClean: true,
      },
      transcript: [
        {
          speaker: 'interviewer',
          timestamp: '00:01:15',
          text: 'Welcome Alex! Can you describe how you architected the micro-frontend system at your last position?',
        },
        {
          speaker: 'candidate',
          timestamp: '00:01:45',
          text: 'Certainly! We isolated core domain modules into independently deployable Webpack Module Federation bundles with shared React context layers.',
        },
        {
          speaker: 'interviewer',
          timestamp: '00:04:20',
          text: 'How did you prevent cross-bundle CSS pollution and handle version mismatches?',
        },
        {
          speaker: 'candidate',
          timestamp: '00:04:55',
          text: 'We strictly scoped styles using CSS Modules and mandated semantic versioning with automated contract tests in CI/CD.',
        },
      ],
    },
  });

  await prisma.interview.create({
    data: {
      application_id: app5.id,
      status: 'scheduled',
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      video_consent: true,
    },
  });

  console.log('🎙 Created Interview Sessions & Dynamic Transcripts.');

  // 8. Create Assessments & Coding Submissions
  await prisma.assessment.create({
    data: {
      application_id: app4.id,
      test_type: 'aptitude',
      status: 'completed',
      score: 88,
      questions: [
        { id: 'q1', prompt: 'Which data structure offers O(1) amortized lookup and insertion time?' },
        { id: 'q2', prompt: 'Explain the difference between optimistic and pessimistic locking in RDBMS.' },
      ],
      category_breakdown: {
        logic: 90,
        systemArchitecture: 85,
        databaseConcepts: 89,
      },
    },
  });

  await prisma.codingSubmission.create({
    data: {
      application_id: app1.id,
      language: 'typescript',
      code: `export function lruCache<K, V>(capacity: number) {
  const map = new Map<K, V>();
  return {
    get(key: K): V | undefined {
      if (!map.has(key)) return undefined;
      const val = map.get(key)!;
      map.delete(key);
      map.set(key, val);
      return val;
    },
    put(key: K, val: V): void {
      if (map.has(key)) map.delete(key);
      map.set(key, val);
      if (map.size > capacity) {
        const first = map.keys().next().value;
        if (first !== undefined) map.delete(first);
      }
    }
  };
}`,
      test_results: { total: 10, passed: 10, failed: 0 },
      pass_rate: 1.0,
      execution_time_ms: 12,
      memory_mb: 18.4,
      complexity_score: 95,
      ai_feedback: 'Optimal O(1) LRU Cache implementation using JavaScript Map insertion order semantics.',
    },
  });

  console.log('🧩 Created Assessments & Production Coding Submissions.');

  // 9. Create Offers
  await prisma.offer.create({
    data: {
      application_id: app1.id,
      role_title: 'Senior Full-Stack Engineer',
      salary: 170000,
      equity: '0.15% ESOPs',
      start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'accepted',
      signature_svg: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50"><text x="10" y="30" font-family="cursive" font-size="20">Alex Rivers</text></svg>',
      magic_link_token: 'token_acme_alex_offer_2026',
      offer_letter_content: 'Official Employment Offer — Senior Full-Stack Engineer at Acme Cloud Labs.',
    },
  });

  await prisma.offer.create({
    data: {
      application_id: app3.id,
      role_title: 'Staff Backend Distributed Systems Architect',
      salary: 215000,
      equity: '0.25% ESOPs',
      start_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: 'pending',
      magic_link_token: 'token_stripeflow_marcus_offer_2026',
      offer_letter_content: 'Official Employment Offer — Staff Backend Architect at StripeFlow Fintech.',
    },
  });

  console.log('🎁 Created Job Offers (Accepted & Pending).');

  // 10. Create Prep Content
  await prisma.prepContent.create({
    data: {
      company_name: 'Acme Cloud Labs',
      role_archetype: 'Senior Full-Stack Engineer',
      job_id: job1.id,
      org_id: acmeOrg.id,
      questions: [
        'How do you manage cross-microservice transactions without distributed locks?',
        'Describe your strategy for optimizing Next.js Server Components hydration bottlenecks.',
        'Walk through how you design an idempotent payment processing endpoint.',
      ],
      culture_notes: 'Acme Cloud Labs prioritizes asynchronous writing over meetings, deep technical curiosity, and fast iterative delivery.',
      skill_checklist: ['Node.js Event Loop', 'React 19 Server Actions', 'PostgreSQL Query Explain Plans', 'Redis Pub/Sub'],
    },
  });

  console.log('📚 Created Interview Prep Content.');

  // 11. Create Notifications
  await prisma.notification.create({
    data: {
      user_id: hrUser1.id,
      title: 'Offer Accepted!',
      message: 'Alex Rivers has signed the offer letter for Senior Full-Stack Engineer.',
      type: 'shortlist',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      user_id: candidateProfiles[0].user.id,
      title: 'Welcome to Acme Cloud Labs!',
      message: 'Your onboarding checklist is ready. Start reviewing your Day 1 tasks.',
      type: 'system',
      read: true,
    },
  });

  console.log('🔔 Created User Activity Notifications.');

  // 12. Create Talent Bookmarks
  await prisma.talentBookmark.create({
    data: {
      org_id: acmeOrg.id,
      candidate_id: marcusProfile.id,
      job_id: job1.id,
      notes: 'Outstanding distributed systems candidate. Consider for future Infra Lead roles.',
    },
  });

  console.log('🔖 Created Talent Bookmarks.');

  console.log('✅ NextRound realistic database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
