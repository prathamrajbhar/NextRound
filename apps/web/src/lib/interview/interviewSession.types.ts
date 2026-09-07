export interface UseInterviewSessionProps {
  company: string;
  role: string;
  interviewId: string;
  onComplete: (data: unknown) => void;
}

export interface ProctorTelemetryState {
  faceCount: number | null;
  gazeCentered: boolean | null;
  engagementIndex: number | null;
}
