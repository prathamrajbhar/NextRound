import { PrismaClient } from '../../src/generated/prisma/client';

export async function seedMocksAndSupport(prisma: PrismaClient) {
  console.log('🎯 Seeding mock sessions, prep, notifications, bookmarks...');

  const dbCandidates = await prisma.candidateProfile.findMany({
    include: { user: true },
  });
  const dbUsers = await prisma.user.findMany();
  const dbJobs = await prisma.job.findMany({
    include: { organization: true },
  });

  const prathamProf = dbCandidates.find((c) => c.user.email === 'pratham@gmail.com')!;
  const rahulProf = dbCandidates.find((c) => c.user.email === 'rahul.backend@gmail.com')!;
  const steveUser = dbUsers.find((u) => u.email === 'steve.hr@gmail.com')!;

  const razorBackendJob = dbJobs.find((j) => j.organization.name === 'RazorFlow Technologies' && j.title.includes('Backend'))!;

  // 1. Mock Session for Pratham
  await prisma.mockSession.create({
    data: {
      candidate_id: prathamProf.id,
      target_company: 'RazorFlow Technologies',
      target_role: 'Senior Backend Engineer',
      difficulty: 'hard',
      type: 'mock',
      status: 'completed',
      current_section: 'completed',
      started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      final_score: 91,
      score: 91,
      final_feedback: {
        summary: 'Excellent scalability understanding and clean code design.',
        strengths: ['Transaction safety', 'Kafka streams integration'],
        areasForImprovement: ['Refining cache eviction edge cases'],
      },
      feedback: { overallScore: 91 },
      topic: 'Fintech Backend & Concurrency',
      focus_areas: ['Distributed Systems', 'System Design'],
      rubric: { technical: 95, communication: 90, cultureFit: 88 },
      transcript: [
        {
          question: 'How do you structure database connection pool health checks?',
          answer: 'I configure standard ping queries combined with periodic connection timeouts.',
          feedback: 'Solid implementation plan.',
        },
      ] as any,
    },
  });

  // 2. Resume Builder Session for Pratham
  await prisma.mockSession.create({
    data: {
      candidate_id: prathamProf.id,
      target_company: 'General Tech',
      target_role: 'Senior Full-Stack Engineer',
      type: 'resume_builder',
      status: 'completed',
      started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      final_score: 95,
      generated_resume: {
        name: 'Pratham Rajbhar',
        title: 'Senior Full-Stack Engineer',
        email: 'pratham@gmail.com',
        phone: '+91 98192 83746',
        skills: ['TypeScript', 'Next.js', 'Go', 'PostgreSQL'],
      } as any,
    },
  });

  // 3. Prep Guides
  await prisma.prepContent.createMany({
    data: [
      {
        company_name: 'RazorFlow Technologies',
        role_archetype: 'Senior Backend Engineer',
        org_id: razorBackendJob.org_id,
        culture_notes: 'RazorFlow values system safety, high reliability, and deep low-latency database architecture.',
        questions: [
          { question: 'How do you design a database transaction ledger to be strictly serializable?', type: 'technical' },
          { question: 'Describe a complex race condition you resolved in your previous system.', type: 'behavioral' },
        ] as any,
        skill_checklist: ['Distributed Transactions', 'Kafka Event Safety', 'Optimistic Locking'],
      },
      {
        company_name: 'CREDExperience Studio',
        role_archetype: 'Senior UI Engineer',
        culture_notes: 'CREDExperience values pixel-perfection, fine UI rendering performance, and custom design systems.',
        questions: [
          { question: 'How do you optimize animation rendering cycles to guarantee 120fps?', type: 'technical' },
        ] as any,
        skill_checklist: ['CSS Grid & Motion Physics', 'Framer Motion Batching', 'WebGL Canvas Tuning'],
      },
    ],
  });

  // 4. Notifications
  await prisma.notification.createMany({
    data: [
      {
        user_id: prathamProf.user_id,
        title: 'Offer Letter Ready!',
        message: 'RazorFlow Technologies has extended an official offer. Check your dashboard to sign.',
        type: 'success',
        read: false,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        user_id: prathamProf.user_id,
        title: 'Interview Scheduled',
        message: 'ZomatoScale Technical Voice round scheduled for Thursday.',
        type: 'info',
        read: false,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        user_id: steveUser.id,
        title: 'New High-Score Candidate',
        message: 'Pratham Rajbhar completed Payments Core coding assessment with 96%.',
        type: 'success',
        read: false,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 5. Talent Bookmarks (HR bookmarks Rahul Sharma)
  await prisma.talentBookmark.create({
    data: {
      org_id: razorBackendJob.org_id,
      candidate_id: rahulProf.id,
      job_id: razorBackendJob.id,
      notes: 'Outstanding low-latency Go/Rust developer. Extremely strong fit for transaction engineering team.',
    },
  });

  // 6. Agent Logs
  await prisma.agentLog.createMany({
    data: [
      {
        org_id: razorBackendJob.org_id,
        job_id: razorBackendJob.id,
        agent_name: 'ResumeScreeningAgent',
        action: 'screen_applications',
        input: { jobTitle: razorBackendJob.title },
        output: { screened: 15, qualified: 5 },
        status: 'completed',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        org_id: razorBackendJob.org_id,
        job_id: razorBackendJob.id,
        agent_name: 'EvaluationAgent',
        action: 'compute_composite_scorecards',
        input: { applicantName: 'Rahul Sharma' },
        output: { status: 'success' },
        status: 'completed',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });
}
