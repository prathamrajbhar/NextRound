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
    },
    {
      topic: 'API Integration boundaries',
      question: 'Describe your experience configuring strict type boundaries in complex API response layers.',
      followUp: 'Right. How do you handle runtime payload validation?',
      keywords: ['type', 'zod', 'validation', 'nullable', 'schema', 'typescript'],
    },
  ];

  it('does not fabricate scores and preserves the transcript without canned feedback', () => {
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

    expect(result.score).toBe(0);
    expect(result.rubric.technical).toBe(0);
    expect(result.rubric.communication).toBe(0);
    expect(result.rubric.cultureFit).toBe(0);
    expect(result.feedback).toBe('');
    expect(result.transcript.length).toBe(2);
    expect(result.transcript.every((t) => t.feedback === '')).toBe(true);
  });

  it('returns a clean empty result for empty transcript inputs', () => {
    const result = evaluateInterview({
      role: 'Frontend Engineer',
      topics: sampleTopics,
      transcriptData: [],
    });

    expect(result.score).toBe(0);
    expect(result.transcript.length).toBe(0);
  });
});