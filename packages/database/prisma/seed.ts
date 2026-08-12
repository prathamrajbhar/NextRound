import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { COMPANIES, RECRUITERS } from './seed/companies';
import { APTITUDE_BANK } from './seed/aptitude';
import { CODING_BANK } from './seed/coding';
import { CANDIDATES } from './seed/candidates';
import { seedApplications } from './seed/applications';
import { seedMocksAndSupport } from './seed/mocks';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Load dotenv before seeding.');
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function cleanDatabase() {
  console.log('🧹 Wiping complete database cleanly...');
  const tables = [
    prisma.proctoringViolation,
    prisma.proctoringEvent,
    prisma.proctoringSession,
    prisma.codingProblemSnapshot,
    prisma.generatedQuestionChunk,
    prisma.codingSubmission,
    prisma.assessment,
    prisma.interview,
    prisma.evaluation,
    prisma.offer,
    prisma.talentBookmark,
    prisma.notification,
    prisma.prepContent,
    prisma.agentLog,
    prisma.mockSession,
    prisma.application,
    prisma.job,
    prisma.candidateProfile,
    prisma.user,
    prisma.organization,
    prisma.aptitudeQuestion,
    prisma.codingProblem,
  ];
  for (const t of tables) {
    await (t as any).deleteMany({});
  }
  console.log('✨ All database tables successfully cleaned.');
}

async function createJobs(orgMap: Map<string, string>) {
  console.log('💼 Creating Job Postings...');
  const rubric = {
    technicalSkills: { weight: 0.4, description: 'Core problem solving, data structures, domain architectures.' },
    systemDesign: { weight: 0.3, description: 'Scalability, fault tolerance, API contracts, caching.' },
    communication: { weight: 0.15, description: 'Clarity of explanation, structured thinking.' },
    cultureFit: { weight: 0.15, description: 'Ownership mindset, collaboration, engineering excellence.' },
  };
  const stages = [
    { id: 'applied', name: 'Applied', order: 1 },
    { id: 'screening', name: 'AI Screening', order: 2 },
    { id: 'assessment', name: 'Technical Assessment', order: 3 },
    { id: 'interview', name: 'Voice & Coding Round', order: 4 },
    { id: 'hr_round', name: 'HR Leadership Round', order: 5 },
    { id: 'offer', name: 'Offer Extended', order: 6 },
  ];
  const assessmentConfig = {
    mcqCount: 15,
    codingProblemCount: 1,
    timeLimitMinutes: 45,
    proctoringRequired: true,
  };

  const templates = [
    { org: 'RazorFlow Technologies', title: 'Senior Backend Engineer (Payments Core)', dept: 'Backend Engineering', salary: '₹30L - ₹48L PA', exp: '4-7 years', skills: ['Go', 'Rust', 'Kafka', 'PostgreSQL', 'System Design'] },
    { org: 'RazorFlow Technologies', title: 'Lead Full-Stack Engineer (Merchant Portal)', dept: 'Full Stack Engineering', salary: '₹35L - ₹55L PA', exp: '5-9 years', skills: ['TypeScript', 'Next.js', 'Node.js', 'PostgreSQL'] },
    { org: 'NexusCloud Labs', title: 'Distributed Systems Engineer (Serverless Cloud)', dept: 'Backend Engineering', salary: '₹28L - ₹45L PA', exp: '3-6 years', skills: ['Go', 'Rust', 'Kubernetes', 'Docker'] },
    { org: 'NexusCloud Labs', title: 'Senior AI Systems Architect', dept: 'AI & Machine Learning', salary: '₹45L - ₹75L PA', exp: '5-9 years', skills: ['Python', 'PyTorch', 'vLLM', 'Ray'] },
    { org: 'ZomatoScale QuickCommerce', title: 'Senior Frontend Architect (Consumer Web)', dept: 'Frontend Engineering', salary: '₹32L - ₹50L PA', exp: '5-8 years', skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS'] },
    { org: 'ZerodhaCore Trading Systems', title: 'Low-Latency C++/Go Systems Engineer', dept: 'Backend Engineering', salary: '₹35L - ₹60L PA', exp: '4-8 years', skills: ['C++', 'Go', 'Low-Latency', 'System Design'] },
    { org: 'CREDExperience Studio', title: 'Principal Design Technologist / UI Architect', dept: 'Frontend Engineering', salary: '₹42L - ₹68L PA', exp: '6-10 years', skills: ['React', 'WebGL', 'Three.js', 'Framer Motion'] },
  ];

  for (const t of templates) {
    const orgId = orgMap.get(t.org)!;
    await prisma.job.create({
      data: {
        org_id: orgId,
        title: t.title,
        description: `### Role Overview\nJoin ${t.org} as a ${t.title}. Participate in high-impact microservices, scalable UI platforms, or low-latency systems.`,
        rubric,
        thresholds: { minScore: 80, autoOffer: false },
        status: 'active',
        location: 'Bengaluru',
        salary: t.salary,
        experienceLevel: t.exp,
        department: t.dept,
        skills: t.skills,
        stages,
        assessmentConfig,
      },
    });
  }
}

async function main() {
  const startedAt = Date.now();
  console.log('🚀 Starting NextRound production-grade database seed...');
  await cleanDatabase();

  const pwHash = await bcrypt.hash('123456789', 10);

  console.log('📚 Seeding Aptitude Questions...');
  await prisma.aptitudeQuestion.createMany({ data: APTITUDE_BANK });

  console.log('💻 Seeding Coding Problems...');
  for (const p of CODING_BANK) {
    await prisma.codingProblem.create({ data: { ...p, is_active: true, version: 1 } });
  }

  console.log('🏢 Creating Organizations...');
  const orgMap = new Map<string, string>();
  for (const c of COMPANIES) {
    const org = await prisma.organization.create({
      data: { name: c.name, industry: c.industry, size: c.size, logo_url: c.logoUrl, settings: c.settings },
    });
    orgMap.set(c.name, org.id);
  }

  console.log('👤 Creating HR Recruiter Accounts...');
  for (const r of RECRUITERS) {
    const orgId = orgMap.get(r.orgName)!;
    await prisma.user.create({
      data: {
        email: r.email,
        password_hash: pwHash,
        role: r.role,
        org_id: orgId,
        profile: { name: r.name, avatarUrl: r.avatarUrl, title: r.title, location: r.location, phone: r.phone, specialties: r.specialties, languages: r.languages },
      },
    });
  }

  await createJobs(orgMap);

  console.log('🎓 Creating Candidate Profiles...');
  for (const c of CANDIDATES) {
    const user = await prisma.user.create({
      data: { email: c.email, password_hash: pwHash, role: 'candidate' },
    });
    await prisma.candidateProfile.create({
      data: {
        user_id: user.id,
        full_name: c.fullName,
        headline: c.headline,
        phone: c.phone,
        location: c.location,
        timezone: c.timezone,
        bio: c.bio,
        skills: c.skills,
        target_roles: c.targetRoles,
        years_of_experience: c.yoe,
        work_mode: c.workMode,
        current_ctc: c.currentCtc,
        expected_salary: c.expectedSalary,
        notice_period: c.noticePeriod,
        work_authorization: c.workAuthorization,
        proud_project: c.proudProject,
        work_values: c.workValues,
        resume_url: c.resumeUrl,
        github_url: c.githubUrl,
        linkedin_url: c.linkedinUrl,
        portfolio_url: c.portfolioUrl,
        parsed_resume: c.parsedResume,
      },
    });
  }

  await seedApplications(prisma);
  await seedMocksAndSupport(prisma);

  const duration = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n======================================================`);
  console.log(`🎉 Database Seed Completed Successfully in ${duration}s!`);
  console.log(`======================================================`);
  console.log(`Demo Credentials:\n  HR: steve.hr@gmail.com / 123456789\n  Candidate: pratham@gmail.com / 123456789`);
  console.log(`======================================================\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
