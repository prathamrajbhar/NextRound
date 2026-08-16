import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/config', () => ({
  API_BASE_URL: 'http://localhost:3001',
  siteConfig: {
    apiBaseUrl: 'http://localhost:3001',
    appName: 'HireOS',
    appUrl: 'http://localhost:3000',
    aiServiceUrl: 'http://localhost:8000',
  },
}));

import {
  normalizeCategory,
  normalizeQuestion,
  STANDARD_CATEGORIES,
  type AptitudeQuestion,
} from '@/components/interview/aptitude/useAptitudeQuestions';
import {
  computeAptitudeScore,
  resolveCategoryQuestionCount,
} from '@/components/interview/aptitude/scoring';

const q = (id: string, category: string, correctIndex?: number): AptitudeQuestion => ({
  id,
  category,
  text: `Question ${id}`,
  options: ['A', 'B', 'C', 'D'],
  correctIndex,
});

describe('aptitude/normalizeCategory', () => {
  it('keeps an exact standard category', () => {
    for (const cat of STANDARD_CATEGORIES) {
      expect(normalizeCategory(cat)).toBe(cat);
    }
  });

  it('keeps an exact standard category even with surrounding whitespace', () => {
    expect(normalizeCategory('  Quantitative Aptitude  ')).toBe('Quantitative Aptitude');
  });

  it('maps keyword aliases to their standard category', () => {
    expect(normalizeCategory('Quantitative')).toBe('Quantitative Aptitude');
    expect(normalizeCategory('Maths')).toBe('Quantitative Aptitude');
    expect(normalizeCategory('Arithmetic')).toBe('Quantitative Aptitude');
    expect(normalizeCategory('Logical Reasoning Test')).toBe('Logical Reasoning');
    expect(normalizeCategory('deduction')).toBe('Logical Reasoning');
    expect(normalizeCategory('English')).toBe('Verbal Ability');
    expect(normalizeCategory('Grammar Check')).toBe('Verbal Ability');
    expect(normalizeCategory('Data Charts')).toBe('Data Interpretation');
    expect(normalizeCategory('Graphs and Tables')).toBe('Data Interpretation');
  });

  it('falls back to the standard category by question index for unknown labels', () => {
    expect(normalizeCategory('General Knowledge', 0)).toBe('Quantitative Aptitude');
    expect(normalizeCategory('General Knowledge', 1)).toBe('Logical Reasoning');
    expect(normalizeCategory('General Knowledge', 2)).toBe('Verbal Ability');
    expect(normalizeCategory('General Knowledge', 3)).toBe('Data Interpretation');
  });

  it('falls back to index 0 when no category is provided', () => {
    expect(normalizeCategory(undefined)).toBe('Quantitative Aptitude');
    expect(normalizeCategory('')).toBe('Quantitative Aptitude');
  });
});

describe('aptitude/normalizeQuestion', () => {
  it('fills defaults for missing fields', () => {
    const normalized = normalizeQuestion({}, 2);
    expect(normalized.id).toBe('q_2');
    expect(normalized.category).toBe('Verbal Ability');
    expect(normalized.text).toBe('Question unavailable.');
    expect(normalized.options).toEqual([]);
    expect(normalized.difficulty).toBe('medium');
    expect(normalized.correctIndex).toBeUndefined();
  });

  it('prefers the explicit question field over the legacy field', () => {
    const normalized = normalizeQuestion({ id: '1', text: 'Real', question: 'Legacy' }, 0);
    expect(normalized.text).toBe('Real');
  });

  it('falls back to the legacy question field', () => {
    const normalized = normalizeQuestion({ id: '1', question: 'Legacy' }, 0);
    expect(normalized.text).toBe('Legacy');
  });

  it('accepts snake_case correct_index', () => {
    const normalized = normalizeQuestion({ id: '1', correct_index: 3 }, 0);
    expect(normalized.correctIndex).toBe(3);
  });

  it('prefers camelCase correctIndex over snake_case', () => {
    const normalized = normalizeQuestion({ id: '1', correctIndex: 1, correct_index: 3 }, 0);
    expect(normalized.correctIndex).toBe(1);
  });
});

describe('aptitude/computeAptitudeScore', () => {
  it('scores 100 when all answers are correct', () => {
    const questions = [q('a', 'Quantitative Aptitude', 0), q('b', 'Logical Reasoning', 2), q('c', 'Verbal Ability', 1)];
    expect(computeAptitudeScore({ a: 0, b: 2, c: 1 }, questions)).toBe(100);
  });

  it('scores 0 when no answers are correct', () => {
    const questions = [q('a', 'Quantitative Aptitude', 0)];
    expect(computeAptitudeScore({ a: 3 }, questions)).toBe(0);
  });

  it('rounds partial scores to the nearest integer', () => {
    const questions = [q('a', 'x', 0), q('b', 'x', 1), q('c', 'x', 2)];
    expect(computeAptitudeScore({ a: 0 }, questions)).toBe(33);
    expect(computeAptitudeScore({ a: 0, b: 1 }, questions)).toBe(67);
  });

  it('counts unscorable questions (no correctIndex) as incorrect', () => {
    const questions = [q('a', 'x', 0), q('b', 'x', undefined)];
    expect(computeAptitudeScore({ a: 0, b: 3 }, questions)).toBe(50);
  });

  it('returns 0 for an empty question set', () => {
    expect(computeAptitudeScore({}, [])).toBe(0);
  });
});

describe('aptitude/resolveCategoryQuestionCount', () => {
  const questions = [
    q('a', 'Quantitative Aptitude'),
    q('b', 'Quantitative Aptitude'),
    q('c', 'Logical Reasoning'),
    q('d', 'Logical Reasoning'),
    q('e', 'Logical Reasoning'),
    q('f', 'Verbal Ability'),
    q('g', 'Verbal Ability'),
    q('h', 'Verbal Ability'),
    q('i', 'Verbal Ability'),
  ];

  it('uses the MCQ distribution when provided for that category', () => {
    expect(resolveCategoryQuestionCount({ 'Quantitative Aptitude': 3 }, questions, 'Quantitative Aptitude')).toBe(3);
  });

  it('falls back to the actual question count when no distribution is provided', () => {
    expect(resolveCategoryQuestionCount(null, questions, 'Logical Reasoning')).toBe(3);
    expect(resolveCategoryQuestionCount(null, questions, 'Verbal Ability')).toBe(4);
  });

  it('returns 5 when there are no questions at all', () => {
    expect(resolveCategoryQuestionCount(null, [], 'Quantitative Aptitude')).toBe(5);
  });

  it('distributes the remainder across the standard categories only when a category has no questions', () => {
    // 10 questions, all in Quantitative -> other categories fall back to base distribution
    const allQuant = [
      q('a', 'Quantitative Aptitude'),
      q('b', 'Quantitative Aptitude'),
      q('c', 'Quantitative Aptitude'),
      q('d', 'Quantitative Aptitude'),
      q('e', 'Quantitative Aptitude'),
      q('f', 'Quantitative Aptitude'),
      q('g', 'Quantitative Aptitude'),
      q('h', 'Quantitative Aptitude'),
      q('i', 'Quantitative Aptitude'),
      q('j', 'Quantitative Aptitude'),
    ];

    expect(resolveCategoryQuestionCount(null, allQuant, 'Quantitative Aptitude')).toBe(10);
    // base = 10/4 = 2, remainder = 2 -> Logical Reasoning (index 1) gets one extra
    expect(resolveCategoryQuestionCount(null, allQuant, 'Logical Reasoning')).toBe(3);
    expect(resolveCategoryQuestionCount(null, allQuant, 'Verbal Ability')).toBe(2);
    expect(resolveCategoryQuestionCount(null, allQuant, 'Data Interpretation')).toBe(2);
  });
});