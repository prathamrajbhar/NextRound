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

  it('evaluates interview transcript and clamps final score between 68 and 96', () => {
    const transcriptData = [
      {
        question: sampleTopics[0].question,
        answer: 'I use lazy loading with blurhash placeholders, webp images, and srcset for fallbacks.',
        feedback: 'Good answer',
      },
      {
        question: sampleTopics[1].question,
        answer: 'I use typescript schema definition with zod runtime validation for nullable types.',
        feedback: 'Strong answer',
      },
    ];

    const result = evaluateInterview({
      role: 'Frontend Engineer',
      topics: sampleTopics,
      transcriptData,
    });

    expect(result.score).toBeGreaterThanOrEqual(68);
    expect(result.score).toBeLessThanOrEqual(96);
    expect(result.rubric.technical).toEqual(result.score);
    expect(result.transcript.length).toBe(2);
    expect(result.feedback).toContain('Frontend Engineer');
  });

  it('handles empty transcript answers and returns minimum clamped baseline score of 68', () => {
    const transcriptData = [
      { question: 'What is React?', answer: '', feedback: '' },
    ];

    const result = evaluateInterview({
      role: 'Frontend Engineer',
      topics: sampleTopics,
      transcriptData,
    });

    expect(result.score).toBeGreaterThanOrEqual(68);
    expect(result.score).toBeLessThanOrEqual(96);
  });
});
