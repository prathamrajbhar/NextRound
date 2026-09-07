export interface AptitudeQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  source: 'ai-generated' | 'fallback';
}
