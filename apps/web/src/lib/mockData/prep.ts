export interface MockPrepResource {
  id: string;
  title: string;
  category: 'System Design' | 'Behavioral' | 'Coding / DSA' | 'Voice Practice' | 'AI / ML';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  completedPercentage: number;
  description: string;
  tags: string[];
  sampleQuestions?: Array<{
    id: string;
    question: string;
    tip: string;
    sampleAnswer: string;
  }>;
}

export const MOCK_PREP_RESOURCES: MockPrepResource[] = [
  {
    id: 'prep-101',
    title: 'System Design Core — High Throughput & Distributed Ledgers',
    category: 'System Design',
    difficulty: 'Advanced',
    estimatedMinutes: 45,
    completedPercentage: 80,
    description: 'Master rate limiters, database sharding, transaction outbox patterns, and low-latency caching for scale.',
    tags: ['Redis', 'Kafka', 'PostgreSQL', 'Idempotency', 'Load Balancing'],
    sampleQuestions: [
      {
        id: 'q-1',
        question: 'How would you design a distributed rate limiter for 1,000,000 requests per second?',
        tip: 'Discuss Sliding Window Counter vs Token Bucket algorithms in Redis using Lua scripts.',
        sampleAnswer: 'I would use a Sliding Window Counter implemented via Redis Lua scripts to execute atomic increments...'
      },
      {
        id: 'q-2',
        question: 'What is the Transactional Outbox Pattern and why is it essential?',
        tip: 'Focus on guaranteeing atomic database writes alongside message broker publishing.',
        sampleAnswer: 'Instead of directly publishing messages to Kafka within a DB transaction, we write the event into an outbox table in the same local transaction...'
      }
    ]
  },
  {
    id: 'prep-102',
    title: 'Behavioral Ace — STAR Method for High-Stakes Tech Decisions',
    category: 'Behavioral',
    difficulty: 'Intermediate',
    estimatedMinutes: 30,
    completedPercentage: 100,
    description: 'Learn how to answer conflict, trade-off, and failure questions with poise and structural rigor.',
    tags: ['Leadership', 'STAR Method', 'Conflict Resolution', 'Trade-offs'],
    sampleQuestions: [
      {
        id: 'q-3',
        question: 'Tell me about a time you disagreed with a senior engineer on architectural design.',
        tip: 'Focus on objective benchmarks, POC data, and collaborative compromise.',
        sampleAnswer: 'During our micro-frontend migration, a staff engineer advocated for Web Components while I favored Next.js App Router sub-apps...'
      }
    ]
  },
  {
    id: 'prep-103',
    title: 'Python DSA & Sliding Window Mastery',
    category: 'Coding / DSA',
    difficulty: 'Intermediate',
    estimatedMinutes: 40,
    completedPercentage: 60,
    description: 'Top 15 array, string, and dynamic programming patterns tested by top tech companies.',
    tags: ['Python', 'Arrays', 'Sliding Window', 'Two Pointers', 'Big-O'],
    sampleQuestions: [
      {
        id: 'q-4',
        question: 'Find the longest substring without repeating characters in O(N) time.',
        tip: 'Use a sliding window with a hash map tracking last seen character indices.',
        sampleAnswer: 'We maintain left pointer `i` and right pointer `j` while updating a dict storing index positions...'
      }
    ]
  },
  {
    id: 'prep-104',
    title: 'Voice Interview Simulator — Real-time Technical Q&A',
    category: 'Voice Practice',
    difficulty: 'Intermediate',
    estimatedMinutes: 20,
    completedPercentage: 40,
    description: 'Practice responding verbally to live dynamic AI follow-up prompts with zero lag.',
    tags: ['Voice Console', 'Live Speech', 'Subtitles', 'Audio Proctoring'],
    sampleQuestions: [
      {
        id: 'q-5',
        question: 'Explain React 19 Server Actions vs traditional REST endpoints.',
        tip: 'Highlight zero client bundle overhead and direct DB access in Server Components.',
        sampleAnswer: 'Server Actions allow async functions to execute on the server directly from client forms without manually wiring API routes...'
      }
    ]
  },
  {
    id: 'prep-105',
    title: 'AI / ML Agent Architecture — LangGraph & Vector Search',
    category: 'AI / ML',
    difficulty: 'Advanced',
    estimatedMinutes: 50,
    completedPercentage: 25,
    description: 'Master agent state persistence, tool call retry loops, pgvector index parameters, and BM25 hybrid reranking.',
    tags: ['LangGraph', 'Gemini', 'pgvector', 'RAG', 'Tool Calling'],
    sampleQuestions: [
      {
        id: 'q-6',
        question: 'How do you prevent infinite execution loops in autonomous LLM agents?',
        tip: 'Discuss step caps, structured output schema validation, and human-in-the-loop fallback nodes.',
        sampleAnswer: 'We enforce a step cap of 10 node transitions, state checkpointing in Postgres, and Zod output verification...'
      }
    ]
  }
];
