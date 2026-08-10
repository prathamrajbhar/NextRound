/* eslint-disable no-console */
import { executeInSandbox } from './services/sandbox-executor.service';

async function run(label: string, opts: Parameters<typeof executeInSandbox>[0]) {
  const started = Date.now();
  const out = await executeInSandbox(opts);
  console.log(`\n=== ${label} (${Date.now() - started}ms) ===`);
  console.log('status:', out.status, '| passRate:', out.passRate, '| mem:', out.memoryKb);
  out.logs.forEach((l) => console.log('  log:', l));
  out.results.forEach((r) => console.log('  result:', r.name, r.status, 'actual=', JSON.stringify(r.actual), 'err=', r.error || ''));
}

async function main() {
  // sum of FIRST k elements: [1,2,3] k=2 -> 3; [4,5] k=1 -> 4; [10,20] k=5 -> 30
  const baseTests = [
    { name: 'Case 1', args: [[1, 2, 3], 2], expected: 3 },
    { name: 'Case 2', args: [[4, 5], 1], expected: 4 },
    { name: 'Case 3 (hidden)', args: [[10, 20], 5], expected: 30 },
  ];

  await run('python correct', {
    language: 'python',
    entryPoint: 'solution',
    code: 'def solution(nums, k):\n    return sum(nums[:k])\n',
    testCases: baseTests,
  });

  await run('python wrong answer', {
    language: 'python',
    entryPoint: 'solution',
    code: 'def solution(nums, k):\n    return sum(nums)\n',
    testCases: baseTests,
  });

  await run('python infinite loop -> timeout', {
    language: 'python',
    entryPoint: 'solution',
    code: 'def solution(nums, k):\n    while True:\n        pass\n',
    testCases: baseTests,
  });

  await run('python tries os.environ', {
    language: 'python',
    entryPoint: 'solution',
    code: 'import os\ndef solution(nums, k):\n    return os.environ.get("DATABASE_URL")\n',
    testCases: baseTests,
  });

  await run('python tries network import', {
    language: 'python',
    entryPoint: 'solution',
    code: 'import socket\ndef solution(nums, k):\n    socket.socket()\n    return 0\n',
    testCases: baseTests,
  });

  await run('python compile error', {
    language: 'python',
    entryPoint: 'solution',
    code: 'def solution(nums, k):\n    return \n    x = = 1\n',
    testCases: baseTests,
  });

  await run('node correct', {
    language: 'javascript',
    entryPoint: 'solution',
    code: 'function solution(nums, k) { return nums.slice(0, k).reduce((a, b) => a + b, 0); }',
    testCases: baseTests,
  });

  await run('node tries require child_process', {
    language: 'javascript',
    entryPoint: 'solution',
    code: 'const cp = require("child_process"); function solution(nums, k) { return 1; }',
    testCases: baseTests,
  });

  await run('typescript correct (type annotations)', {
    language: 'typescript',
    entryPoint: 'solution',
    code: 'function solution(nums: number[], k: number): number { return nums.slice(0, k).reduce((a, b) => a + b, 0); }',
    testCases: baseTests,
  });

  const cppTests = [
    { name: 'Case 1', args: [[1, 2, 3], 2], expected: 3 },
    { name: 'Case 2', args: [[4, 5], 1], expected: 4 },
  ];
  await run('cpp correct', {
    language: 'cpp',
    entryPoint: 'solution',
    code: `class Solution {
public:
    int solution(std::vector<int>& nums, int k) {
        int sum = 0;
        for (int i = 0; i < k && i < (int)nums.size(); i++) sum += nums[i];
        return sum;
    }
};`,
    testCases: cppTests,
  });

  await run('cpp wrong answer', {
    language: 'cpp',
    entryPoint: 'solution',
    code: `class Solution {
public:
    int solution(std::vector<int>& nums, int k) { return 0; }
};`,
    testCases: cppTests,
  });

  await run('cpp compile error', {
    language: 'cpp',
    entryPoint: 'solution',
    code: 'class Solution { public: int solution( } ;',
    testCases: cppTests,
  });

  await run('java correct', {
    language: 'java',
    entryPoint: 'solution',
    code: `class Solution {
    public static int solution(int[] nums, int k) {
        int sum = 0;
        for (int i = 0; i < k && i < nums.length; i++) sum += nums[i];
        return sum;
    }
}`,
    testCases: cppTests,
  });

  await run('java wrong answer', {
    language: 'java',
    entryPoint: 'solution',
    code: `class Solution {
    public static int solution(int[] nums, int k) { return 0; }
}`,
    testCases: cppTests,
  });

  await run('java compile error', {
    language: 'java',
    entryPoint: 'solution',
    code: 'class Solution { public static int solution( }',
    testCases: cppTests,
  });

  await run('string return (python)', {
    language: 'python',
    entryPoint: 'solution',
    code: 'def solution(nums, k):\n    return "hello"\n',
    testCases: [{ name: 'S1', args: [[1], 1], expected: 'hello' }],
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
