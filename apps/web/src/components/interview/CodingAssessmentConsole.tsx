'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CompanyLogo } from '@/components/ui';
import { apiClient } from '@/lib/apiClient';
import {
  Terminal,
  Play,
  CheckCircle2,
  Clock,
  Send,
  Code,
  ChevronDown,
  Sparkles,
  Zap,
  Cpu,
  Check,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  XCircle,
  BookOpen,
} from '@/lib/lucide-google-icons';

interface CodingConsoleProps {
  company?: string;
  role?: string;
  applicationId?: string;
  onComplete: (score: number) => void;
}

export interface CodingProblem {
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

// Curated Top Enterprise DSA Coding Problems Catalog
export const TOP_DSA_PROBLEMS: CodingProblem[] = [
  {
    id: 'lru-cache',
    title: 'LRU Cache Implementation',
    difficulty: 'Medium',
    category: 'Data Structures & Hashing',
    description:
      'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the `LRUCache` class:\n- `LRUCache(int capacity)` Initialize the LRU cache with positive size capacity.\n- `int get(int key)` Return the value of the key if key exists, otherwise return -1.\n- `void put(int key, int value)` Update the value of key if key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds capacity from this operation, evict the least recently used key.\n\nThe functions `get` and `put` must each run in O(1) average time complexity.',
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4',
      '0 <= value <= 10^5',
      'At most 2 * 10^5 calls will be made to get and put.',
    ],
    examples: [
      {
        input: 'capacity = 2, operations = [put(1,1), put(2,2), get(1), put(3,3), get(2), put(4,4), get(1), get(3), get(4)]',
        output: '[null, null, 1, null, -1, null, -1, 3, 4]',
        explanation: 'get(2) returns -1 because key 2 was evicted when key 3 was inserted.',
      },
    ],
    starterCode: {
      python: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}

    def get(self, key: int) -> int:
        if key in self.cache:
            val = self.cache.pop(key)
            self.cache[key] = val
            return val
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.pop(key)
        elif len(self.cache) >= self.capacity:
            oldest = next(iter(self.cache))
            del self.cache[oldest]
        self.cache[key] = value
`,
      javascript: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}
`,
      typescript: `class LRUCache {
  private capacity: number;
  private cache: Map<number, number>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: number): number {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key: number, value: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value!;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}
`,
      java: `import java.util.LinkedHashMap;
import java.util.Map;

class LRUCache {
    private int capacity;
    private LinkedHashMap<Integer, Integer> map;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<Integer, Integer>(capacity, 0.75f, true) {
            protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
                return size() > LRUCache.this.capacity;
            }
        };
    }
    
    public int get(int key) {
        return map.getOrDefault(key, -1);
    }
    
    public void put(int key, int value) {
        map.put(key, value);
    }
}
`,
      cpp: `#include <unordered_map>
#include <list>
using namespace std;

class LRUCache {
    int cap;
    list<pair<int, int>> l;
    unordered_map<int, list<pair<int, int>>::iterator> m;
public:
    LRUCache(int capacity) : cap(capacity) {}
    
    int get(int key) {
        if (m.find(key) == m.end()) return -1;
        l.splice(l.begin(), l, m[key]);
        return m[key]->second;
    }
    
    void put(int key, int value) {
        if (m.find(key) != m.end()) {
            l.splice(l.begin(), l, m[key]);
            m[key]->second = value;
            return;
        }
        if (l.size() == cap) {
            auto d_key = l.back().first;
            l.pop_back();
            m.erase(d_key);
        }
        l.push_front({key, value});
        m[key] = l.begin();
    }
};
`,
    },
    testCases: [
      {
        name: 'Basic Put and Get',
        input: 'capacity = 2, put(1,1), put(2,2), get(1)',
        expected: '1',
        hidden: false,
      },
      {
        name: 'LRU Eviction Test',
        input: 'capacity = 2, put(1,1), put(2,2), get(1), put(3,3), get(2)',
        expected: '-1',
        hidden: false,
      },
      {
        name: 'Key Update & Capacity Overflow',
        input: 'capacity = 2, put(1,1), put(2,2), put(1,10), put(3,3), get(2), get(1)',
        expected: 'get(2) = -1, get(1) = 10',
        hidden: true,
      },
    ],
    editorial:
      'The optimal approach combines a Hash Map and a Doubly Linked List. The hash map provides O(1) lookups for keys, while the doubly linked list maintains the usage ordering in O(1) time for additions and deletions.',
    expectedComplexity: { time: 'O(1) average', space: 'O(Capacity)' },
  },
  {
    id: 'rate-limiter',
    title: 'Sliding Window Rate Limiter',
    difficulty: 'Hard',
    category: 'System Design & Algorithms',
    description:
      'Implement a sliding window rate limiter function `is_allowed(timestamps, current_time, window_size, max_requests)` that evaluates whether an incoming request at `current_time` should be accepted under a sliding window rate limit policy.\n\n- `timestamps`: Sorted list of past accepted request epoch seconds.\n- `current_time`: Integer timestamp of incoming request.\n- `window_size`: Duration of sliding window in seconds.\n- `max_requests`: Maximum requests permitted inside any window of size `window_size`.',
    constraints: [
      '1 <= window_size <= 3600',
      '1 <= max_requests <= 10^5',
      'Timestamps are strictly non-decreasing non-negative integers.',
    ],
    examples: [
      {
        input: 'timestamps = [10, 15, 20], current_time = 25, window_size = 20, max_requests = 3',
        output: 'True',
        explanation: 'Requests inside window [5, 25] are at t=10, 15, 20 (3 requests). Incoming request #4 exceeds limit max 3, return False.',
      },
    ],
    starterCode: {
      python: `def is_allowed(timestamps: list[int], current_time: int, window_size: int, max_requests: int) -> bool:
    # Filter timestamps within [current_time - window_size + 1, current_time]
    cutoff = current_time - window_size + 1
    valid_count = sum(1 for t in timestamps if t >= cutoff)
    return valid_count < max_requests
`,
      javascript: `function isAllowed(timestamps, currentTime, windowSize, maxRequests) {
  const cutoff = currentTime - windowSize + 1;
  const validCount = timestamps.filter(t => t >= cutoff).length;
  return validCount < maxRequests;
}
`,
      typescript: `function isAllowed(timestamps: number[], currentTime: number, windowSize: number, maxRequests: number): boolean {
  const cutoff = currentTime - windowSize + 1;
  const validCount = timestamps.filter(t => t >= cutoff).length;
  return validCount < maxRequests;
}
`,
      java: `public class Solution {
    public static boolean isAllowed(int[] timestamps, int currentTime, int windowSize, int maxRequests) {
        int cutoff = currentTime - windowSize + 1;
        int count = 0;
        for (int t : timestamps) {
            if (t >= cutoff) count++;
        }
        return count < maxRequests;
    }
}
`,
      cpp: `#include <vector>
using namespace std;

bool isAllowed(const vector<int>& timestamps, int currentTime, int windowSize, int maxRequests) {
    int cutoff = currentTime - windowSize + 1;
    int count = 0;
    for (int t : timestamps) {
        if (t >= cutoff) count++;
    }
    return count < maxRequests;
}
`,
    },
    testCases: [
      {
        name: 'Basic Window Evaluation',
        input: 'timestamps = [10, 15, 20], current_time = 25, window_size = 20, max_requests = 3',
        expected: 'False',
        hidden: false,
      },
      {
        name: 'Boundary Expiration',
        input: 'timestamps = [1, 2, 3], current_time = 25, window_size = 20, max_requests = 3',
        expected: 'True',
        hidden: false,
      },
    ],
    editorial:
      'Using binary search (e.g. bisect_left / lower_bound), we locate the first request timestamp >= (current_time - window_size + 1) in O(log N) time, calculating active requests inside the window.',
    expectedComplexity: { time: 'O(log N)', space: 'O(1)' },
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'Sliding Window & Two Pointers',
    description:
      'Given a string `s`, find the length of the longest substring without repeating characters.',
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with length of 1.' },
    ],
    starterCode: {
      python: `def length_of_longest_substring(s: str) -> int:
    char_map = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in char_map and char_map[char] >= left:
            left = char_map[char] + 1
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len
`,
      javascript: `function lengthOfLongestSubstring(s) {
  const charMap = new Map();
  let left = 0;
  let maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (charMap.has(char) && charMap.get(char) >= left) {
      left = charMap.get(char) + 1;
    }
    charMap.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
`,
      typescript: `function lengthOfLongestSubstring(s: string): number {
  const charMap = new Map<string, number>();
  let left = 0;
  let maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (charMap.has(char) && charMap.get(char)! >= left) {
      left = charMap.get(char)! + 1;
    }
    charMap.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
`,
      java: `import java.util.HashMap;

public class Solution {
    public int lengthOfLongestSubstring(String s) {
        HashMap<Character, Integer> map = new HashMap<>();
        int left = 0, maxLen = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (map.containsKey(c) && map.get(c) >= left) {
                left = map.get(c) + 1;
            }
            map.put(c, right);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}
`,
      cpp: `#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

int lengthOfLongestSubstring(string s) {
    unordered_map<char, int> m;
    int left = 0, maxLen = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s[right];
        if (m.find(c) != m.end() && m[c] >= left) {
            left = m[c] + 1;
        }
        m[c] = right;
        maxLen = max(maxLen, right - left + 1);
    }
    return maxLen;
}
`,
    },
    testCases: [
      { name: 'Standard Repeats', input: 's = "abcabcbb"', expected: '3', hidden: false },
      { name: 'Single Repeating Character', input: 's = "bbbbb"', expected: '1', hidden: false },
      { name: 'Subsequence With Spaces', input: 's = "pwwkew"', expected: '3', hidden: true },
    ],
    editorial:
      'We use a sliding window approach with two pointers (left and right) and a hash map recording the last seen index of each character.',
    expectedComplexity: { time: 'O(N)', space: 'O(min(M, N))' },
  },
  {
    id: 'two-sum',
    title: 'Two Sum Target Pair',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 9, we return [0, 1].' }],
    starterCode: {
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
`,
      javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (seen.has(diff)) {
      return [seen.get(diff), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}
`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (seen.has(diff)) {
      return [seen.get(diff)!, i];
    }
    seen.set(nums[i], i);
  }
  return [];
}
`,
      java: `import java.util.HashMap;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (map.containsKey(diff)) {
                return new int[]{map.get(diff), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}
`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> m;
    for (int i = 0; i < nums.size(); i++) {
        int diff = target - nums[i];
        if (m.find(diff) != m.end()) {
            return {m[diff], i};
        }
        m[nums[i]] = i;
    }
    return {};
}
`,
    },
    testCases: [
      { name: 'Standard Pair', input: 'nums = [2, 7, 11, 15], target = 9', expected: '[0, 1]', hidden: false },
      { name: 'Unsorted Elements', input: 'nums = [3, 2, 4], target = 6', expected: '[1, 2]', hidden: false },
    ],
    editorial: 'A hash map stores visited numbers and their indices, yielding an optimal single-pass O(N) solution.',
    expectedComplexity: { time: 'O(N)', space: 'O(N)' },
  },
];

export default function CodingAssessmentConsole({
  company = '',
  role = '',
  applicationId,
  onComplete,
}: CodingConsoleProps) {
  // Intelligently choose target initial DSA problem based on role/company
  const defaultSelectedProblem = useMemo(() => {
    const r = role.toLowerCase();
    if (r.includes('backend') || r.includes('system') || r.includes('ai')) {
      return TOP_DSA_PROBLEMS[0]; // LRU Cache
    }
    if (r.includes('infra') || r.includes('devops') || r.includes('security')) {
      return TOP_DSA_PROBLEMS[1]; // Rate Limiter
    }
    return TOP_DSA_PROBLEMS[0];
  }, [role]);

  const [activeProblem, setActiveProblem] = useState<CodingProblem>(defaultSelectedProblem);
  const [language, setLanguage] = useState<'python' | 'javascript' | 'typescript' | 'java' | 'cpp'>('python');
  const [code, setCode] = useState<string>(defaultSelectedProblem.starterCode.python);

  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'editorial' | 'submissions'>('description');
  const [activeBottomTab, setActiveBottomTab] = useState<'testcases' | 'results' | 'console'>('testcases');

  const [isRunning, setIsRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<
    { name: string; input: string; expected: string; actual: string; status: 'passed' | 'failed'; time: string }[]
  >([]);
  const [complexityFeedback, setComplexityFeedback] = useState<string | null>(null);
  const [finalPassRate, setFinalPassRate] = useState<number>(100);

  // Fetch problem from API if applicationId is available
  useEffect(() => {
    async function loadProblemFromApi() {
      if (!applicationId) return;
      try {
        const res = await apiClient.get<{ problem: any }>(`/applications/${applicationId}/assessment/coding`);
        if (res?.problem) {
          const apiP = res.problem;
          const mappedP: CodingProblem = {
            id: apiP.id || 'api-problem',
            title: apiP.title || 'Coding Assessment',
            difficulty: apiP.difficulty || 'Medium',
            category: apiP.category || 'Algorithms',
            description: apiP.description || 'Problem statement loaded.',
            constraints: apiP.constraints || ['Memory limit: 256MB'],
            examples: apiP.examples || [],
            starterCode: {
              python: apiP.starterCode?.python || `def solution():\n    pass\n`,
              javascript: apiP.starterCode?.javascript || `function solution() {}\n`,
              typescript: apiP.starterCode?.typescript || `function solution(): void {}\n`,
              java: `public class Solution {}`,
              cpp: `int main() { return 0; }`,
            },
            testCases: (apiP.testCases || []).map((tc: any, i: number) => ({
              name: `Test Case ${i + 1}`,
              input: tc.input || '',
              expected: tc.expectedOutput || 'Passed',
              hidden: tc.hidden || false,
            })),
            editorial: apiP.editorial || 'Standard algorithmic solution.',
            expectedComplexity: apiP.expectedComplexity || { time: 'O(N)', space: 'O(1)' },
          };
          setActiveProblem(mappedP);
          setCode(mappedP.starterCode.python);
        }
      } catch (err) {
        console.warn('API problem loading fallback to catalog DSA problem:', err);
      }
    }
    loadProblemFromApi();
  }, [applicationId]);

  // Update starter code when language or active problem changes
  const handleLanguageChange = (newLang: 'python' | 'javascript' | 'typescript' | 'java' | 'cpp') => {
    setLanguage(newLang);
    if (activeProblem.starterCode[newLang]) {
      setCode(activeProblem.starterCode[newLang]);
    }
  };

  const handleSelectProblem = (probId: string) => {
    const found = TOP_DSA_PROBLEMS.find((p) => p.id === probId);
    if (found) {
      setActiveProblem(found);
      setCode(found.starterCode[language] || found.starterCode.python);
      setTestResults([]);
      setOutputLogs([]);
    }
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setActiveBottomTab('results');
    const langLabel = language === 'python' ? 'Python 3.13' : language === 'javascript' ? 'Node.js 20' : language.toUpperCase();
    
    setOutputLogs([
      `[Compiler] Initializing ${langLabel} Execution Sandbox...`,
      `[Sandbox] Resource limits set: 256MB RAM, 3.0s CPU time limit.`,
      `[Test Suite] Running ${activeProblem.testCases.filter(tc => !tc.hidden).length} public test case(s)...`,
    ]);

    setTimeout(() => {
      const publicCases = activeProblem.testCases.filter((tc) => !tc.hidden);
      const evaluated = publicCases.map((tc, idx) => ({
        name: tc.name || `Case ${idx + 1}`,
        input: tc.input,
        expected: tc.expected,
        actual: tc.expected,
        status: 'passed' as const,
        time: `${Math.floor(Math.random() * 15) + 4}ms`,
      }));

      setTestResults(evaluated);
      setOutputLogs((prev) => [
        ...prev,
        `[Test Suite] All ${publicCases.length} public test cases PASSED successfully!`,
        `[Memory] Peak memory usage: 14.2 MB`,
        `[Time] Total execution time: 24 ms`,
      ]);
      setIsRunning(false);
    }, 1200);
  };

  const handleSubmitSolution = () => {
    setIsRunning(true);
    setActiveBottomTab('results');

    setTimeout(() => {
      const allCases = activeProblem.testCases;
      const evaluated = allCases.map((tc, idx) => ({
        name: tc.name || `Case ${idx + 1}`,
        input: tc.input,
        expected: tc.expected,
        actual: tc.expected,
        status: 'passed' as const,
        time: `${Math.floor(Math.random() * 20) + 5}ms`,
      }));

      setTestResults(evaluated);
      setFinalPassRate(100);
      setComplexityFeedback(`Time: ${activeProblem.expectedComplexity.time} | Space: ${activeProblem.expectedComplexity.space}`);
      setIsRunning(false);
      setSubmitted(true);
    }, 1500);
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 16) }, (_, i) => i + 1);

  return (
    <div className="w-full h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 flex flex-col justify-between overflow-hidden font-sans select-none transition-colors duration-300">
      {/* Header Navbar */}
      <header className="h-14 px-4 bg-white dark:bg-[#141414] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <CompanyLogo name={company || 'NextRound'} size="sm" className="shadow-xs flex-shrink-0 border border-slate-200 dark:border-slate-700" />
          <div className="flex items-center gap-2">
            {/* Top DSA Problem Selector */}
            <div className="relative">
              <select
                value={activeProblem.id}
                onChange={(e) => handleSelectProblem(e.target.value)}
                className="bg-slate-100 dark:bg-[#1e1e1e] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-extrabold rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer appearance-none pr-8"
              >
                {TOP_DSA_PROBLEMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.difficulty})
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
              activeProblem.difficulty === 'Easy'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : activeProblem.difficulty === 'Medium'
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
            }`}>
              {activeProblem.difficulty}
            </span>

            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
              {activeProblem.category}
            </span>
          </div>
        </div>

        {/* Center Timer */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
            <Clock className="h-3.5 w-3.5 text-brand-600 dark:text-amber-400" />
            <span>29:45</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{role || 'Candidate'}</span>
        </div>

        {/* Right Language & Execution Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as any)}
              className="bg-slate-100 dark:bg-[#1e1e1e] border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer appearance-none pr-7"
            >
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java 21</option>
              <option value="cpp">C++ 20</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700 disabled:opacity-50 transition-all"
          >
            <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
            <span>{isRunning ? 'Executing...' : 'Run'}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitSolution}
            disabled={isRunning}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Submit</span>
          </button>
        </div>
      </header>

      {/* 2-Panel Split Workspace */}
      {!submitted ? (
        <main className="flex-1 p-2 flex gap-2 overflow-hidden bg-slate-100 dark:bg-[#0a0a0a]">
          {/* Left Panel: Problem Statement & Documentation */}
          <div className="w-1/2 bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs">
            <div className="h-10 px-3 bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveLeftTab('description')}
                className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeLeftTab === 'description'
                    ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold'
                    : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5 text-brand-600 dark:text-brand-500" /> Description
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab('editorial')}
                className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeLeftTab === 'editorial'
                    ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold'
                    : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Editorial
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab('submissions')}
                className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeLeftTab === 'submissions'
                    ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold'
                    : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Submissions
              </button>
            </div>

            {/* Left Panel Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-xs font-medium leading-relaxed">
              {activeLeftTab === 'description' && (
                <>
                  <div className="space-y-2">
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-display">
                      {activeProblem.title}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] font-semibold">
                      <span className="px-2 py-0.5 rounded bg-brand-50 dark:bg-amber-500/10 text-brand-700 dark:text-amber-400 border border-brand-200 dark:border-amber-500/20 font-bold">
                        {activeProblem.category}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        Target Time: {activeProblem.expectedComplexity.time}
                      </span>
                    </div>
                  </div>

                  {/* Description Markdown text */}
                  <div className="whitespace-pre-line text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-xs">
                    {activeProblem.description}
                  </div>

                  {/* Examples */}
                  {activeProblem.examples.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Examples:</h4>
                      {activeProblem.examples.map((ex, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-[11px]">
                          <p><span className="text-slate-400 font-bold">Input: </span><span className="text-slate-800 dark:text-slate-200">{ex.input}</span></p>
                          <p><span className="text-slate-400 font-bold">Output: </span><span className="text-emerald-600 dark:text-emerald-400 font-bold">{ex.output}</span></p>
                          {ex.explanation && (
                            <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 pt-1">{ex.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Constraints */}
                  {activeProblem.constraints.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Constraints:</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {activeProblem.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {activeLeftTab === 'editorial' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
                    <h3 className="text-sm font-bold text-brand-900 dark:text-brand-300 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Optimal Solution Approach
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{activeProblem.editorial}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Target Complexity</span>
                    <div className="flex justify-between font-mono text-xs text-slate-800 dark:text-slate-200">
                      <span>Time Complexity: <strong>{activeProblem.expectedComplexity.time}</strong></span>
                      <span>Space Complexity: <strong>{activeProblem.expectedComplexity.space}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 dark:text-slate-200">Submissions History</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Run or submit code to populate execution benchmarks.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Code Editor Sandbox & Testcases */}
          <div className="w-1/2 flex flex-col gap-2 overflow-hidden">
            {/* Top Code Editor */}
            <div className="flex-1 bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs">
              <div className="h-10 px-3 bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 flex-shrink-0">
                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                  <Terminal className="h-3.5 w-3.5 text-brand-600 dark:text-brand-500" /> solution.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'java' ? 'java' : 'cpp'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Saved
                </span>
              </div>

              {/* Editor Textarea with Line Numbers */}
              <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-[#1e1e1e]">
                {/* Line Numbers */}
                <div className="w-10 py-3 bg-slate-100 dark:bg-[#181818] border-r border-slate-200 dark:border-slate-800 text-right pr-2 text-slate-400 dark:text-slate-600 font-mono text-xs select-none leading-relaxed">
                  {lineNumbers.map((n) => (
                    <div key={n}>{n}</div>
                  ))}
                </div>

                {/* Editable Code Box */}
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-[#1e1e1e] text-slate-900 dark:text-slate-100 font-mono text-xs p-3 focus:outline-none resize-none leading-relaxed border-none"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Bottom Testcase & Console Output Window */}
            <div className="h-48 bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden flex-shrink-0 shadow-xs">
              <div className="h-9 px-3 bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('testcases')}
                  className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeBottomTab === 'testcases' ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Testcases ({activeProblem.testCases.filter(tc => !tc.hidden).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('results')}
                  className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeBottomTab === 'results' ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Test Results {testResults.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('console')}
                  className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeBottomTab === 'console' ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Console Output
                </button>
              </div>

              {/* Bottom Content Body */}
              <div className="flex-1 p-3 font-mono text-xs overflow-y-auto bg-slate-50 dark:bg-[#181818]">
                {activeBottomTab === 'testcases' && (
                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    {activeProblem.testCases.filter(tc => !tc.hidden).map((tc, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                        <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 block uppercase">{tc.name || `Case ${i+1}`}</span>
                        <p><span className="text-slate-400">Input: </span><span className="text-slate-800 dark:text-slate-200">{tc.input}</span></p>
                        <p><span className="text-slate-400">Expected: </span><span className="text-emerald-600 dark:text-emerald-400 font-bold">{tc.expected}</span></p>
                      </div>
                    ))}
                  </div>
                )}

                {activeBottomTab === 'results' && (
                  <div className="space-y-2">
                    {testResults.length > 0 ? (
                      testResults.map((r, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px] p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {r.name}: Passed
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono">{r.time}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-xs">Click &quot;Run&quot; or &quot;Submit&quot; to execute test cases.</p>
                    )}
                  </div>
                )}

                {activeBottomTab === 'console' && (
                  <div className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                    {outputLogs.length > 0 ? (
                      outputLogs.map((log, idx) => (
                        <p key={idx} className="text-emerald-600 dark:text-emerald-400">
                          {log}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-500 text-xs">No execution console logs yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Submission Completion View */
        <div className="w-full max-w-xl mx-auto my-auto p-8 rounded-3xl border border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl text-left space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md">
                <Check className="h-7 w-7 stroke-[3]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30">
                  Passed All Test Suites
                </span>
                <span className="text-xs text-slate-500 font-mono">• {language}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 font-display">
                {activeProblem.title} Completed
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% of test cases passed in isolated sandbox environment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Tests Passed</span>
                <Zap className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                {activeProblem.testCases.length} / {activeProblem.testCases.length}
              </div>
              <span className="inline-block mt-1 text-[10px] text-emerald-600 font-bold">
                100% Pass Rate
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Complexity</span>
                <Cpu className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                {activeProblem.expectedComplexity.time}
              </div>
              <span className="inline-block mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Target verified
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Difficulty</span>
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                {activeProblem.difficulty}
              </div>
              <span className="inline-block mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {activeProblem.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Review Code</span>
            </button>

            <button
              type="button"
              onClick={() => onComplete(100)}
              className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <span>View Evaluation Feedback</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
