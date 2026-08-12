import { PrismaClient } from '../../src/generated/prisma/client';
import { CANDIDATES } from './candidates';
import { COMPANIES } from './companies';

function getStartDate(offsetDays: number) {
  return new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
}

function getPastDate(offsetDays: number) {
  return new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);
}

export async function seedApplications(prisma: PrismaClient) {
  console.log('📈 Seeding applications funnel...');

  const dbCandidates = await prisma.candidateProfile.findMany({
    include: { user: true },
  });
  const dbJobs = await prisma.job.findMany({
    include: { organization: true },
  });

  const prathamProf = dbCandidates.find((c) => c.user.email === 'pratham@gmail.com')!;
  const rahulProf = dbCandidates.find((c) => c.user.email === 'rahul.backend@gmail.com')!;
  const snehaProf = dbCandidates.find((c) => c.user.email === 'sneha.ui@gmail.com')!;
  const vikramProf = dbCandidates.find((c) => c.user.email === 'vikram.ai@gmail.com')!;

  const razorBackendJob = dbJobs.find((j) => j.organization.name === 'RazorFlow Technologies' && j.title.includes('Backend'))!;
  const zomatoFrontJob = dbJobs.find((j) => j.organization.name === 'ZomatoScale QuickCommerce')!;
  const nexusAiJob = dbJobs.find((j) => j.organization.name === 'NexusCloud Labs' && j.title.includes('AI'))!;
  const zerodhaCoreJob = dbJobs.find((j) => j.organization.name === 'ZerodhaCore Trading Systems' && j.title.includes('C++'))!;
  const credStudioJob = dbJobs.find((j) => j.organization.name === 'CREDExperience Studio')!;

  // 1. Pratham - RazorFlow (Payments Core) -> Offered
  await createApplicationDetails(prisma, {
    candidateId: prathamProf.id,
    jobId: razorBackendJob.id,
    status: 'offered',
    appliedDaysAgo: 15,
    aptitudeScore: 94,
    codingScore: 96,
    codeLanguage: 'typescript',
    codeSnippet: `function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
    transcript: [
      { speaker: 'ai', text: 'How do you handle distributed database transactions in a high-concurrency billing pipeline?' },
      { speaker: 'candidate', text: 'I implement Saga pattern with orchestrators for long-running workflows, and utilize idempotent API keys combined with dual-write safety checks.' },
      { speaker: 'ai', text: 'Perfect. How do you deal with connection leaks in a microservices deployment?' },
      { speaker: 'candidate', text: 'I enforce strictly bound connection pool limits and configure automated health check recycling in the service startup container.' }
    ],
    resumeScore: 95,
    interviewScore: 94,
    decision: 'hire',
    reasoning: 'Exceptional full-stack candidate with strong system architecture knowledge. Highly recommended.',
    offerDetails: {
      salary: 3800000,
      equity: '0.12% equity (4-year vesting, 1-year cliff)',
      letter: 'RazorFlow Technologies Job Offer: Senior Backend Engineer. Base compensation: INR 38,000,000 per annum.',
      status: 'pending',
    },
    proctorViolations: false,
  });

  // 2. Pratham - CREDExperience -> Accepted (With signature SVG)
  await createApplicationDetails(prisma, {
    candidateId: prathamProf.id,
    jobId: credStudioJob.id,
    status: 'accepted',
    appliedDaysAgo: 20,
    aptitudeScore: 92,
    codingScore: 98,
    codeLanguage: 'typescript',
    codeSnippet: `function maxSubArray(nums: number[]): number {\n  let maxSoFar = nums[0];\n  let currMax = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    currMax = Math.max(nums[i], currMax + nums[i]);\n    maxSoFar = Math.max(maxSoFar, currMax);\n  }\n  return maxSoFar;\n}`,
    transcript: [
      { speaker: 'ai', text: 'How do you optimize render performance for WebGL-based charting components?' },
      { speaker: 'candidate', text: 'I batch draws, offload transformation calculations to custom GLSL shaders, and prevent React render cycles on tick updates.' },
    ],
    resumeScore: 96,
    interviewScore: 95,
    decision: 'hire',
    reasoning: 'Superb front-end and WebGL expertise matching our team style. Hiring immediately.',
    offerDetails: {
      salary: 4000000,
      equity: '0.15% equity options',
      letter: 'CREDExperience Studio Job Offer: Lead UI Engineer. Base compensation: INR 40,000,000 per annum.',
      status: 'accepted',
      signature: '<svg viewBox="0 0 200 60"><path d="M10 40 Q 50 10, 90 40 T 170 30" stroke="#ff6b00" fill="none" stroke-width="3"/></svg>',
    },
    proctorViolations: false,
  });

  // 3. Pratham - ZomatoScale -> Interview Scheduled
  await prisma.application.create({
    data: {
      candidate_id: prathamProf.id,
      job_id: zomatoFrontJob.id,
      status: 'interview_scheduled',
      hr_round_status: 'scheduled',
      hr_round_scheduled_at: getStartDate(2),
      applied_at: getPastDate(5),
    },
  });

  // 4. Pratham - NexusCloud -> Assessment In Progress
  const assessment = await prisma.assessment.create({
    data: {
      test_type: 'coding',
      questions: [{ slug: 'valid-parentheses' }] as any,
      status: 'in_progress',
      total_question_count: 1,
    },
  });
  await prisma.application.create({
    data: {
      candidate_id: prathamProf.id,
      job_id: nexusAiJob.id,
      status: 'assessment',
      applied_at: getPastDate(3),
      assessments: { connect: { id: assessment.id } },
    },
  });

  // 5. Pratham - ZerodhaCore -> Applied
  await prisma.application.create({
    data: {
      candidate_id: prathamProf.id,
      job_id: zerodhaCoreJob.id,
      status: 'applied',
      applied_at: getPastDate(1),
    },
  });

  // 6. Rahul Sharma - RazorFlow -> Under Evaluation
  await createApplicationDetails(prisma, {
    candidateId: rahulProf.id,
    jobId: razorBackendJob.id,
    status: 'evaluation',
    appliedDaysAgo: 10,
    aptitudeScore: 88,
    codingScore: 92,
    codeLanguage: 'python',
    codeSnippet: `def max_sub_array(nums):\n    max_sum = current_sum = nums[0]\n    for x in nums[1:]:\n        current_sum = max(x, current_sum + x)\n        max_sum = max(max_sum, current_sum)\n    return max_sum`,
    transcript: [
      { speaker: 'ai', text: 'How do you handle memory allocation overhead inside highly concurrent Go microservices?' },
      { speaker: 'candidate', text: 'I utilize syn.Pool to recycle byte arrays and buffers, minimizing garbage collection pressure and reducing allocations.' },
    ],
    resumeScore: 88,
    interviewScore: 86,
    decision: 'hold_for_review',
    reasoning: 'Very strong backend skills, but need to check his notice period. Keep in hold queue for now.',
    proctorViolations: false,
  });

  // 7. Sneha Patel - ZomatoScale -> Rejected (Constructive rejection notes)
  await createApplicationDetails(prisma, {
    candidateId: snehaProf.id,
    jobId: zomatoFrontJob.id,
    status: 'rejected',
    appliedDaysAgo: 12,
    aptitudeScore: 62,
    codingScore: 58,
    codeLanguage: 'typescript',
    codeSnippet: `function twoSum(nums: number[], target: number): number[] {\n  // inefficient O(n^2) nested loops\n  for(let i=0;i<nums.length;i++){\n    for(let j=i+1;j<nums.length;j++){\n      if(nums[i]+nums[j]===target) return [i,j];\n    }\n  }\n  return [];\n}`,
    transcript: [
      { speaker: 'ai', text: 'Can you optimize your solution to use less than O(N^2) time complexity?' },
      { speaker: 'candidate', text: 'Umm, I am not sure about the hash map approach right now. I will try to think about it.' },
    ],
    resumeScore: 92,
    interviewScore: 68,
    decision: 'reject',
    reasoning: 'Strong resume but fell short in technical coding execution. Inefficient brute-force solution with no hash map optimization.',
    proctorViolations: false,
  });

  // 8. Vikram Malhotra - NexusCloud -> Flagged Proctoring Violation
  await createApplicationDetails(prisma, {
    candidateId: vikramProf.id,
    jobId: nexusAiJob.id,
    status: 'evaluation',
    appliedDaysAgo: 8,
    aptitudeScore: 84,
    codingScore: 88,
    codeLanguage: 'python',
    codeSnippet: `def two_sum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return [lookup[diff], i]\n        lookup[num] = i\n    return []`,
    transcript: [
      { speaker: 'ai', text: 'How do you optimize LLM training metrics across clusters?' },
      { speaker: 'candidate', text: 'I configure standard tensor parallelism using DeepSpeed and vLLM pipelines.' },
    ],
    resumeScore: 86,
    interviewScore: 84,
    decision: 'hold_for_review',
    reasoning: 'Candidate flagged by AI Proctor for repeated tab switching during the coding phase.',
    proctorViolations: true,
  });
}

interface AppDetailsOptions {
  candidateId: string;
  jobId: string;
  status: 'applied' | 'screening' | 'screening_completed' | 'assessment' | 'interview_scheduled' | 'interviewed' | 'evaluation' | 'hr_round' | 'decided' | 'offered' | 'accepted' | 'rejected' | 'withdrawn';
  appliedDaysAgo: number;
  aptitudeScore: number;
  codingScore: number;
  codeLanguage: string;
  codeSnippet: string;
  transcript: Array<{ speaker: 'ai' | 'candidate'; text: string }>;
  resumeScore: number;
  interviewScore: number;
  decision: 'hire' | 'reject' | 'hold_for_review';
  reasoning: string;
  offerDetails?: {
    salary: number;
    equity: string;
    letter: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    signature?: string;
  };
  proctorViolations?: boolean;
}

async function createApplicationDetails(prisma: PrismaClient, opt: AppDetailsOptions) {
  const compositeScore = Number(((opt.resumeScore * 0.25) + (opt.interviewScore * 0.35) + (opt.aptitudeScore * 0.15) + (opt.codingScore * 0.25)).toFixed(1));

  const app = await prisma.application.create({
    data: {
      candidate_id: opt.candidateId,
      job_id: opt.jobId,
      status: opt.status,
      applied_at: getPastDate(opt.appliedDaysAgo),
      hr_round_status: opt.status === 'accepted' || opt.status === 'offered' ? 'passed' : null,
      hr_round_completed_at: opt.status === 'accepted' || opt.status === 'offered' ? getPastDate(3) : null,
    },
  });

  const assessment = await prisma.assessment.create({
    data: {
      application_id: app.id,
      test_type: 'aptitude',
      questions: [] as any,
      responses: [] as any,
      score: Number(((opt.aptitudeScore + opt.codingScore) / 2).toFixed(1)),
      category_breakdown: {
        'Quantitative Aptitude': opt.aptitudeScore,
        'Logical Reasoning': opt.aptitudeScore,
        'Verbal Ability': opt.aptitudeScore,
        'Data Interpretation': opt.aptitudeScore,
      },
      status: 'completed',
    },
  });

  await prisma.codingSubmission.create({
    data: {
      application_id: app.id,
      candidate_id: opt.candidateId,
      language: opt.codeLanguage,
      code: opt.codeSnippet,
      test_results: [{ passed: true, description: 'Standard Test case' }] as any,
      pass_rate: opt.codingScore > 60 ? 1.0 : 0.5,
      pass_rate_percent: opt.codingScore,
      status: 'completed',
      ai_feedback: 'Code compiles successfully.',
    },
  });

  await prisma.interview.create({
    data: {
      application_id: app.id,
      scheduled_at: getPastDate(opt.appliedDaysAgo - 5),
      status: 'completed',
      transcript: opt.transcript as any,
      sentiment_report: {
        sentiment: opt.interviewScore > 75 ? 'positive' : 'neutral',
        confidenceScore: 0.90,
        tone: 'technical',
        clarityScore: opt.interviewScore,
      },
      engagement_signal: { eyeContactPercent: 90, speakingPaceWPM: 130, pausesAppropriate: true },
    },
  });

  await prisma.evaluation.create({
    data: {
      application_id: app.id,
      stage: opt.status,
      resume_score: opt.resumeScore,
      interview_score: opt.interviewScore,
      aptitude_score: opt.aptitudeScore,
      coding_score: opt.codingScore,
      composite_score: compositeScore,
      confidence: 0.95,
      decision: opt.decision,
      reasoning: opt.reasoning,
    },
  });

  if (opt.offerDetails) {
    await prisma.offer.create({
      data: {
        application_id: app.id,
        role_title: 'Software Engineer',
        salary: opt.offerDetails.salary,
        equity: opt.offerDetails.equity,
        start_date: getStartDate(15),
        status: opt.offerDetails.status,
        signature_svg: opt.offerDetails.signature || null,
        offer_letter_content: opt.offerDetails.letter,
        magic_link_token: `magic-token-${app.id}`,
        valid_until: getStartDate(7),
      },
    });
  }

  const proctorSession = await prisma.proctoringSession.create({
    data: {
      candidate_id: opt.candidateId,
      application_id: app.id,
      assessment_id: assessment.id,
      session_type: 'aptitude',
      status: 'ended',
      policy_version: '1.0.0',
      consent_version: '1.0.0',
      started_at: getPastDate(opt.appliedDaysAgo - 2),
      ended_at: getPastDate(opt.appliedDaysAgo - 2),
    },
  });

  if (opt.proctorViolations) {
    await prisma.proctoringViolation.create({
      data: {
        proctoring_session_id: proctorSession.id,
        rule_code: 'repeated_tab_switch',
        severity: 'high',
        occurrence_count: 5,
        first_seen_at: getPastDate(opt.appliedDaysAgo - 2),
        last_seen_at: getPastDate(opt.appliedDaysAgo - 2),
        status: 'pending_review',
        review_reason: 'Switched tabs 5 times during test.',
      },
    });

    await prisma.proctoringEvent.createMany({
      data: [
        {
          proctoring_session_id: proctorSession.id,
          client_event_id: `evt-tab-1-${app.id}`,
          client_sequence: 1,
          server_sequence: 1,
          kind: 'tab_hidden',
          severity: 'warning',
          source: 'browser',
          client_timestamp: getPastDate(opt.appliedDaysAgo - 2),
          session_elapsed_ms: 120000,
          payload_json: { url: 'external-site.com' },
        },
        {
          proctoring_session_id: proctorSession.id,
          client_event_id: `evt-tab-2-${app.id}`,
          client_sequence: 2,
          server_sequence: 2,
          kind: 'tab_visible',
          severity: 'info',
          source: 'browser',
          client_timestamp: getPastDate(opt.appliedDaysAgo - 2),
          session_elapsed_ms: 125000,
          payload_json: {},
        },
      ],
    });
  }
}
