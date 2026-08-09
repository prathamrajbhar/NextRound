import { generateAiCodingProblem } from '../src/services/ai-coding-generator.service';
import { executeCodingSubmission } from '../src/services/coding-executor.service';

describe('Coding Assessment System - Dynamic Generation & Multi-Language Sandbox', () => {
  it('generates unique DSA problem on each call with random seed', async () => {
    const p1 = await generateAiCodingProblem('Frontend Developer', 'React and TS role', 'easy');
    const p2 = await generateAiCodingProblem('Backend Engineer', 'Distributed systems role', 'hard');

    expect(p1).toHaveProperty('id');
    expect(p1).toHaveProperty('title');
    expect(p1.starterCode).toHaveProperty('python');
    expect(p1.starterCode).toHaveProperty('typescript');
    expect(p1.testCases.length).toBeGreaterThan(0);

    expect(p2).toHaveProperty('id');
    expect(p2).toHaveProperty('title');
    // Ensure ids are unique
    expect(p1.id).not.toEqual(p2.id);
  });

  it('executes Python candidate code cleanly and passes test cases', () => {
    const pythonCode = `
def solution(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
`;
    const testCases = [
      { name: 'Case 1', input: 'nums = [2, 7, 11, 15], target = 9', expected: '[0, 1]' },
      { name: 'Case 2', input: 'nums = [3, 2, 4], target = 6', expected: '[1, 2]' },
    ];

    const result = executeCodingSubmission(pythonCode, 'python', testCases);
    expect(result.passRate).toBe(100);
    expect(result.allPassed).toBe(true);
    expect(result.results[0].status).toBe('passed');
  });

  it('executes JavaScript / TypeScript candidate code with type annotations stripped', () => {
    const tsCode = `
function solution(nums: number[], target: number): number[] {
  const map: Record<number, number> = {};
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (diff in map) {
      return [map[diff], i];
    }
    map[nums[i]] = i;
  }
  return [];
}
`;
    const testCases = [
      { name: 'Case 1', input: 'nums = [2, 7, 11, 15], target = 9', expected: '[0, 1]' },
      { name: 'Case 2', input: 'nums = [3, 2, 4], target = 6', expected: '[1, 2]' },
    ];

    const result = executeCodingSubmission(tsCode, 'typescript', testCases);
    expect(result.passRate).toBe(100);
    expect(result.allPassed).toBe(true);
  });

  it('flags un-implemented stub methods cleanly', () => {
    const stubCode = `
def solution(nums: list[int]) -> int:
    # TODO: Implement solution
    pass
`;
    const testCases = [
      { name: 'Case 1', input: 'nums = [1, 2, 3]', expected: '6' },
    ];

    const result = executeCodingSubmission(stubCode, 'python', testCases);
    expect(result.passRate).toBe(0);
    expect(result.allPassed).toBe(false);
    expect(result.results[0].actual).toContain('Unimplemented Stub');
  });
});
