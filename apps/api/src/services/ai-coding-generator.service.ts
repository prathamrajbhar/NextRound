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

/**
 * Generates a dynamic, non-repeating DSA coding problem using Gemini LLM.
 * Guarantees a fresh problem per call by passing a dynamic nonce seed.
 */
export async function generateAiCodingProblem(
  jobTitle: string = 'Software Engineer',
  jobDescription: string = '',
  difficulty: string = 'medium'
): Promise<CodingProblemData> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const nonce = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a principal technical interviewer at Google. Generate a BRAND NEW, UNIQUE, and DISTINCT Data Structures & Algorithms (DSA) coding problem for:
JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription.slice(0, 1000)}
TARGET DIFFICULTY: ${difficulty}
NONCE SEED: ${nonce}

CRITICAL INSTRUCTIONS:
- Do NOT generate generic duplicate questions (such as standard Two Sum or basic LRU Cache).
- Create a novel algorithmic problem tailored for high-signal technical evaluation.
- All 5 starterCode languages MUST use the exact same function name and parameter order!

Requirements for JSON output:
- "id": kebab-case unique identifier (e.g. "task-dependency-scheduler-${nonce.slice(-4)}")
- "title": Clear, professional problem title
- "difficulty": "Easy", "Medium", or "Hard"
- "category": e.g. "Arrays & Hashing", "Sliding Window", "Dynamic Programming", "Graphs & Trees", "Stack & Queue"
- "description": Complete problem statement in markdown format explaining the task, inputs, and expected return value.
- "constraints": array of input constraint strings (e.g. ["1 <= nums.length <= 10^5"])
- "examples": array of 2 example objects { "input": string, "output": string, "explanation": string }
- "starterCode": object containing method stubs ONLY (with TODO comments, NO solution logic filled in!):
    - "python": e.g. "def solution(nums: list[int], k: int) -> int:\n    # TODO: Implement solution\n    pass\n"
    - "javascript": e.g. "function solution(nums, k) {\n  // TODO: Implement solution\n}\n"
    - "typescript": e.g. "function solution(nums: number[], k: number): number {\n  // TODO: Implement solution\n  return 0;\n}\n"
    - "java": e.g. "class Solution {\n    public static int solution(int[] nums, int k) {\n        // TODO\n        return 0;\n    }\n}\n"
    - "cpp": e.g. "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int solution(vector<int>& nums, int k) {\n        // TODO\n        return 0;\n    }\n};\n"
- "testCases": array of 3-4 test objects { "name": string, "input": string, "expected": string, "hidden": boolean }
    Note: "input" must assign arguments clearly (e.g. "nums = [1, 2, 3], k = 2") and "expected" must match returned output format.
- "editorial": 2-sentence explanation of optimal solution algorithm.
- "expectedComplexity": object { "time": "O(N)", "space": "O(1)" }

Return ONLY valid JSON matching this exact structure:
{
  "id": "unique-problem-id",
  "title": "Problem Title",
  "difficulty": "Medium",
  "category": "Arrays & Hashing",
  "description": "Problem markdown...",
  "constraints": ["1 <= N <= 10^4"],
  "examples": [{ "input": "nums = [1, 2, 3], k = 2", "output": "5", "explanation": "Sample run." }],
  "starterCode": {
    "python": "def solution(nums: list[int], k: int) -> int:\n    pass\n",
    "javascript": "function solution(nums, k) {}\n",
    "typescript": "function solution(nums: number[], k: number): number { return 0; }\n",
    "java": "class Solution { public static int solution(int[] nums, int k) { return 0; } }\n",
    "cpp": "class Solution { public: int solution(vector<int>& nums, int k) { return 0; } };\n"
  },
  "testCases": [
    { "name": "Case 1", "input": "nums = [1, 2, 3], k = 2", "expected": "5", "hidden": false },
    { "name": "Case 2", "input": "nums = [4, 5], k = 1", "expected": "9", "hidden": false }
  ],
  "editorial": "Optimal algorithm explanation.",
  "expectedComplexity": { "time": "O(N)", "space": "O(1)" }
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
            id: String(parsed.id || `ai-dsa-${nonce}`),
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

  // Fallback to procedurally randomized dynamic coding problem
  return generateProceduralCodingProblem(jobTitle, difficulty);
}

/**
 * Generates a procedurally dynamic coding problem with randomized parameters.
 * Guarantees a non-static, varied question even when Gemini API is unreachable.
 */
function generateProceduralCodingProblem(jobTitle: string, difficulty: string): CodingProblemData {
  const seed = Math.floor(Math.random() * 1000);
  const problemTemplates = [
    {
      type: 'max_sub_array_sum',
      title: 'Maximum Contiguous Subarray Sum',
      category: 'Arrays & Dynamic Programming',
      funcName: 'maxSubArray',
      desc: 'Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
      pythonStarter: 'def maxSubArray(nums: list[int]) -> int:\n    # TODO: Implement solution\n    pass\n',
      jsStarter: 'function maxSubArray(nums) {\n  // TODO: Implement solution\n}\n',
      tsStarter: 'function maxSubArray(nums: number[]): number {\n  // TODO: Implement solution\n  return 0;\n}\n',
      javaStarter: 'class Solution {\n    public static int maxSubArray(int[] nums) {\n        // TODO: Implement solution\n        return 0;\n    }\n}\n',
      cppStarter: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // TODO: Implement solution\n        return 0;\n    }\n};\n',
      cases: [
        { name: 'Case 1', input: `nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`, expected: '6', hidden: false },
        { name: 'Case 2', input: `nums = [1, 2, 3, 4]`, expected: '10', hidden: false },
        { name: 'Case 3', input: `nums = [5, -2, 3, 1]`, expected: '7', hidden: true },
      ],
      editorial: 'Use Kadane Algorithm: track current max sum and global max sum in a single linear pass.',
      time: 'O(N)',
      space: 'O(1)',
    },
    {
      type: 'character_frequency_threshold',
      title: 'K-Frequency Dominant Character Count',
      category: 'Strings & Hashing',
      funcName: 'countDominantChars',
      desc: 'Given a string `s` and an integer `k`, return the count of distinct characters that appear at least `k` times in the string.',
      pythonStarter: 'def countDominantChars(s: str, k: int) -> int:\n    # TODO: Implement solution\n    pass\n',
      jsStarter: 'function countDominantChars(s, k) {\n  // TODO: Implement solution\n}\n',
      tsStarter: 'function countDominantChars(s: string, k: number): number {\n  // TODO: Implement solution\n  return 0;\n}\n',
      javaStarter: 'class Solution {\n    public static int countDominantChars(String s, int k) {\n        // TODO\n        return 0;\n    }\n}\n',
      cppStarter: '#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    int countDominantChars(string s, int k) {\n        // TODO\n        return 0;\n    }\n};\n',
      cases: [
        { name: 'Case 1', input: `s = "nextroundcoding", k = 2`, expected: '4', hidden: false },
        { name: 'Case 2', input: `s = "aaaaabbb", k = 3`, expected: '2', hidden: false },
        { name: 'Case 3', input: `s = "abcdef", k = 2`, expected: '0', hidden: true },
      ],
      editorial: 'Construct a frequency map of characters and filter counts that are >= k.',
      time: 'O(N)',
      space: 'O(U) where U is unique characters',
    },
    {
      type: 'sliding_window_max',
      title: 'Sliding Window Maximum Target',
      category: 'Sliding Window & Deque',
      funcName: 'maxSlidingWindow',
      desc: 'Given an array of integers `nums` and a sliding window size `k`, return the array of maximum values in each sliding window as it moves from left to right.',
      pythonStarter: 'def maxSlidingWindow(nums: list[int], k: int) -> list[int]:\n    # TODO: Implement solution\n    pass\n',
      jsStarter: 'function maxSlidingWindow(nums, k) {\n  // TODO: Implement solution\n}\n',
      tsStarter: 'function maxSlidingWindow(nums: number[], k: number): number[] {\n  // TODO: Implement solution\n  return [];\n}\n',
      javaStarter: 'class Solution {\n    public static int[] maxSlidingWindow(int[] nums, int k) {\n        // TODO\n        return new int[]{};\n    }\n}\n',
      cppStarter: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        // TODO\n        return {};\n    }\n};\n',
      cases: [
        { name: 'Case 1', input: `nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3`, expected: '[3, 3, 5, 5, 6, 7]', hidden: false },
        { name: 'Case 2', input: `nums = [4, 2, 12, 3], k = 2`, expected: '[4, 12, 12]', hidden: false },
      ],
      editorial: 'Use a monotonic deque to maintain indices of maximum elements in O(N) time.',
      time: 'O(N)',
      space: 'O(K)',
    },
  ];

  const t = problemTemplates[seed % problemTemplates.length];
  const problemId = `proc-${t.type}-${seed}`;

  return {
    id: problemId,
    title: `${t.title} (${jobTitle})`,
    difficulty: difficulty === 'easy' ? 'Easy' : difficulty === 'hard' ? 'Hard' : 'Medium',
    category: t.category,
    description: `### ${t.title}\n\n${t.desc}\n\n*Targeted Role Context: ${jobTitle}*`,
    constraints: ['1 <= input.length <= 10^5'],
    examples: [
      {
        input: t.cases[0].input,
        output: t.cases[0].expected,
      },
    ],
    starterCode: {
      python: t.pythonStarter,
      javascript: t.jsStarter,
      typescript: t.tsStarter,
      java: t.javaStarter,
      cpp: t.cppStarter,
    },
    testCases: t.cases,
    editorial: t.editorial,
    expectedComplexity: { time: t.time, space: t.space },
  };
}
