export interface FeedbackData {
  id?: string;
  targetCompany?: string;
  targetRole?: string;
  difficulty?: string;
  overallScore?: number;
  detailedBreakdown?: { category: string; score: number; feedback: string }[];
  keyStrengths?: string[];
  areasToImprove?: string[];
  metrics?: Record<string, number>;
  telemetry?: { gazeFocusPercent?: number; speechWpm?: number; verified?: boolean };
  transcriptHighlights?: { speaker: string; timestamp: string; text: string; note: string }[];
}

export interface QaTranscriptItem {
  question: string;
  answer: string;
  feedback: string;
}
