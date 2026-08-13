import { describe, it, expect } from 'vitest';
import { evaluateInterview } from '../../src/lib/interviewScorer';

describe('apps/web/src/lib/interviewScorer.ts', () => {
  it('does not fabricate scores and reports a pending review instead of a computed number', () => {
    const transcriptData = [
      {
        question: 'Explain how you optimize load times for large image galleries.',
        answer: 'I use lazy loading with blurhash placeholders, webp images, and srcset for fallbacks.',
        feedback: '',
      },
      {
        question: 'Describe your API validation approach.',
        answer: 'I use typescript schema definition with zod runtime validation for nullable types.',
        feedback: '',
      },
    ];

    const result = evaluateInterview({
      role: 'Frontend Engineer',
      transcriptData,
    });

    expect(result.status).toBe('pending_evaluation');
    expect(result.isPending).toBe(true);
    expect(result.score).toBeNull();
    expect(result.rubric.technical).toBeNull();
    expect(result.rubric.communication).toBeNull();
    expect(result.rubric.cultureFit).toBeNull();
    expect(result.feedback).toContain('AI evaluation');
    expect(result.feedback).toContain('2 response(s) recorded');
    expect(result.feedback).toContain('for the Frontend Engineer role');
    expect(result.transcript.length).toBe(2);
    expect(result.transcript[0].feedback).toBe('');
    expect(result.transcript[1].feedback).toBe('');
  });

  it('returns a pending result for empty transcript inputs', () => {
    const result = evaluateInterview({
      role: 'Frontend Engineer',
      transcriptData: [],
    });

    expect(result.status).toBe('pending_evaluation');
    expect(result.isPending).toBe(true);
    expect(result.score).toBeNull();
    expect(result.rubric).toEqual({ technical: null, communication: null, cultureFit: null });
    expect(result.feedback).toContain('0 response(s) recorded');
    expect(result.transcript.length).toBe(0);
  });

  it('counts only non-blank answers as recorded for a partial transcript', () => {
    const transcriptData = [
      {
        question: 'Explain your approach to performance.',
        answer: 'I use lazy loading with blurhash placeholders, webp images, and srcset for fallbacks.',
        feedback: '',
      },
      {
        question: 'Describe your testing strategy.',
        answer: '   ',
        feedback: '',
      },
    ];

    const result = evaluateInterview({
      role: 'Frontend Engineer',
      transcriptData,
    });

    expect(result.status).toBe('pending_evaluation');
    expect(result.isPending).toBe(true);
    expect(result.score).toBeNull();
    expect(result.rubric).toEqual({ technical: null, communication: null, cultureFit: null });
    expect(result.feedback).toContain('1 response(s) recorded');
    expect(result.transcript.length).toBe(2);
    expect(result.transcript[1].answer).toBe('   ');
    expect(result.transcript[0].feedback).toBe('');
    expect(result.transcript[1].feedback).toBe('');
  });

  it('sets isPending: true unconditionally — the flag must never be false on client evaluation', () => {
    const withAnswers = evaluateInterview({
      role: 'Backend Engineer',
      transcriptData: [{ question: 'q1', answer: 'thorough answer', feedback: '' }],
    });
    expect(withAnswers.isPending).toBe(true);

    const withoutAnswers = evaluateInterview({
      role: 'Backend Engineer',
      transcriptData: [],
    });
    expect(withoutAnswers.isPending).toBe(true);
  });

  it('returns a full ScoreResults shape with all null score fields and empty per-row feedback', () => {
    const transcriptData = [
      { question: 'q1', answer: 'solid answer', feedback: '' },
      { question: 'q2', answer: 'another answer', feedback: '' },
    ];
    const result = evaluateInterview({ role: 'Fullstack Engineer', transcriptData });

    expect(result.score).toBeNull();
    expect(result.rubric.technical).toBeNull();
    expect(result.rubric.communication).toBeNull();
    expect(result.rubric.cultureFit).toBeNull();
    expect(result.isPending).toBe(true);
    expect(result.status).toBe('pending_evaluation');

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
      const result = evaluateInterview({ role: 'R', transcriptData });
      expect(result.status).toBe('pending_evaluation');
      expect(result.isPending).toBe(true);
      expect(typeof result.score).not.toBe('number');
      expect(typeof result.rubric.technical).not.toBe('number');
      expect(typeof result.rubric.communication).not.toBe('number');
      expect(typeof result.rubric.cultureFit).not.toBe('number');
    }
  });
});
