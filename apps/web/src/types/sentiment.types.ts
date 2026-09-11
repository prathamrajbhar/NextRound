export interface CandidateSentimentProfile {
  id: string;
  candidateName: string;
  role: string;
  avatar: string;
  interviewDate: string;
  hasAudioAnalysis: boolean;
  audioUrl: string | null;
  durationMinutes: number | null;
  overallTone: string | null;
  overallStressScore: number | null;
  confidenceRating: number | null;
  speechClarityScore: number | null;
  avgPauseDurationSec: number | null;
  biomarkers: {
    audioTone: {
      steadyPercent: number;
      tremorPercent: number;
      status: 'Steady & Calm' | 'Mild Anxiety' | 'Highly Stressed';
    };
    speechPace: {
      wpm: number;
      idealRange: string;
      status: 'Optimal' | 'Rushed' | 'Hesitant';
    };
    pitchVariation: {
      hzStdDev: number;
      status: 'Dynamic & Natural' | 'Monotone' | 'High Pitch Spikes';
    };
    pausePatterns: {
      pausesPerMin: number;
      longPauseCount: number;
      status: 'Natural Cadence' | 'Frequent Pauses' | 'Blocking Stalls';
    };
  } | null;
  journeyGraph: {
    timeLabel: string;
    minute: number;
    confidence: number;
    stress: number;
    hesitation: number;
    emotionLabel: 'Confident' | 'Neutral' | 'Hesitant' | 'Stressed';
  }[];
}
