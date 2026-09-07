export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string[];
  starterCode: {
    javascript: string;
    typescript: string;
    python: string;
    java: string;
    cpp: string;
  };
  testCases: {
    id: string;
    input: string;
    expectedOutput: string;
    description: string;
  }[];
}

export interface AssessmentResult {
  id: string;
  applicationId: string;
  candidateName: string;
  assessmentName: string;
  category: 'aptitude' | 'psychometric';
  status: 'not_started' | 'in_progress' | 'completed';
  completedDate?: string;
  durationMinutes: number;
  overallScore?: number;
  percentile?: number;
  sectionScores?: { section: string; score: number; benchmark: number }[];
  traits?: { trait: string; score: number; description: string }[];
}

export interface CodingTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  passed: boolean;
}
