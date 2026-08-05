import { Offer, ReferenceCheck } from './extendedTypes';
import { Notification } from './types';

export const mockOffers: Offer[] = [
  {
    id: 'offer-1',
    applicationId: 'app-501',
    candidateName: 'Ananya Iyer',
    candidateAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    jobId: 'job-101',
    jobTitle: 'Senior Frontend Engineer — Consumer Platform',
    orgName: 'Swiggy',
    status: 'negotiating',
    baseSalary: '₹34L',
    bonus: '₹4L annual performance bonus',
    equity: '0.02% (4yr vest, 1yr cliff)',
    joiningDate: '2026-08-15',
    expiryDate: '2026-07-20',
    benefits: ['Health insurance for family', 'Meal credits', 'WFH stipend ₹15,000/mo'],
    negotiationHistory: [
      { id: 'neg-1', author: 'hr', message: 'We are excited to extend an offer of ₹34L base + ₹4L bonus.', timestamp: '2026-07-05 11:00', proposedSalary: '₹34L' }
    ],
    letterUrl: '/mock-offer-letter.pdf'
  },
  {
    id: 'offer-2',
    applicationId: 'app-505',
    candidateName: 'Aarav Sharma',
    candidateAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    jobId: 'job-102',
    jobTitle: 'Product Manager — Payments Flow',
    orgName: 'Razorpay',
    status: 'accepted',
    baseSalary: '₹27L',
    bonus: '₹3L annual',
    equity: '0.015% (4yr vest)',
    joiningDate: '2026-08-01',
    expiryDate: '2026-07-15',
    benefits: ['Health insurance', 'ESOP buyback program'],
    negotiationHistory: [],
    letterUrl: '/mock-offer-letter.pdf'
  }
];

export const mockReferences: ReferenceCheck[] = [
  {
    id: 'ref-1',
    applicationId: 'app-501',
    candidateName: 'Ananya Iyer',
    refereeName: 'Karan Mehta',
    refereeTitle: 'Engineering Manager',
    refereeRelationship: 'Direct manager at previous company (2 years)',
    status: 'completed',
    requestedDate: '2026-07-03',
    completedDate: '2026-07-05',
    ratings: [
      { category: 'Technical ability', score: 92 },
      { category: 'Communication', score: 88 }
    ],
    summary: 'Ananya was one of the strongest frontend engineers on my team.',
    wouldRehire: true
  }
];

export const mockNotifications: Notification[] = [
  { id: 'notif-1', type: 'pipeline', text: 'Screening Agent shortlisted 4 candidates for Senior Frontend Engineer.', time: '2 mins ago', link: '/hr/jobs/job-101/pipeline', read: false },
  { id: 'notif-2', type: 'decision', text: 'Decision Agent held Vikram Malhotra for review (composite: 74%).', time: '10 mins ago', link: '/hr/candidates/app-502', read: false },
  { id: 'notif-3', type: 'interview', text: 'Interviewer Agent completed interview replay stream for Ananya Iyer.', time: '1 hour ago', link: '/hr/candidates/app-501/interview', read: false },
  { id: 'notif-4', type: 'offer', text: 'Offer auto-dispatched to Rohan Deshmukh for Backend Engineer.', time: '3 hours ago', link: '/hr/candidates/app-503', read: true }
];

export const mockAgentLogs = [
  { id: 'log-1', agentName: 'Sourcing Agent', action: 'Scraped candidate profile from candidate pool', target: 'Ananya Iyer', status: 'success', timestamp: '2026-07-02 14:22:10' },
  { id: 'log-2', agentName: 'Screening Agent', action: 'Parsed resume and extracted skills vector', target: 'Ananya Iyer', status: 'success', timestamp: '2026-07-02 14:22:30' },
  { id: 'log-3', agentName: 'Screening Agent', action: 'Calculated rubric match score (89%)', target: 'Ananya Iyer', status: 'success', timestamp: '2026-07-02 14:23:05' }
];

export const mockSystemHealth = {
  activeOrgs: 35,
  activeCandidates: 1850,
  activeJobs: 56,
  interviewsCompletedToday: 24,
  failedJobs: 0,
  queueDepth: { sourcing: 1, screening: 0, interviewing: 2, evaluating: 0 },
  apiErrorRate: '0.02%'
};
