import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import { prisma } from '@nextround/database';
import codingProblems from '@nextround/shared/data/coding-problems.json';

export interface TestCaseData {
  name: string;
  args: any[];
  expected: any;
  hidden?: boolean;
}

export interface CodingProblemData {
  id: string;
  slug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  entryPoint: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  starterCode: {
    python: string;
    javascript: string;
    typescript: string;
    java: string;
    cpp: string;
  };
  testCases: TestCaseData[];
  publicTests: TestCaseData[];
  hiddenTests: TestCaseData[];
  editorial: string;
  expectedComplexity: { time: string; space: string };
  version: number;
}

/**
 * Generates a dynamic, non-repeating DSA coding problem using Gemini LLM and persists it to the DB.
 */
export async function generateAiCodingProblem(
  jobTitle: string = 'Software Engineer',
  jobDescription: string = '',
  difficulty: string = 'medium'
): Promise<CodingProblemData> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const nonce = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // Sanitize & delimit untrusted prompt parameters to protect against prompt injection
  const safeJobTitle = String(jobTitle || 'Software Engineer').replace(/[\r\n]/g, ' ').slice(0, 100);
  const safeJobDescription = String(jobDescription || '').slice(0, 1000);
  const safeDifficulty = ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase()) ? difficulty.toLowerCase() : 'medium';

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a principal technical interviewer. Generate a BRAND NEW, UNIQUE Data Structures & Algorithms (DSA) coding problem.

<TARGET_JOB_TITLE>
${safeJobTitle}
</TARGET_JOB_TITLE>

<TARGET_JOB_DESCRIPTION>
${safeJobDescription}
</TARGET_JOB_DESCRIPTION>

<TARGET_DIFFICULTY>
${safeDifficulty}
</TARGET_DIFFICULTY>

<NONCE_SEED>
${nonce}
</NONCE_SEED>

CRITICAL INSTRUCTIONS:
- Do NOT generate generic duplicate questions.
- Create a novel algorithmic problem tailored for high-signal technical evaluation.
- All starterCode languages MUST use the exact same function entry point name and parameter order!
- Provide typed args array in test cases (e.g. "args": [[1, 2, 3], 2]) and structured expected values.

Return ONLY valid JSON matching this exact structure:
{
  "id": "unique-kebab-slug-${nonce.slice(-6)}",
  "title": "Problem Title",
  "difficulty": "Medium",
  "category": "Arrays & Hashing",
  "entryPoint": "solution",
  "description": "Problem description markdown...",
  "constraints": ["1 <= N <= 10^4"],
  "examples": [{ "input": "nums = [1, 2, 3], k = 2", "output": "5", "explanation": "Sample run." }],
  "starterCode": {
    "python": "def solution(nums: list[int], k: int) -> int:\\n    # TODO\\n    pass\\n",
    "javascript": "function solution(nums, k) {\\n  // TODO\\n}\\n",
    "typescript": "function solution(nums: number[], k: number): number {\\n  // TODO\\n  return 0;\\n}\\n",
    "java": "class Solution { public static int solution(int[] nums, int k) { return 0; } }\\n",
    "cpp": "class Solution { public: int solution(vector<int>& nums, int k) { return 0; } };\\n"
  },
  "testCases": [
    { "name": "Case 1", "args": [[1, 2, 3], 2], "expected": 5, "hidden": false },
    { "name": "Case 2", "args": [[4, 5], 1], "expected": 9, "hidden": false },
    { "name": "Case 3 (Hidden)", "args": [[10, 20], 5], "expected": 25, "hidden": true }
  ],
  "editorial": "Optimal algorithm explanation.",
  "expectedComplexity": { "time": "O(N)", "space": "O(1)" }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      const cleanJson = extractFirstValidJson(responseText);

      if (cleanJson && cleanJson.title && Array.isArray(cleanJson.testCases)) {
        const publicTests = cleanJson.testCases.filter((tc: any) => !tc.hidden);
        const hiddenTests = cleanJson.testCases.filter((tc: any) => tc.hidden);

        const checksum = crypto.createHash('sha256').update(JSON.stringify(cleanJson)).digest('hex');
        const slug = cleanJson.id || `problem-${nonce.slice(-6)}`;

        // Persist problem to database
        const savedProblem = await prisma.codingProblem.upsert({
          where: { slug },
          update: {
            title: cleanJson.title,
            description: cleanJson.description,
            difficulty: cleanJson.difficulty || 'medium',
            entry_point: cleanJson.entryPoint || 'solution',
            public_tests: publicTests as any,
            hidden_tests: hiddenTests as any,
            seed: nonce,
            checksum,
          },
          create: {
            slug,
            title: cleanJson.title,
            description: cleanJson.description,
            difficulty: cleanJson.difficulty || 'medium',
            entry_point: cleanJson.entryPoint || 'solution',
            public_tests: publicTests as any,
            hidden_tests: hiddenTests as any,
            seed: nonce,
            checksum,
          },
        });

        return {
          id: savedProblem.id,
          slug: savedProblem.slug,
          title: cleanJson.title,
          difficulty: (cleanJson.difficulty as any) || 'Medium',
          category: cleanJson.category || 'Algorithms',
          description: cleanJson.description,
          entryPoint: cleanJson.entry_point || 'solution',
          constraints: cleanJson.constraints || [],
          examples: cleanJson.examples || [],
          starterCode: cleanJson.starterCode,
          testCases: cleanJson.testCases,
          publicTests,
          hiddenTests,
          editorial: cleanJson.editorial || '',
          expectedComplexity: cleanJson.expectedComplexity || { time: 'O(N)', space: 'O(1)' },
          version: savedProblem.version,
        };
      }
    } catch (err) {
      console.error('[AI Coding Problem Generation Error]:', err);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AI coding problem generation failed in production. Static fallback is disabled in production.');
  }

  // Fallback to static curated problem bank for development/testing ONLY
  const fallbackList: any[] = codingProblems as any[];
  const idx = Math.floor(Math.random() * fallbackList.length);
  const selected = fallbackList[idx] || fallbackList[0];

  const slug = `${selected.id}-${nonce.slice(-4)}`;
  const publicTests = selected.testCases ? selected.testCases.filter((tc: any) => !tc.hidden) : [];
  const hiddenTests = selected.testCases ? selected.testCases.filter((tc: any) => tc.hidden) : [];

  const starterCode = {
    python: selected.starterCode?.python || 'def solution():\n    pass\n',
    javascript: selected.starterCode?.javascript || 'function solution() {}\n',
    typescript: selected.starterCode?.typescript || selected.starterCode?.javascript || 'function solution(): void {}\n',
    java: selected.starterCode?.java || 'class Solution { public static void solution() {} }\n',
    cpp: selected.starterCode?.cpp || 'class Solution { public: void solution() {} };\n',
  };

  return {
    id: selected.id,
    slug,
    title: selected.title,
    difficulty: selected.difficulty || 'Medium',
    category: selected.category || 'Algorithms',
    description: selected.description,
    entryPoint: selected.entryPoint || 'solution',
    constraints: selected.constraints || [],
    examples: selected.examples || [],
    starterCode,
    testCases: selected.testCases || [],
    publicTests,
    hiddenTests,
    editorial: selected.editorial || '',
    expectedComplexity: selected.expectedComplexity || { time: 'O(N)', space: 'O(1)' },
    version: 1,
  };
}

function extractFirstValidJson(text: string): any {
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const jsonCandidate = text.slice(firstBrace, lastBrace + 1);
      return JSON.parse(jsonCandidate);
    }
  } catch {}
  return null;
}
