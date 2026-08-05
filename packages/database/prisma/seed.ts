import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HireOS / NextRound database...');

  // Create Organizations
  const swiggy = await prisma.organization.upsert({
    where: { id: 'org-swiggy' },
    update: {},
    create: {
      id: 'org-swiggy',
      name: 'Swiggy',
      logoUrl: 'https://logo.clearbit.com/swiggy.com',
      industry: 'Food Tech / E-commerce',
      size: '5000+ employees',
      settings: { autoOfferEnabled: true, defaultPassScore: 82 }
    }
  });

  const razorpay = await prisma.organization.upsert({
    where: { id: 'org-razorpay' },
    update: {},
    create: {
      id: 'org-razorpay',
      name: 'Razorpay',
      logoUrl: 'https://logo.clearbit.com/razorpay.com',
      industry: 'Fintech / Payments',
      size: '2000+ employees',
      settings: { autoOfferEnabled: false, defaultPassScore: 85 }
    }
  });

  // Create HR User
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@swiggy.in' },
    update: {},
    create: {
      email: 'hr@swiggy.in',
      passwordHash: '$2b$10$e8w8X93N.v9O4zL2d4RkLeH.N02wU6DkK6gL.0wZqE5F2aB.1.1.1', // mock bcrypt hash
      role: 'HR',
      orgId: swiggy.id
    }
  });

  // Create Candidate User
  const candidateUser = await prisma.user.upsert({
    where: { email: 'ananya.iyer@gmail.com' },
    update: {},
    create: {
      email: 'ananya.iyer@gmail.com',
      passwordHash: '$2b$10$e8w8X93N.v9O4zL2d4RkLeH.N02wU6DkK6gL.0wZqE5F2aB.1.1.1',
      role: 'CANDIDATE'
    }
  });

  // Candidate Profile
  const candidateProfile = await prisma.candidateProfile.upsert({
    where: { userId: candidateUser.id },
    update: {},
    create: {
      userId: candidateUser.id,
      resumeUrl: 'ananya_iyer_cv.pdf',
      linkedinUrl: 'https://linkedin.com/in/ananyaiyer',
      githubUrl: 'https://github.com/ananyaiyer',
      skills: ['React', 'Next.js', 'TypeScript', 'Web Performance'],
      targetRoles: ['Senior Frontend Engineer', 'UI Lead'],
      expectedSalary: '₹35,00,000',
      noticePeriod: '30 Days',
      workAuthorization: 'Citizen'
    }
  });

  // Jobs
  const jobFrontend = await prisma.job.upsert({
    where: { id: 'job-101' },
    update: {},
    create: {
      id: 'job-101',
      orgId: swiggy.id,
      title: 'Senior Frontend Engineer — Consumer Platform',
      description: 'We are looking for a Senior Frontend Engineer to build optimized checkout pipelines and micro-frontend modules.',
      rubric: { technical: 40, communication: 20, problemSolving: 20, experience: 20 },
      thresholds: { minScore: 82, autoOffer: true },
      status: 'ACTIVE'
    }
  });

  // Application
  const app = await prisma.application.upsert({
    where: { id: 'app-501' },
    update: {},
    create: {
      id: 'app-501',
      candidateId: candidateProfile.id,
      jobId: jobFrontend.id,
      status: 'DECIDED',
      hrRoundStatus: 'PASSED'
    }
  });

  // Evaluation
  await prisma.evaluation.create({
    data: {
      applicationId: app.id,
      stage: 'Decision',
      resumeScore: 92,
      interviewScore: 89,
      compositeScore: 89,
      biasFlag: false,
      decision: 'HIRE',
      reasoning: 'Ananya demonstrated exceptional mastery of React Concurrent features, virtualized lists, and performance optimizations.'
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
