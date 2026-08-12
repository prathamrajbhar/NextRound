export interface CodingSeedItem {
  slug: string;
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  description: string;
  starter_code: Record<string, string>;
  entry_point: string;
  public_tests: Array<{ input: unknown; expected: unknown; description: string }>;
  hidden_tests: Array<{ input: unknown; expected: unknown; description: string }>;
  reference_solution: Record<string, string>;
}

export const CODING_BANK: CodingSeedItem[] = [
  {
    slug: 'two-sum',
    title: 'Two Sum',
    category: 'Arrays & Hash Tables',
    difficulty: 'easy',
    tags: ['array', 'hash-table'],
    description: 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`. You may assume that each input has exactly one solution, and you may not use the same element twice.',
    starter_code: {
      python: 'def two_sum(nums: list[int], target: int) -> list[int]:\n    pass\n',
      javascript: 'function twoSum(nums, target) {\n\n}\n',
      typescript: 'function twoSum(nums: number[], target: number): number[] {\n\n}\n',
    },
    entry_point: 'two_sum',
    public_tests: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], description: 'Basic target' },
      { input: [[3, 2, 4], 6], expected: [1, 2], description: 'Unsorted pair' },
    ],
    hidden_tests: [
      { input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], description: 'Negative integers' },
      { input: [[0, 4, 3, 0], 0], expected: [0, 3], description: 'Zero elements' },
    ],
    reference_solution: {
      python: 'def two_sum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return [lookup[diff], i]\n        lookup[num] = i\n    return []',
      typescript: 'function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
    },
  },
  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    category: 'Stacks & Strings',
    difficulty: 'easy',
    tags: ['stack', 'string'],
    description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. Brackets must close in correct order and type.',
    starter_code: {
      python: 'def is_valid(s: str) -> bool:\n    pass\n',
      javascript: 'function isValid(s) {\n\n}\n',
      typescript: 'function isValid(s: string): boolean {\n\n}\n',
    },
    entry_point: 'is_valid',
    public_tests: [
      { input: ['()'], expected: true, description: 'Simple parentheses' },
      { input: ['()[]{}'], expected: true, description: 'Multiple styles' },
      { input: ['(]'], expected: false, description: 'Mismatch' },
    ],
    hidden_tests: [
      { input: ['{[]}'], expected: true, description: 'Nested correctly' },
      { input: ['([)]'], expected: false, description: 'Nested incorrectly' },
    ],
    reference_solution: {
      python: 'def is_valid(s):\n    stack = []\n    mapping = {")": "(", "}": "{", "]": "["}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else "#"\n            if mapping[char] != top: return False\n        else: stack.append(char)\n    return not stack',
      typescript: 'function isValid(s: string): boolean {\n  const stack: string[] = [];\n  const map: Record<string, string> = { ")": "(", "}": "{", "]": "[" };\n  for (const c of s) {\n    if (map[c]) {\n      if (stack.pop() !== map[c]) return false;\n    } else {\n      stack.push(c);\n    }\n  }\n  return stack.length === 0;\n}',
    },
  },
  {
    slug: 'max-subarray',
    title: 'Maximum Subarray Sum',
    category: 'Dynamic Programming & Arrays',
    difficulty: 'medium',
    tags: ['array', 'dynamic-programming'],
    description: 'Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
    starter_code: {
      python: 'def max_sub_array(nums: list[int]) -> int:\n    pass\n',
      javascript: 'function maxSubArray(nums) {\n\n}\n',
      typescript: 'function maxSubArray(nums: number[]): number {\n\n}\n',
    },
    entry_point: 'max_sub_array',
    public_tests: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6, description: 'Mixed array' },
      { input: [[5, 4, -1, 7, 8]], expected: 23, description: 'All positive' },
    ],
    hidden_tests: [
      { input: [[-5, -2, -8, -1]], expected: -1, description: 'All negative' },
      { input: [[100, -50, 200]], expected: 250, description: 'Large jumps' },
    ],
    reference_solution: {
      python: 'def max_sub_array(nums):\n    max_sum = current_sum = nums[0]\n    for x in nums[1:]:\n        current_sum = max(x, current_sum + x)\n        max_sum = max(max_sum, current_sum)\n    return max_sum',
      typescript: 'function maxSubArray(nums: number[]): number {\n  let maxSoFar = nums[0];\n  let currMax = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    currMax = Math.max(nums[i], currMax + nums[i]);\n    maxSoFar = Math.max(maxSoFar, currMax);\n  }\n  return maxSoFar;\n}',
    },
  },
];
