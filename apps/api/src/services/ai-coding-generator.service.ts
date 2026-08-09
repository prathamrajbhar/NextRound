import { GoogleGenAI } from '@google/genai';
import codingProblems from '@nextround/shared/data/coding-problems.json';

export interface CodingProblemData {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  starterCode: {
    python: string;
    javascript: string;
    typescript: string;
    java: string;
    cpp: string;
  };
  testCases: { name: string; input: string; expected: string; hidden?: boolean }[];
  editorial: string;
  expectedComplexity: { time: string; space: string };
}

export async function generateAiCodingProblem(
  jobTitle: string = 'Software Engineer',
  jobDescription: string = '',
  difficulty: string = 'medium'
): Promise<CodingProblemData> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a principal technical interviewer at Google. Generate a top-tier Data Structures & Algorithms (DSA) coding problem for:
JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription.slice(0, 1000)}
TARGET DIFFICULTY: ${difficulty}

Requirements for JSON output:
- "id": kebab-case unique identifier (e.g. "lru-cache", "sliding-window-max")
- "title": Clear concise problem title
- "difficulty": "Easy", "Medium", or "Hard"
- "category": e.g. "Data Structures & Hashing", "Arrays & Two Pointers", "Trees & Graphs"
- "description": Problem description in markdown
- "constraints": string array of input constraints
- "examples": array of objects { "input": string, "output": string, "explanation": string }
- "starterCode": object with empty method stubs ONLY (with TODO comments, NO solution code filled in!):
    - "python": e.g. "def solution(...):\\n    # TODO\\n    pass\\n"
    - "javascript": e.g. "function solution(...) {\\n  // TODO\\n}\\n"
    - "typescript": e.g. "function solution(...): any {\\n  // TODO\\n}\\n"
    - "java": e.g. "class Solution {\\n    public static any solution(...) {\\n        // TODO\\n    }\\n}\\n"
    - "cpp": e.g. "class Solution {\\npublic:\\n    any solution(...) {\\n        // TODO\\n    }\\n};\\n"
- "testCases": array of 3 test objects { "name": string, "input": string, "expected": string, "hidden": boolean }
- "editorial": 2-sentence optimal algorithm explanation
- "expectedComplexity": object { "time": "O(N)", "space": "O(1)" }

Return ONLY valid JSON matching this exact structure:
{
  "id": "two-sum-dsa",
  "title": "Two Sum Target Pair",
  "difficulty": "Easy",
  "category": "Arrays & Hashing",
  "description": "Given an array of integers nums and an integer target...",
  "constraints": ["2 <= nums.length <= 10^4"],
  "examples": [{ "input": "nums = [2, 7, 11, 15], target = 9", "output": "[0, 1]", "explanation": "2+7=9" }],
  "starterCode": {
    "python": "def two_sum(nums: list[int], target: int) -> list[int]:\\n    # TODO: Implement solution\\n    pass\\n",
    "javascript": "function twoSum(nums, target) {\\n  // TODO: Implement solution\\n}\\n",
    "typescript": "function twoSum(nums: number[], target: number): number[] {\\n  // TODO: Implement solution\\n  return [];\\n}\\n",
    "java": "class Solution {\\n    public int[] twoSum(int[] nums, int target) {\\n        // TODO\\n        return new int[]{};\\n    }\\n}\\n",
    "cpp": "#include <vector>\\nusing namespace std;\\n\\nclass Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        // TODO\\n        return {};\\n    }\\n};\\n"
  },
  "testCases": [
    { "name": "Case 1", "input": "nums = [2, 7, 11, 15], target = 9", "expected": "[0, 1]", "hidden": false },
    { "name": "Case 2", "input": "nums = [3, 2, 4], target = 6", "expected": "[1, 2]", "hidden": false }
  ],
  "editorial": "Use a hash map to store complements in single pass.",
  "expectedComplexity": { "time": "O(N)", "space": "O(N)" }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.title && parsed.starterCode) {
          return {
            id: String(parsed.id || 'ai-dsa-problem'),
            title: String(parsed.title),
            difficulty: (parsed.difficulty === 'Easy' || parsed.difficulty === 'Hard') ? parsed.difficulty : 'Medium',
            category: String(parsed.category || 'Algorithms'),
            description: String(parsed.description || ''),
            constraints: Array.isArray(parsed.constraints) ? parsed.constraints.map(String) : [],
            examples: Array.isArray(parsed.examples) ? parsed.examples : [],
            starterCode: {
              python: String(parsed.starterCode?.python || 'def solution():\n    pass\n'),
              javascript: String(parsed.starterCode?.javascript || 'function solution() {}\n'),
              typescript: String(parsed.starterCode?.typescript || 'function solution() {}\n'),
              java: String(parsed.starterCode?.java || 'class Solution {}\n'),
              cpp: String(parsed.starterCode?.cpp || 'class Solution {};\n'),
            },
            testCases: Array.isArray(parsed.testCases)
              ? parsed.testCases.map((tc: any, i: number) => ({
                  name: String(tc.name || `Case ${i + 1}`),
                  input: String(tc.input || ''),
                  expected: String(tc.expected || tc.expectedOutput || ''),
                  hidden: Boolean(tc.hidden),
                }))
              : [],
            editorial: String(parsed.editorial || 'Optimal DSA solution using efficient hash maps or two pointers.'),
            expectedComplexity: {
              time: String(parsed.expectedComplexity?.time || 'O(N)'),
              space: String(parsed.expectedComplexity?.space || 'O(1)'),
            },
          };
        }
      }
    } catch (err) {
      console.error('Gemini AI Coding Problem generation error:', err);
    }
  }

  // Fallback to canonical coding problem catalog
  const rawList = codingProblems as any[];
  const targetProb = rawList.find((p) => p.id === 'virtualized-list') || rawList[0];

  return {
    id: targetProb.id || 'virtualized-list',
    title: targetProb.title || 'Virtualized List Rendering & Memory Optimization',
    difficulty: targetProb.difficulty || 'Medium',
    category: targetProb.category || 'Data Structures & Performance',
    description: targetProb.description || 'Given heights and scroll position Y, calculate visible index range.',
    constraints: ['1 <= heights.length <= 10^5'],
    examples: [
      {
        input: 'heights = [50, 50, 50, 50, 50], scroll_y = 100, viewport_height = 100',
        output: '[2, 3]',
      },
    ],
    starterCode: {
      python: `def get_visible_range(heights: list[int], scroll_y: int, viewport_height: int) -> list[int]:
    # TODO: Calculate and return [startIndex, endIndex]
    pass
`,
      javascript: `function getVisibleRange(heights, scrollY, viewportHeight) {
  // TODO: Calculate and return [startIndex, endIndex]
}
`,
      typescript: `function getVisibleRange(heights: number[], scrollY: number, viewportHeight: number): number[] {
  // TODO: Calculate and return [startIndex, endIndex]
  return [];
}
`,
      java: `class Solution {
    public static int[] getVisibleRange(int[] heights, int scrollY, int viewportHeight) {
        // TODO: Calculate and return [startIndex, endIndex]
        return new int[]{};
    }
}
`,
      cpp: `#include <vector>
using namespace std;

vector<int> getVisibleRange(const vector<int>& heights, int scrollY, int viewportHeight) {
    // TODO: Calculate and return [startIndex, endIndex]
    return {};
}
`,
    },
    testCases: (targetProb.testCases || []).map((tc: any, i: number) => ({
      name: `Case ${i + 1}`,
      input: tc.input || '',
      expected: tc.expectedOutput || tc.expected || '[2, 3]',
      hidden: Boolean(tc.hidden),
    })),
    editorial: 'Accumulate heights sequentially to locate view bounds.',
    expectedComplexity: { time: 'O(N)', space: 'O(1)' },
  };
}
