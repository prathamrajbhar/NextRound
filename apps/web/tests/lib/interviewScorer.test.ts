import { describe, it, expect } from 'vitest';
import { evaluateInterview } from '../../src/lib/interviewScorer';
import { Topic } from '../../src/lib/interviewTopics';

describe('apps/web/src/lib/interviewScorer.ts', () => {
  const sampleTopics: Topic[] = [
    {
      topic: 'Web Performance Optimization',
      question: 'Explain how you optimize load times for large image galleries on slow cellular connections.',
      followUp: 'Good. How do you handle lazy loading placeholder generation?',
      keywords: ['lazy', 'placeholder', 'blurhash', 'webp', 'srcset', 'fallback'],
      source: 'template',
    },
    {
      topic: 'API Integration boundaries',
      question: 'Describe your experience configuring strict type boundaries in complex API response layers.',
      followUp: 'Right. How do you handle runtime payload validation?',
      keywords: ['type', 'zod', 'validation', 'nullable', 'schema', 'typescript'],
      source: 'template',
    },
  ];

  it('does not fabricate scores and reports a pending review instead of a computed number', () => {
    const transcriptData = [
      {
        question: sampleTopics[0].question,
        answer: 'I use lazy loading with blurhash placeholders, webp images, and srcset for fallbacks.',
        feedback: '',
      },
      {
        question: sampleTopics[1].question,
        answer: 'I use typescript schema definition with zod runtime validation for nullable types.',
        feedback: '',
      },
    ];

    const result = evaluateInterview({
      role: 'Frontend Engineer',
      topics: sampleTopics,
      transcriptData,
    });

    expect(result.status).toBe('pending_evaluation');
    expect(result.isPending).toBe(true);
    expect(result.score).toBeNull();
    expect(result.rubric.technical).toBeNull();
    expect(result.rubric.communication).toBeNull();
    expect(result.rubric.cultureFit).toBeNull();
    expect(result.feedback).toContain('AI evaluation');
    // Full transcript: N-of-M count reports all topics as recorded.
    expect(result.feedback).toContain('2 of 2 topic(s)');
    expect(result.feedback).toContain('for the Frontend Engineer role');
    expect(result.transcript.length).toBe(2);
    // Per-transcript feedback must be empty string, never a fabricated grade.
    expect(result.transcript[0].feedback).toBe('');
    expect(result.transcript[1].feedback).toBe('');
  });

  it('returns a pending result with 0-of-M count for empty transcript inputs', () => {
    const result = evaluateInterview({
      role: 'Frontend Engineer',
      topics: sampleTopics,
      transcriptData: [],
    });

    expect(result.status).toBe('pending_evaluation');
    expect(result.isPending).toBe(true);
    expect(result.score).toBeNull();
    expect(result.rubric).toEqual({ technical: null, communication: null, cultureFit: null });
    expect(result.feedback).toContain('0 of 2 topic(s)');
    expect(result.transcript.length).toBe(0);
  });

  it('counts only non-blank answers as recorded for a partial transcript', () => {
    const transcriptData = [
      {
        question: sampleTopics[0].question,
        answer: 'I use lazy loading with blurhash placeholders, webp images, and srcset for fallbacks.',
        feedback: '',
      },
      {
        question: sampleTopics[1].question,
        answer: '   ', // whitespace-only answer is NOT recorded
        feedback: '',
      },
    ];

    const result = evaluateInterview({
      role: 'Frontend Engineer',
      topics: sampleTopics,
      transcriptData,
    });

    expect(result.status).toBe('pending_evaluation');
    expect(result.isPending).toBe(true);
    expect(result.score).toBeNull();
    expect(result.rubric).toEqual({ technical: null, communication: null, cultureFit: null });
    expect(result.feedback).toContain('1 of 2 topic(s)');
    expect(result.transcript.length).toBe(2);
    // Transcript rows are preserved verbatim (feedback is a stub, not a fabricated grade).
    expect(result.transcript[0].question).toBe(sampleTopics[0].question);
    expect(result.transcript[1].answer).toBe('   ');
    // Per-transcript feedback is always empty — never a fabricated per-answer grade.
    expect(result.transcript[0].feedback).toBe('');
    expect(result.transcript[1].feedback).toBe('');
  });

  it('sets isPending: true unconditionally — the flag must never be false on client evaluation', () => {
    // isPending is the authoritative client-side signal consumed by UI components
    // to show "awaiting server evaluation" messaging instead of a fabricated score.
    const withAnswers = evaluateInterview({
      role: 'Backend Engineer',
      topics: sampleTopics,
      transcriptData: [{ question: 'q1', answer: 'thorough answer', feedback: '' }],
    });
    expect(withAnswers.isPending).toBe(true);

    const withoutAnswers = evaluateInterview({
      role: 'Backend Engineer',
      topics: sampleTopics,
      transcriptData: [],
    });
    expect(withoutAnswers.isPending).toBe(true);
  });

  it('returns a full ScoreResults shape with all null score fields and empty per-row feedback', () => {
    const transcriptData = [
      { question: sampleTopics[0].question, answer: 'solid answer', feedback: '' },
      { question: sampleTopics[1].question, answer: 'another answer', feedback: '' },
    ];
    const result = evaluateInterview({ role: 'Fullstack Engineer', topics: sampleTopics, transcriptData });

    // Shape assertions — every nullable score field must be exactly null, not 0 or undefined.
    expect(result.score).toBeNull();
    expect(result.rubric.technical).toBeNull();
    expect(result.rubric.communication).toBeNull();
    expect(result.rubric.cultureFit).toBeNull();
    expect(result.isPending).toBe(true);
    expect(result.status).toBe('pending_evaluation');

    // Every transcript row must carry an empty feedback string (not undefined, not a grade).
    for (const row of result.transcript) {
      expect(row.feedback).toBe('');
      expect(typeof row.question).toBe('string');
      expect(typeof row.answer).toBe('string');
    }
  });

  it('never fabricates a numeric score in any transcript scenario', () => {
    const scenarios = [
      [],
      [{ question: 'q', answer: 'a', feedback: '' }],
      [
        { question: 'q1', answer: 'a1', feedback: '' },
        { question: 'q2', answer: '', feedback: '' },
      ],
    ];

    for (const transcriptData of scenarios) {
      const result = evaluateInterview({ role: 'R', topics: sampleTopics, transcriptData });
      expect(result.status).toBe('pending_evaluation');
      expect(result.isPending).toBe(true);
      expect(typeof result.score).not.toBe('number');
      expect(typeof result.rubric.technical).not.toBe('number');
      expect(typeof result.rubric.communication).not.toBe('number');
      expect(typeof result.rubric.cultureFit).not.toBe('number');
    }
  });
});