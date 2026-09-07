export interface Job {
  id: string;
  orgId: string;
  orgName: string;
  orgLogo: string;
  title: string;
  description: string;
  rubric: {
    technical: number;
    communication: number;
    problemSolving: number;
    experience: number;
  };
  thresholds: {
    minScore: number;
    autoOffer: boolean;
  };
  status: 'active' | 'published' | 'draft' | 'closed' | 'paused' | 'deleted';
  location: string;
  department?: string;
  salary: string;
  experienceLevel: string;
  postedDate: string;
  applicantsCount: number;
  skills?: string[];
  stages?: ('screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision')[];
  assessmentConfig?: {
    mcqCount: number;
    codingProblemId: string;
    passingScore: number;
    mcqDistribution?: Record<string, number>;
  };
}
