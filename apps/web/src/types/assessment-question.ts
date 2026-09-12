export type AssessmentDifficulty = 'easy' | 'intermediate' | 'advanced';

export interface AssessmentQuestion {
  id: string;
  difficulty: AssessmentDifficulty;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}
