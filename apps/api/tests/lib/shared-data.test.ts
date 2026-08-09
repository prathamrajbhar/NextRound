import { describe, it, expect } from '@jest/globals';
import aptitudeFallbackQuestions from '@nextround/shared/data/aptitude-questions.json';
import codingProblems from '@nextround/shared/data/coding-problems.json';

/**
 * Canonical shared data banks (packages/shared/data) are the single source of
 * truth for aptitude questions and coding problems, shared across the Express
 * API, the Python AI service agents, and the web client fallback. These tests
 * pin the shape so every consumer (and the honest-failure RuntimeErrors in the
 * Python agents) stays aligned with what is actually in the files.
 */
describe('canonical shared data banks (packages/shared/data)', () => {
  describe('aptitude-questions.json', () => {
    it('contains exactly the canonical 5 questions with unique ids', () => {
      expect(Array.isArray(aptitudeFallbackQuestions)).toBe(true);
      expect(aptitudeFallbackQuestions).toHaveLength(5);

      const ids = new Set<string>();
      for (const q of aptitudeFallbackQuestions) {
        expect(q).toHaveProperty('id');
        expect(ids.has(q.id)).toBe(false);
        ids.add(q.id);
      }
    });

    it('every question has the full canonical shape (answer key included)', () => {
      for (const q of aptitudeFallbackQuestions) {
        expect(q).toHaveProperty('category');
        expect(q).toHaveProperty('difficulty');
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('text');
        expect(q).toHaveProperty('options');
        expect(q).toHaveProperty('correctIndex');
        expect(q).toHaveProperty('explanation');

        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(Number.isInteger(q.correctIndex)).toBe(true);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
        // question and text must stay in sync (routes/agents read both)
        expect(q.text).toBe(q.question);
      }
    });

    it('only the first question carries the {role} placeholder', () => {
      aptitudeFallbackQuestions.forEach((q, idx) => {
        const hasPlaceholder = q.question.includes('{role}') || q.text.includes('{role}');
        if (idx === 0) {
          expect(hasPlaceholder).toBe(true);
        } else {
          expect(hasPlaceholder).toBe(false);
        }
      });
    });
  });

  describe('coding-problems.json', () => {
    it('is non-empty, ids unique, and every problem has at least one test case', () => {
      expect(Array.isArray(codingProblems)).toBe(true);
      expect(codingProblems.length).toBeGreaterThan(0);

      const ids = new Set<string>();
      for (const p of codingProblems) {
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('title');
        expect(ids.has(p.id)).toBe(false);
        ids.add(p.id);

        // Guards the Python execute_sandbox_node RuntimeError: the canonical
        // bank must never define a problem without runnable test cases.
        expect(Array.isArray(p.testCases)).toBe(true);
        expect(p.testCases.length).toBeGreaterThanOrEqual(1);
        for (const tc of p.testCases) {
          expect(tc).toHaveProperty('input');
          expect(tc).toHaveProperty('expectedOutput');
        }
      }
    });
  });
});
