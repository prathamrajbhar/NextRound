import type { CodingProblem } from './useCodingProblem';

function requiredString(raw: Record<string, unknown>, field: string): string {
  const value = raw[field];
  if (typeof value === 'string' && value.trim()) return value;
  throw new Error(`Coding problem is missing required field: ${field}`);
}

const DIFFICULTIES: CodingProblem['difficulty'][] = ['Easy', 'Medium', 'Hard'];

export function normalizeCodingProblem(raw: Record<string, unknown>): CodingProblem {
  const difficulty = requiredString(raw, 'difficulty');
  const normalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
  if (!DIFFICULTIES.includes(normalizedDifficulty as CodingProblem['difficulty'])) {
    throw new Error(`Coding problem has an unrecognized difficulty: "${difficulty}"`);
  }

  if (!Array.isArray(raw.testCases) || raw.testCases.length === 0) {
    throw new Error('Coding problem is missing required field: testCases');
  }
  const rawTestCases = raw.testCases as Array<Record<string, unknown>>;

  return {
    id: requiredString(raw, 'id'),
    title: requiredString(raw, 'title'),
    difficulty: normalizedDifficulty as CodingProblem['difficulty'],
    category: requiredString(raw, 'category'),
    description: requiredString(raw, 'description'),
    constraints: Array.isArray(raw.constraints) ? (raw.constraints as string[]) : [],
    examples: Array.isArray(raw.examples) ? (raw.examples as CodingProblem['examples']) : [],
    starterCode: {
      python:     (raw.starterCode as Record<string, string>)?.python     || '',
      javascript: (raw.starterCode as Record<string, string>)?.javascript || '',
      typescript: (raw.starterCode as Record<string, string>)?.typescript || '',
      java:       (raw.starterCode as Record<string, string>)?.java       || '',
      cpp:        (raw.starterCode as Record<string, string>)?.cpp        || '',
    },
    testCases: rawTestCases.map((tc, i) => ({
      name:     typeof tc.name     === 'string' ? tc.name     : `Case ${i + 1}`,
      input:    typeof tc.input    === 'string' ? tc.input    :
                tc.input !== undefined           ? JSON.stringify(tc.input) : '',
      expected: typeof tc.expected === 'string' ? tc.expected :
                typeof tc.expectedOutput === 'string' ? tc.expectedOutput :
                tc.expected !== undefined ? JSON.stringify(tc.expected) : '',
      hidden: Boolean(tc.hidden),
    })),
    editorial: typeof raw.editorial === 'string' ? raw.editorial : '',
    expectedComplexity:
      (raw.expectedComplexity as CodingProblem['expectedComplexity']) || null,
  };
}

export function pickCodingEndpoint({
  applicationId,
  sessionId,
  role,
  company,
}: {
  applicationId?: string;
  sessionId?: string;
  role: string;
  company: string;
}): string {
  if (applicationId) return `/applications/${applicationId}/assessment/coding`;
  if (sessionId) return `/mock/sessions/${sessionId}/coding`;
  return `/coding/problem?role=${encodeURIComponent(role)}&company=${encodeURIComponent(company)}`;
}