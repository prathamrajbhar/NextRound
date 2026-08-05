import { mockJobs } from './jobs';
import { MOCK_CANDIDATES, MockCandidateProfile } from './candidates';
import { MOCK_SESSIONS_FEEDBACK, MockFeedbackData } from './mockSessions';
import { MOCK_PREP_RESOURCES, MockPrepResource } from './prep';
import { MOCK_HR_ANALYTICS, MockHRAnalytics } from './analytics';
import { MOCK_ORGANIZATION_SETTINGS, MockOrganizationSettings } from './organization';
import { mockApplications } from './applications';
import { mockApplicationsPart2 } from './applicationsPart2';
import { Job, Application } from './types';

export const allMockApplications: Application[] = [...mockApplications, ...mockApplicationsPart2];

// Job Lookups & Helpers
export function getStoredJobs(): Job[] {
  if (typeof window === 'undefined') {
    return mockJobs.map(job => {
      const j = { ...job };
      if (!j.stages) {
        j.stages = ['screening', 'assessment', 'voice_screen', 'hr_round', 'decision'];
      }
      if (!j.assessmentConfig) {
        j.assessmentConfig = {
          mcqCount: 5,
          codingProblemId: 'virtualized-list',
          passingScore: 80
        };
      }
      return j;
    });
  }

  const custom = localStorage.getItem('custom_jobs');
  const customList: Job[] = custom ? JSON.parse(custom) : [];

  const merged = [...mockJobs];
  customList.forEach(cj => {
    const idx = merged.findIndex(mj => mj.id === cj.id);
    if (idx !== -1) {
      merged[idx] = cj;
    } else {
      merged.push(cj);
    }
  });

  return merged.map(job => {
    const j = { ...job };
    if (!j.stages) {
      j.stages = ['screening', 'assessment', 'voice_screen', 'hr_round', 'decision'];
    }
    if (!j.assessmentConfig) {
      j.assessmentConfig = {
        mcqCount: 5,
        codingProblemId: 'virtualized-list',
        passingScore: 80
      };
    }
    return j;
  });
}

export function saveStoredJob(job: Job) {
  if (typeof window === 'undefined') return;
  const custom = localStorage.getItem('custom_jobs');
  const customList: Job[] = custom ? JSON.parse(custom) : [];
  const idx = customList.findIndex(cj => cj.id === job.id);
  if (idx !== -1) {
    customList[idx] = job;
  } else {
    customList.push(job);
  }
  localStorage.setItem('custom_jobs', JSON.stringify(customList));
}

export function getJobById(id: string): Job | undefined {
  const jobs = getStoredJobs();
  return jobs.find(job => job.id === id);
}

export function searchJobs(query?: string, department?: string): Job[] {
  let jobs = getStoredJobs();
  if (department && department.toLowerCase() !== 'all') {
    jobs = jobs.filter(j => j.department?.toLowerCase() === department.toLowerCase());
  }
  if (query) {
    const q = query.toLowerCase();
    jobs = jobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q) ||
      j.orgName.toLowerCase().includes(q)
    );
  }
  return jobs;
}

// Candidate Lookups
export function getCandidateById(id: string): MockCandidateProfile | undefined {
  return MOCK_CANDIDATES.find(c => c.id === id);
}

export function getCandidatesByJobId(jobId: string): MockCandidateProfile[] {
  return MOCK_CANDIDATES.filter(c => c.appliedJobId === jobId);
}

// Application Lookups
export function getApplicationById(id: string): Application | undefined {
  return allMockApplications.find(app => app.id === id);
}

export function getCandidateApplications(candidateEmailOrId?: string): Application[] {
  if (!candidateEmailOrId) return allMockApplications;
  const query = candidateEmailOrId.toLowerCase();
  return allMockApplications.filter(app =>
    app.candidateEmail.toLowerCase() === query ||
    app.id.toLowerCase() === query
  );
}

// Mock Session Feedback Lookup
export function getMockSessionFeedback(sessionId: string): MockFeedbackData | undefined {
  return MOCK_SESSIONS_FEEDBACK[sessionId] || MOCK_SESSIONS_FEEDBACK['mock-session-1'];
}

// Prep Resource Lookups
export function getPrepResourceById(id: string): MockPrepResource | undefined {
  return MOCK_PREP_RESOURCES.find(r => r.id === id);
}

// HR Analytics & Org Settings
export function getHRAnalytics(): MockHRAnalytics {
  return MOCK_HR_ANALYTICS;
}

export function getOrganizationSettings(): MockOrganizationSettings {
  return MOCK_ORGANIZATION_SETTINGS;
}
