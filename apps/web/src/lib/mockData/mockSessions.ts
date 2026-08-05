export interface MockFeedbackCategoryBreakdown {
  category: string;
  score: number;
  feedback: string;
  sampleQuote: string;
}

export interface MockCoachRecommendation {
  category: string;
  title: string;
  description: string;
  link: string;
}

export interface MockTranscriptHighlight {
  timestamp: string;
  speaker: 'interviewer' | 'candidate';
  text: string;
  tag: 'positive' | 'negative' | 'neutral';
  note: string;
}

export interface MockFeedbackData {
  sessionId: string;
  targetRole: string;
  overallScore: number;
  conductedAt: string;
  duration: string;
  metrics: Record<string, number>;
  keyStrengths: string[];
  areasToImprove: string[];
  detailedBreakdown: MockFeedbackCategoryBreakdown[];
  aiCoachRecommendations: MockCoachRecommendation[];
  transcriptHighlights: MockTranscriptHighlight[];
}

export const MOCK_SESSIONS_FEEDBACK: Record<string, MockFeedbackData> = {
  'mock-session-1': {
    sessionId: 'mock-session-1',
    targetRole: 'Senior Full Stack Engineer',
    overallScore: 84,
    conductedAt: '2026-07-25T14:30:00Z',
    duration: '28 minutes',
    metrics: {
      'Technical Depth': 88,
      'Problem Solving': 82,
      'Communication & Tone': 85,
      'System Architecture': 80,
      'Code Efficiency': 85
    },
    keyStrengths: [
      'Articulated trade-offs between Client Components and Server Components in Next.js App Router seamlessly.',
      'Demonstrated high mastery of database connection pooling and query indexing for PostgreSQL.',
      'Maintained composure and clear structure while answering live dynamic follow-up questions.'
    ],
    areasToImprove: [
      'Could improve edge-case handling when dealing with WebSockets reconnection logic.',
      'Provide more concrete metrics when describing past project achievements.'
    ],
    detailedBreakdown: [
      {
        category: 'Next.js & React Architecture',
        score: 90,
        feedback: 'Demonstrated deep familiarity with React 19 Server Actions, dynamic routes, and caching strategies.',
        sampleQuote: 'Server Actions eliminate the need for boilerplate API routes when handling form mutations...'
      },
      {
        category: 'System Design & State Management',
        score: 82,
        feedback: 'Solid structural explanation of micro-frontends and state synchronization across sessions.',
        sampleQuote: 'I prefer using lightweight Zustand stores for global UI state while relying on React Query for server state.'
      },
      {
        category: 'Communication & Problem Solving',
        score: 85,
        feedback: 'Clear, concise, and structured responses using the STAR framework for behavioral scenarios.',
        sampleQuote: 'When our Redis queue backed up during peak traffic, my first step was analyzing the unacknowledged consumer batch size...'
      }
    ],
    aiCoachRecommendations: [
      {
        category: 'Architecture',
        title: 'Deep Dive: Distributed Caching with Redis Streams',
        description: 'Review pattern designs for backpressure handling in high-throughput pub/sub networks.',
        link: '/candidate/prep/system-design'
      },
      {
        category: 'Coding Practice',
        title: 'Concurrency Patterns in Node & TypeScript',
        description: 'Practice managing async rate limiters and retry backoffs.',
        link: '/candidate/prep/coding-dsa'
      }
    ],
    transcriptHighlights: [
      {
        timestamp: '03:12',
        speaker: 'interviewer',
        text: 'How would you handle optimistic UI updates when network connectivity is flaky?',
        tag: 'neutral',
        note: 'Probing candidate strategy for resilience'
      },
      {
        timestamp: '03:45',
        speaker: 'candidate',
        text: 'I immediately update the local React state while queueing the payload in IndexedDB. If the API returns a 5xx, we roll back state and display a localized toast notification.',
        tag: 'positive',
        note: 'Excellent explanation of optimistic state rollback pattern'
      },
      {
        timestamp: '14:20',
        speaker: 'candidate',
        text: 'I am not entirely sure about the exact flags for Redis Sentinel failover off the top of my head, but I know it relies on raft consensus...',
        tag: 'positive',
        note: 'Honest admission of limitation with sound foundational principles'
      }
    ]
  },
  'mock-session-2': {
    sessionId: 'mock-session-2',
    targetRole: 'Lead AI / ML Engineer',
    overallScore: 91,
    conductedAt: '2026-07-26T10:15:00Z',
    duration: '32 minutes',
    metrics: {
      'Technical Depth': 95,
      'Problem Solving': 92,
      'Communication & Tone': 88,
      'System Architecture': 90,
      'Code Efficiency': 90
    },
    keyStrengths: [
      'Exceptional knowledge of LangGraph state machine agent execution and streaming LLM token callbacks.',
      'Comprehensive understanding of RAG hybrid vector search with pgvector and dense embedding reranking.',
      'Clear structured breakdown of latency vs accuracy trade-offs in quantized model inference.'
    ],
    areasToImprove: [
      'Elaborate more on cost governance and token budget capping in high-concurrency production deployments.'
    ],
    detailedBreakdown: [
      {
        category: 'LLM & Agent Frameworks',
        score: 96,
        feedback: 'Expert level understanding of tool calling, agent loops, and memory persistence models.',
        sampleQuote: 'By checkpointing LangGraph state after every node tool call, we ensure fault-tolerant resume capabilities.'
      },
      {
        category: 'Vector Search & Information Retrieval',
        score: 90,
        feedback: 'Clear mastery of HNSW index parameters, distance metrics, and BM25 hybrid ranking.',
        sampleQuote: 'Combining BM25 keyword matching with OpenAI text-embedding-3-small via Reciprocal Rank Fusion yielded the highest precision.'
      }
    ],
    aiCoachRecommendations: [
      {
        category: 'AI Operations',
        title: 'Mastering LLM Guardrails & Token Budget Management',
        description: 'Explore rate limiting and token bucket throttling for enterprise LLM agents.',
        link: '/candidate/prep/ai-ml'
      }
    ],
    transcriptHighlights: [
      {
        timestamp: '05:10',
        speaker: 'interviewer',
        text: 'What is your approach when an LLM agent enters an infinite loop of tool execution?',
        tag: 'neutral',
        note: 'Evaluates agent safety & bounds'
      },
      {
        timestamp: '05:35',
        speaker: 'candidate',
        text: 'We set a strict hard step cap at 10 iterations and enforce structured output schemas via Pydantic or Zod validation. If schemas fail twice, we drop to a human-in-the-loop fallback.',
        tag: 'positive',
        note: 'Flawless production guardrail strategy'
      }
    ]
  },
  'mock-session-3': {
    sessionId: 'mock-session-3',
    targetRole: 'Frontend UX Specialist',
    overallScore: 72,
    conductedAt: '2026-07-27T16:00:00Z',
    duration: '22 minutes',
    metrics: {
      'Technical Depth': 70,
      'Problem Solving': 74,
      'Communication & Tone': 78,
      'System Architecture': 68,
      'Code Efficiency': 70
    },
    keyStrengths: [
      'Strong passion for accessibility (WCAG 2.1 AA), keyboard navigation, and aria tags.',
      'Clean CSS animation principles using Tailwind 4 and Framer Motion micro-interactions.'
    ],
    areasToImprove: [
      'Deepen knowledge of Next.js hydration boundaries and React 19 Concurrent rendering primitives.',
      'Practice dynamic memory profiling using Chrome DevTools Performance panel.'
    ],
    detailedBreakdown: [
      {
        category: 'UI / UX Design Systems',
        score: 80,
        feedback: 'Good eye for design token consistency, dark mode palette contracts, and responsive layout hierarchy.',
        sampleQuote: 'A consistent design system relies on semantic HSL CSS variables rather than arbitrary hex codes.'
      },
      {
        category: 'React Performance & Internals',
        score: 65,
        feedback: 'Struggled slightly when explaining how React fiber reconciles dynamic lists without stable keys.',
        sampleQuote: 'Using array index as key works for static lists, but breaks DOM node reuse during re-ordering.'
      }
    ],
    aiCoachRecommendations: [
      {
        category: 'Frontend Core',
        title: 'React 19 Rendering Internals & Fiber Tree Mastery',
        description: 'Understand concurrent rendering, transitions, and memory leak prevention.',
        link: '/candidate/prep/frontend-specialist'
      }
    ],
    transcriptHighlights: [
      {
        timestamp: '08:45',
        speaker: 'interviewer',
        text: 'How do you measure Layout Shift (CLS) on a complex candidate portal page?',
        tag: 'neutral',
        note: 'Assessing Web Vitals familiarity'
      },
      {
        timestamp: '09:12',
        speaker: 'candidate',
        text: 'We reserve aspect-ratio skeletons for media and avatar blocks to prevent reflow during image load.',
        tag: 'positive',
        note: 'Good UX performance practice'
      }
    ]
  },
  'mock-session-4': {
    sessionId: 'mock-session-4',
    targetRole: 'Senior Backend Architect',
    overallScore: 88,
    conductedAt: '2026-07-28T11:00:00Z',
    duration: '35 minutes',
    metrics: {
      'Technical Depth': 92,
      'Problem Solving': 88,
      'Communication & Tone': 84,
      'System Architecture': 92,
      'Code Efficiency': 84
    },
    keyStrengths: [
      'Mastery of distributed event streaming with Kafka & BullMQ job queues.',
      'Comprehensive understanding of database sharding and read-replica replication lag.'
    ],
    areasToImprove: [
      'Elaborate more on zero-downtime database migration strategies in CI/CD pipelines.'
    ],
    detailedBreakdown: [
      {
        category: 'Distributed Systems',
        score: 94,
        feedback: 'Outstanding explanation of outbox pattern and idempotent message consumption.',
        sampleQuote: 'To guarantee at-least-once delivery without duplicate processing, every event payload carries a unique UUID.'
      }
    ],
    aiCoachRecommendations: [
      {
        category: 'Database Management',
        title: 'Zero-Downtime Schema Migrations in Postgres',
        description: 'Learn dual-write strategies for non-blocking column additions and index builds.',
        link: '/candidate/prep/system-design'
      }
    ],
    transcriptHighlights: [
      {
        timestamp: '12:30',
        speaker: 'candidate',
        text: 'We decoupler the synchronous REST HTTP response from the heavy processing pipeline by placing a BullMQ job producer in Express.',
        tag: 'positive',
        note: 'Clear async decoupling pattern'
      }
    ]
  },
  'mock-session-5': {
    sessionId: 'mock-session-5',
    targetRole: 'DevOps & Infrastructure Lead',
    overallScore: 95,
    conductedAt: '2026-07-28T15:20:00Z',
    duration: '30 minutes',
    metrics: {
      'Technical Depth': 96,
      'Problem Solving': 95,
      'Communication & Tone': 94,
      'System Architecture': 96,
      'Code Efficiency': 94
    },
    keyStrengths: [
      'Superb clarity on Terraform module architecture, Kubernetes ingress controllers, and Prometheus alerting metrics.',
      'Exceptional leadership qualities when handling high-severity incident post-mortems.'
    ],
    areasToImprove: [
      'Minor room to expand on eBPF telemetry monitoring.'
    ],
    detailedBreakdown: [
      {
        category: 'Cloud Infrastructure & Security',
        score: 96,
        feedback: 'In-depth mastery of Zero Trust network policies, secret management, and AWS IAM roles.',
        sampleQuote: 'Secrets should never be baked into container images; we inject them at runtime via HashiCorp Vault sidecars.'
      }
    ],
    aiCoachRecommendations: [
      {
        category: 'Observability',
        title: 'Advanced eBPF Telemetry & Kernel Tracing',
        description: 'Learn modern Linux kernel observability techniques.',
        link: '/candidate/prep/devops'
      }
    ],
    transcriptHighlights: [
      {
        timestamp: '04:15',
        speaker: 'candidate',
        text: 'When our main EKS cluster node pool suffered an OOM, our automated Horizontal Pod Autoscaler triggered node group expansion within 45 seconds.',
        tag: 'positive',
        note: 'Strong production incident response'
      }
    ]
  },
  'mock-session-6': {
    sessionId: 'mock-session-6',
    targetRole: 'Python & Data Structures Practice',
    overallScore: 65,
    conductedAt: '2026-07-29T09:00:00Z',
    duration: '20 minutes',
    metrics: {
      'Technical Depth': 60,
      'Problem Solving': 68,
      'Communication & Tone': 72,
      'System Architecture': 60,
      'Code Efficiency': 65
    },
    keyStrengths: [
      'Good understanding of Python generator functions and list comprehensions.',
      'Receptive to hints and active communicator during coding exercise.'
    ],
    areasToImprove: [
      'Needs practice on space-time complexity analysis (Big-O) for dynamic programming problems.',
      'Review binary tree depth-first traversal vs breadth-first queue traversals.'
    ],
    detailedBreakdown: [
      {
        category: 'Data Structures & Algorithms',
        score: 64,
        feedback: 'Struggled to identify the optimal O(N) sliding window approach before initially coding an O(N^2) brute force solution.',
        sampleQuote: 'I can use nested loops to check every subarray, but that will slow down for large inputs...'
      }
    ],
    aiCoachRecommendations: [
      {
        category: 'Algorithms',
        title: 'Mastering Two Pointers & Sliding Window Patterns',
        description: 'Practice top 15 array and string optimization patterns in Python.',
        link: '/candidate/prep/coding-dsa'
      }
    ],
    transcriptHighlights: [
      {
        timestamp: '10:05',
        speaker: 'candidate',
        text: 'Let me rethink this... using a hash map can help store previously visited indices and reduce lookup time to O(1).',
        tag: 'positive',
        note: 'Good pivot upon interviewer prompt'
      }
    ]
  }
};
