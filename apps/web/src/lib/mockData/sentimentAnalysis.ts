export interface CandidateSentimentProfile {
  id: string;
  candidateName: string;
  role: string;
  avatar: string;
  interviewDate: string;
  durationMinutes: number;
  overallStressScore: number; // 0 - 100 (lower is better)
  confidenceRating: number;   // 0 - 100
  speechClarityScore: number; // 0 - 100
  avgPauseDurationSec: number;
  biomarkers: {
    audioTone: {
      steadyPercent: number;
      tremorPercent: number;
      status: 'Steady & Calm' | 'Mild Anxiety' | 'Highly Stressed';
    };
    speechPace: {
      wpm: number;
      idealRange: string;
      status: 'Optimal (145 WPM)' | 'Rushed (185 WPM)' | 'Hesitant (105 WPM)';
    };
    pitchVariation: {
      hzStdDev: number;
      status: 'Dynamic & Natural' | 'Monotone' | 'High Pitch Spikes';
    };
    pausePatterns: {
      pausesPerMin: number;
      longPauseCount: number;
      status: 'Natural Cadence' | 'Frequent Pauses' | 'Blocking Stalls';
    };
  };
  journeyGraph: {
    time: string; // e.g. "02:15"
    minute: number;
    topic: string;
    confidence: number; // 0 - 100
    stress: number;     // 0 - 100
    hesitation: number; // 0 - 100
    emotionLabel: 'Confident' | 'Neutral' | 'Hesitant' | 'Stressed' | 'Enthusiastic';
  }[];
  transcriptWithSentiment: {
    id: number;
    timestamp: string;
    topic: string;
    speaker: 'AI Agent' | 'Candidate';
    text: string;
    emotion: 'Confident' | 'Neutral' | 'Hesitant' | 'Stressed' | 'Enthusiastic';
    audioMetrics: {
      pitch: string;
      pace: string;
      tone: string;
    };
    hrInsight?: {
      type: 'Nervousness' | 'Skill Gap' | 'High Mastery';
      title: string;
      explanation: string;
    };
  }[];
}

export const mockSentimentProfiles: CandidateSentimentProfile[] = [
  {
    id: 'cand-001',
    candidateName: 'Ananya Iyer',
    role: 'Senior Full Stack Engineer',
    avatar: '/avatar-girl.jpg',
    interviewDate: 'Aug 4, 2026',
    durationMinutes: 18,
    overallStressScore: 24,
    confidenceRating: 88,
    speechClarityScore: 92,
    avgPauseDurationSec: 1.1,
    biomarkers: {
      audioTone: {
        steadyPercent: 89,
        tremorPercent: 11,
        status: 'Steady & Calm'
      },
      speechPace: {
        wpm: 145,
        idealRange: '130-160 WPM',
        status: 'Optimal (145 WPM)'
      },
      pitchVariation: {
        hzStdDev: 28,
        status: 'Dynamic & Natural'
      },
      pausePatterns: {
        pausesPerMin: 3.2,
        longPauseCount: 1,
        status: 'Natural Cadence'
      }
    },
    journeyGraph: [
      { time: '00:30', minute: 0.5, topic: 'Introduction & Warm-up', confidence: 92, stress: 15, hesitation: 10, emotionLabel: 'Enthusiastic' },
      { time: '03:15', minute: 3.25, topic: 'React Server Components & SSR', confidence: 95, stress: 12, hesitation: 8, emotionLabel: 'Confident' },
      { time: '07:40', minute: 7.6, topic: 'Database Indexing & Locks', confidence: 85, stress: 22, hesitation: 18, emotionLabel: 'Neutral' },
      { time: '11:20', minute: 11.3, topic: 'Kafka Partitioning Edge Case', confidence: 62, stress: 58, hesitation: 45, emotionLabel: 'Hesitant' },
      { time: '14:50', minute: 14.8, topic: 'System Scalability Strategy', confidence: 89, stress: 25, hesitation: 15, emotionLabel: 'Confident' },
      { time: '17:30', minute: 17.5, topic: 'Closing & Culture Q&A', confidence: 94, stress: 14, hesitation: 9, emotionLabel: 'Enthusiastic' }
    ],
    transcriptWithSentiment: [
      {
        id: 1,
        timestamp: '00:30',
        topic: 'Introduction & Warm-up',
        speaker: 'AI Agent',
        text: 'Welcome Ananya. To start off, could you briefly summarize your experience leading full stack web projects?',
        emotion: 'Neutral',
        audioMetrics: { pitch: '180 Hz', pace: '140 WPM', tone: 'Calm' }
      },
      {
        id: 2,
        timestamp: '00:55',
        topic: 'Introduction & Warm-up',
        speaker: 'Candidate',
        text: "I've spent over 5 years architecting high-throughput web applications, primarily working with Next.js, Node.js, and distributed PostgreSQL setups.",
        emotion: 'Enthusiastic',
        audioMetrics: { pitch: '210 Hz', pace: '148 WPM', tone: 'Warm & Confident' }
      },
      {
        id: 3,
        timestamp: '03:15',
        topic: 'React Server Components & SSR',
        speaker: 'AI Agent',
        text: 'How do you structure data fetching in Next.js App Router to avoid waterfall requests?',
        emotion: 'Neutral',
        audioMetrics: { pitch: '175 Hz', pace: '138 WPM', tone: 'Calm' }
      },
      {
        id: 4,
        timestamp: '03:45',
        topic: 'React Server Components & SSR',
        speaker: 'Candidate',
        text: 'I leverage parallel data fetching with Promise.all in Server Components or separate nested layout suspense boundaries. This prevents request waterfalls completely.',
        emotion: 'Confident',
        audioMetrics: { pitch: '205 Hz', pace: '144 WPM', tone: 'Steady' },
        hrInsight: {
          type: 'High Mastery',
          title: 'Deep Architectural Understanding',
          explanation: 'Candidate answered instantly without hesitations, showing strong practical mastery of Next.js concurrency.'
        }
      },
      {
        id: 5,
        timestamp: '11:20',
        topic: 'Kafka Partitioning Edge Case',
        speaker: 'AI Agent',
        text: 'Suppose consumer rebalancing causes message duplication during high-frequency order placement. How do you guarantee exact once semantics?',
        emotion: 'Neutral',
        audioMetrics: { pitch: '182 Hz', pace: '142 WPM', tone: 'Calm' }
      },
      {
        id: 6,
        timestamp: '11:50',
        topic: 'Kafka Partitioning Edge Case',
        speaker: 'Candidate',
        text: 'Um... let me think about that. We can use idempotent consumer keys combined with transactional outbox pattern in Postgres... pause... so even if a rebalance occurs, the unique order UUID key rejects duplicate commits.',
        emotion: 'Hesitant',
        audioMetrics: { pitch: '245 Hz (Spike)', pace: '122 WPM (Slower)', tone: 'Mild Tremor' },
        hrInsight: {
          type: 'Nervousness',
          title: 'Temporary Nervous Pause (Not a Skill Gap)',
          explanation: 'The pitch spike and 3.2s pause indicated mild interview nervousness when pressed on edge cases, but the technical solution (idempotent keys + transactional outbox) was 100% accurate.'
        }
      },
      {
        id: 7,
        timestamp: '14:50',
        topic: 'System Scalability Strategy',
        speaker: 'Candidate',
        text: 'For overall horizontally scaled systems, caching at CloudFront CDN coupled with Redis cluster key sharding guarantees sub-50ms response times.',
        emotion: 'Confident',
        audioMetrics: { pitch: '198 Hz', pace: '150 WPM', tone: 'Firm & Clear' }
      }
    ]
  },
  {
    id: 'cand-002',
    candidateName: 'Vikramaditya Sen',
    role: 'Backend Architect',
    avatar: '/avatar-boy.jpg',
    interviewDate: 'Aug 4, 2026',
    durationMinutes: 20,
    overallStressScore: 48,
    confidenceRating: 72,
    speechClarityScore: 84,
    avgPauseDurationSec: 2.3,
    biomarkers: {
      audioTone: {
        steadyPercent: 65,
        tremorPercent: 35,
        status: 'Mild Anxiety'
      },
      speechPace: {
        wpm: 172,
        idealRange: '130-160 WPM',
        status: 'Rushed (185 WPM)'
      },
      pitchVariation: {
        hzStdDev: 42,
        status: 'High Pitch Spikes'
      },
      pausePatterns: {
        pausesPerMin: 5.4,
        longPauseCount: 4,
        status: 'Frequent Pauses'
      }
    },
    journeyGraph: [
      { time: '01:00', minute: 1.0, topic: 'Introduction', confidence: 80, stress: 30, hesitation: 20, emotionLabel: 'Neutral' },
      { time: '05:00', minute: 5.0, topic: 'Microservice Routing', confidence: 85, stress: 25, hesitation: 15, emotionLabel: 'Confident' },
      { time: '10:00', minute: 10.0, topic: 'Distributed Transactions & 2PC', confidence: 50, stress: 68, hesitation: 60, emotionLabel: 'Stressed' },
      { time: '15:00', minute: 15.0, topic: 'Database Migration Strategies', confidence: 75, stress: 40, hesitation: 30, emotionLabel: 'Neutral' }
    ],
    transcriptWithSentiment: [
      {
        id: 1,
        timestamp: '10:00',
        topic: 'Distributed Transactions & 2PC',
        speaker: 'AI Agent',
        text: 'Explain how two-phase commit protocols handle network partition failure in distributed databases.',
        emotion: 'Neutral',
        audioMetrics: { pitch: '175 Hz', pace: '135 WPM', tone: 'Calm' }
      },
      {
        id: 2,
        timestamp: '10:25',
        topic: 'Distributed Transactions & 2PC',
        speaker: 'Candidate',
        text: 'Well, 2PC sends prepare requests... but if the coordinator crashes during commit phase, the participants remain locked waiting for instructions...',
        emotion: 'Stressed',
        audioMetrics: { pitch: '260 Hz', pace: '178 WPM', tone: 'Rapid' },
        hrInsight: {
          type: 'Skill Gap',
          title: 'Lacks Consensus Protocol Nuance',
          explanation: 'High speech pace combined with inability to explain Saga pattern recovery indicates conceptual gap in 2PC failure modes.'
        }
      }
    ]
  }
];
