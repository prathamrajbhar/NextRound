export interface OfferNegotiationMessage {
  id: string;
  author: 'candidate' | 'hr';
  message: string;
  timestamp: string;
  proposedSalary?: string;
}

export interface Offer {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateAvatar: string;
  jobId: string;
  jobTitle: string;
  orgName: string;
  status: 'draft' | 'sent' | 'negotiating' | 'accepted' | 'declined' | 'expired';
  baseSalary: string;
  bonus: string;
  equity: string;
  joiningDate: string;
  expiryDate: string;
  benefits: string[];
  negotiationHistory: OfferNegotiationMessage[];
  letterUrl: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  category: 'paperwork' | 'equipment' | 'access' | 'training' | 'social';
  owner: 'HR' | 'IT' | 'Manager' | 'New Hire';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
}

export interface OnboardingRecord {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateAvatar: string;
  jobTitle: string;
  orgName: string;
  startDate: string;
  buddyName: string | null;
  managerName: string | null;
  progressPercent: number;
  tasks: OnboardingTask[];
}
