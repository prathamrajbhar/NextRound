import { generateAiCodingProblem } from '../src/services/ai-coding-generator.service';
import { generateAptitudeChunk } from '../src/services/ai-question-generator.service';
import { prisma } from '../src/lib/prisma';

// Define the mock generator behavior for Gemini API calls
const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      };
    }),
  };
});

describe('Dynamic AI Generation Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Aptitude Chunk Dynamic AI Generation', () => {
    it('successfully generates and parses validated aptitude chunks from Gemini API responses', async () => {
      const mockResponse = {
        text: JSON.stringify([
          {
            id: 'chunk_0_q1',
            category: 'Logical Deduction',
            difficulty: 'medium',
            question: 'Logical question stem...',
            options: ['A', 'B', 'C', 'D'],
            correctIndex: 2,
            explanation: 'Explanation text.',
          },
        ]),
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const chunk = await generateAptitudeChunk({
        jobTitle: 'Backend Engineer',
        chunkIndex: 0,
        chunkSize: 1,
      });

      expect(chunk).toHaveLength(1);
      expect(chunk[0].id).toBe('chunk_0_q1');
      expect(chunk[0].category).toBe('Logical Deduction');
      expect(chunk[0].correctIndex).toBe(2);
      expect(chunk[0].options).toEqual(['A', 'B', 'C', 'D']);
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('bubbles up errors if the Gemini API call throws', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Quota Exceeded'));
      await expect(
        generateAptitudeChunk({
          jobTitle: 'Backend Engineer',
          chunkIndex: 0,
          chunkSize: 1,
        })
      ).rejects.toThrow('Quota Exceeded');
    });
  });

  describe('Coding Problem Dynamic AI Generation', () => {
    const mockCodingProblemUpsert = prisma.codingProblem.upsert as jest.Mock;

    it('successfully generates, parses, and persists coding problems', async () => {
      const mockProblemJson = {
        id: 'mock-problem-slug',
        title: 'Mock Problem Title',
        difficulty: 'Medium',
        category: 'Algorithms',
        description: 'Problem description...',
        entryPoint: 'solution',
        constraints: ['1 <= N <= 10^5'],
        examples: [{ input: '1', output: '1', explanation: 'desc' }],
        starterCode: {
          python: 'def solution():\n    pass\n',
          javascript: 'function solution() {}\n',
          typescript: 'function solution() {}\n',
        },
        testCases: [
          { name: 'Case 1', args: [1], expected: 1, hidden: false },
          { name: 'Case 2 (Hidden)', args: [2], expected: 2, hidden: true },
        ],
        editorial: 'Optimal solution explanation...',
        expectedComplexity: { time: 'O(N)', space: 'O(1)' },
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockProblemJson),
      });

      mockCodingProblemUpsert.mockResolvedValue({
        id: 'problem-db-uuid-123',
        slug: 'mock-problem-slug',
        version: 1,
      });

      const problem = await generateAiCodingProblem('Software Engineer', 'React and TS', 'Medium');

      expect(problem.id).toBe('problem-db-uuid-123');
      expect(problem.slug).toBe('mock-problem-slug');
      expect(problem.title).toBe('Mock Problem Title');
      expect(problem.testCases).toHaveLength(2);
      expect(problem.publicTests).toHaveLength(1);
      expect(problem.hiddenTests).toHaveLength(1);
      expect(mockCodingProblemUpsert).toHaveBeenCalled();
    });

    it('bubbles up errors if coding problem generation fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Failure'));
      await expect(
        generateAiCodingProblem('Software Engineer', 'React and TS', 'Medium')
      ).rejects.toThrow('API Failure');
    });
  });
});
