import { InterviewRound, AsyncScreening, TakeHomeProject, HighlightClip } from './extendedTypes';

export const mockInterviewRounds: InterviewRound[] = [
  {
    id: 'round-1',
    applicationId: 'app-501',
    candidateName: 'Ananya Iyer',
    roundNumber: 1,
    roundType: 'ai_voice_screen',
    title: 'AI Voice Screening',
    status: 'completed',
    scheduledDate: '2026-07-02',
    durationMinutes: 25,
    score: 89,
    feedback: 'Strong technical communication and structured problem decomposition.'
  },
  {
    id: 'round-2',
    applicationId: 'app-501',
    candidateName: 'Ananya Iyer',
    roundNumber: 2,
    roundType: 'live_coding',
    title: 'Live Coding — Frontend Data Structures',
    status: 'completed',
    scheduledDate: '2026-07-06',
    durationMinutes: 45,
    score: 94,
    feedback: 'Clean, idiomatic solution. Identified the O(n log n) approach immediately.',
    codingProblem: {
      title: 'Virtualized List Window Calculator',
      prompt: 'Given a list of item heights and a viewport height, write a function that returns the indices of items currently visible in the viewport for a given scroll offset.',
      language: 'typescript',
      starterCode: `function getVisibleRange(heights: number[], viewportHeight: number, scrollTop: number): [number, number] {\n  return [0, 0];\n}`,
      candidateCode: `function getVisibleRange(heights: number[], viewportHeight: number, scrollTop: number): [number, number] {\n  let offset = 0, start = -1, end = heights.length - 1;\n  for (let i = 0; i < heights.length; i++) {\n    if (offset + heights[i] > scrollTop && start === -1) start = i;\n    if (offset > scrollTop + viewportHeight) { end = i - 1; break; }\n    offset += heights[i];\n  }\n  return [Math.max(start, 0), end];\n}`,
      testCases: [
        { id: 'tc-1', input: '[40,40,40,40,40], viewport=100, scrollTop=0', expectedOutput: '[0, 2]', passed: true }
      ]
    }
  },
  {
    id: 'round-3',
    applicationId: 'app-501',
    candidateName: 'Ananya Iyer',
    roundNumber: 3,
    roundType: 'system_design',
    title: 'System Design — Checkout Rendering Pipeline',
    status: 'completed',
    scheduledDate: '2026-07-08',
    durationMinutes: 50,
    score: 87,
    feedback: 'Solid high-level architecture with a reasonable caching strategy.',
    systemDesignPrompt: 'Design a client-side rendering pipeline for a food delivery checkout page that must render in under 200ms on 3G.',
    systemDesignNotes: 'Candidate proposed server-rendered shell + streaming SSR, optimistic price updates, and stale-while-revalidate cache.'
  }
];

export const mockAsyncScreenings: AsyncScreening[] = [
  {
    id: 'async-1',
    applicationId: 'app-511',
    candidateName: 'Neha Sharma',
    jobTitle: 'Frontend Engineer — Seller Portal',
    status: 'submitted',
    invitedDate: '2026-07-04',
    submittedDate: '2026-07-06',
    deadline: '2026-07-08',
    responses: [
      { questionId: 'vq-1', question: 'Walk us through a time you had to optimize a UI for low-end devices.', videoUrl: '/mock-video-response.mp4', durationSeconds: 118, attempts: 2, aiSummary: 'Candidate described reducing bundle size via route-level code splitting.' }
    ],
    reviewScore: 84,
    reviewerNotes: 'Clear communicator, grounded in real low-end-device constraints.'
  }
];

export const mockTakeHomeProjects: TakeHomeProject[] = [
  {
    id: 'takehome-1',
    applicationId: 'app-506',
    candidateName: 'Aditi Rao',
    title: 'Ledger Reconciliation Service',
    description: 'Build a small service that ingests two transaction ledgers (JSON) and outputs a reconciliation report.',
    status: 'in_progress',
    assignedDate: '2026-07-09',
    dueDate: '2026-07-14',
    rubric: [
      { criterion: 'Correctness of reconciliation logic', weight: 40 },
      { criterion: 'Test coverage', weight: 25 }
    ]
  }
];

export const mockHighlightClips: HighlightClip[] = [
  { id: 'clip-1', applicationId: 'app-501', timestamp: '03:12', durationSeconds: 42, label: 'Virtualized rendering explanation', question: 'How would you optimize list rendering for a food delivery menu containing thousands of nested items?', transcriptSnippet: 'I would implement windowed list rendering using react-window...', score: 95, tag: 'technical_depth' },
  { id: 'clip-2', applicationId: 'app-501', timestamp: '08:47', durationSeconds: 35, label: 'CLS debugging walkthrough', question: 'Describe how you would debug a layout shift bottleneck on Swiggy checkout.', transcriptSnippet: 'I would use Chrome DevTools Performance panel to isolate CLS...', score: 88, tag: 'problem_solving' }
];
