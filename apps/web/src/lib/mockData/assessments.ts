import { CodingProblem, AssessmentQuestion, AssessmentResult } from './extendedTypes';
import { MockSession, PrepContent as CorePrepContent } from './types';

export const mockCodingProblems: CodingProblem[] = [
  {
    id: 'virtualized-list',
    title: 'Virtualized List Window Calculator',
    difficulty: 'Medium',
    category: 'DOM/Frontend Systems',
    description: 'You are building a virtualized list library to render high-throughput item feeds in a viewport without layout shifts.\n\nGiven an array of integer `heights` representing the height in pixels of items in sequence, a viewport height `viewportHeight`, and the current vertical scroll position `scrollTop`, return a tuple/array `[startIndex, endIndex]` representing the indices of the items that must be active in the DOM.\n\nAn item is active if any part of it is within the scroll window `[scrollTop, scrollTop + viewportHeight]`. Assume the list starts at offset 0.',
    constraints: [
      '1 <= heights.length <= 10^5',
      '10 <= heights[i] <= 1000',
      '100 <= viewportHeight <= 2000',
      '0 <= scrollTop <= sum(heights)'
    ],
    starterCode: {
      javascript: `function getVisibleRange(heights, viewportHeight, scrollTop) {\n  // Implement visual virtual range bounds\n  return [0, 0];\n}`,
      typescript: `function getVisibleRange(heights: number[], viewportHeight: number, scrollTop: number): [number, number] {\n  // Implement visual virtual range bounds\n  return [0, 0];\n}`,
      python: `def get_visible_range(heights: list[int], viewport_height: int, scroll_top: int) -> list[int]:\n    # Implement visual virtual range bounds\n    return [0, 0]`,
      java: `class Solution {\n    public int[] getVisibleRange(int[] heights, int viewportHeight, int scrollTop) {\n        // Implement visual virtual range bounds\n        return new int[]{0, 0};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> getVisibleRange(vector<int>& heights, int viewportHeight, int scrollTop) {\n        // Implement visual virtual range bounds\n        return {0, 0};\n    }\n};`
    },
    testCases: [
      { id: 'tc-1', input: 'heights = [50, 50, 50, 50], viewportHeight = 100, scrollTop = 0', expectedOutput: '[0, 1]', description: 'Top of page load showing exactly first two elements' },
      { id: 'tc-2', input: 'heights = [40, 60, 50, 80, 50], viewportHeight = 120, scrollTop = 90', expectedOutput: '[1, 3]', description: 'Scrolled down past first element, displaying middle overlapping elements' },
      { id: 'tc-3', input: 'heights = [100, 200, 300], viewportHeight = 50, scrollTop = 350', expectedOutput: '[2, 2]', description: 'Small viewport centered inside final element height' }
    ]
  },
  {
    id: 'two-sum',
    title: 'Two Sum Vetting',
    difficulty: 'Easy',
    category: 'Algorithms/Arrays',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= target <= 10^9'],
    starterCode: {
      javascript: `function twoSum(nums, target) { return []; }`,
      typescript: `function twoSum(nums: number[], target: number): number[] { return []; }`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]: return []`,
      java: `class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{}; } }`,
      cpp: `class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {}; } };`
    },
    testCases: [
      { id: 'tc-1', input: 'nums = [2, 7, 11, 15], target = 9', expectedOutput: '[0, 1]', description: 'First two elements sum up directly' }
    ]
  }
];

export const mockAssessmentQuestions: AssessmentQuestion[] = [
  { id: 'aq-1', type: 'numerical', prompt: 'A delivery fleet completes 240 orders in 6 hours. At the same rate, how many orders complete in 9 hours?', options: ['320', '360', '340', '300'], timeLimitSeconds: 60 },
  { id: 'aq-2', type: 'multiple_choice', prompt: 'Which data structure gives O(1) average lookup time for key-value pairs?', options: ['Linked List', 'Hash Map', 'Binary Search Tree', 'Array'], timeLimitSeconds: 45 },
  { id: 'aq-3', type: 'numerical', prompt: 'If a checkout conversion rate improves from 2.5% to 3.0%, what is the relative percentage increase?', options: ['20%', '5%', '50%', '0.5%'], timeLimitSeconds: 60 },
  { id: 'aq-4', type: 'personality_scale', prompt: 'I prefer to resolve disagreements with teammates directly and immediately rather than escalate.', timeLimitSeconds: 30 },
  { id: 'aq-5', type: 'personality_scale', prompt: 'I feel energized when working under tight, ambiguous deadlines.', timeLimitSeconds: 30 }
];

export const mockAssessments: AssessmentResult[] = [
  {
    id: 'assess-1',
    applicationId: 'app-501',
    candidateName: 'Ananya Iyer',
    assessmentName: 'Frontend Engineering Aptitude Test',
    category: 'aptitude',
    status: 'completed',
    completedDate: '2026-07-03',
    durationMinutes: 28,
    overallScore: 91,
    percentile: 96,
    sectionScores: [
      { section: 'Logical Reasoning', score: 94, benchmark: 78 },
      { section: 'Data Structures', score: 90, benchmark: 75 },
      { section: 'Numerical Ability', score: 88, benchmark: 72 }
    ]
  },
  {
    id: 'assess-503',
    applicationId: 'app-503',
    candidateName: 'Rohan Deshmukh',
    assessmentName: 'Full-Stack Engineering Aptitude Test',
    category: 'aptitude',
    status: 'completed',
    completedDate: '2026-07-04',
    durationMinutes: 30,
    overallScore: 89,
    percentile: 94,
    sectionScores: [
      { section: 'Logical Reasoning', score: 92, benchmark: 78 },
      { section: 'Data Structures', score: 88, benchmark: 75 },
      { section: 'System Design Logic', score: 87, benchmark: 72 }
    ]
  }
];

export const mockSessions: MockSession[] = [
  {
    id: 'mock-session-123',
    targetCompany: 'Swiggy',
    targetRole: 'Senior Frontend Engineer',
    difficulty: 'mid',
    rubric: { technical: 80, communication: 90, cultureFit: 85 },
    score: 85,
    date: '2026-07-02',
    feedback: 'Your technical logic on DOM rendering was strong, and you did a fantastic job explaining component-level state updates.',
    transcript: [
      {
        question: 'Explain the benefits of React Server Components over standard SSR in Next.js.',
        answer: 'In standard SSR, the server renders HTML, but we still ship the full JavaScript bundle for all components to hydrate on the client. With RSCs, components execute solely on the server and their dependencies are not bundled.',
        feedback: 'Excellent breakdown of serialization vs raw hydration mechanisms.'
      }
    ]
  }
];

export const mockPrepContent: CorePrepContent[] = [
  {
    id: 'prep-swiggy',
    companyName: 'Swiggy',
    logo: 'https://logo.clearbit.com/swiggy.com',
    roleArchetype: 'Software Engineer',
    difficulty: 'Medium to Hard',
    cultureNotes: 'Focuses heavily on customer transit times, extreme scale handling, real-time dispatch systems, and micro-frontend structures.',
    questions: [
      {
        question: 'How do you design a real-time order tracking map that updates driver locations efficiently?',
        tip: 'Mention WebSockets or Server-Sent Events (SSE) for server-to-client updates, geographic database indexing using Redis Geospatial.',
        sampleAnswer: 'To design Swiggy-scale live tracking, I would establish WebSocket connections for connected clients, streaming coordinates throttled at 3-second intervals.'
      }
    ]
  }
];
