export const SUGGESTED_COMPANIES = ['Google', 'Stripe', 'Vercel', 'Netflix', 'Razorpay', 'Swiggy'];
export const SUGGESTED_ROLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Engineer',
  'Principal Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'iOS Developer',
  'Android Developer',
  'React Native Developer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Platform Engineer',
  'Cloud Engineer',
  'Security Engineer',
  'QA Engineer',
  'Test Automation Engineer',
  'Embedded Systems Engineer',
  'Blockchain Developer',

  'Data Scientist',
  'Data Engineer',
  'Data Analyst',
  'Machine Learning Engineer',
  'AI Engineer',
  'MLOps Engineer',
  'Business Intelligence Analyst',
  'Research Scientist',

  'Product Manager',
  'Senior Product Manager',
  'Technical Product Manager',
  'Product Designer',
  'UX Designer',
  'UI Designer',
  'UX Researcher',

  'Engineering Manager',
  'Director of Engineering',
  'VP of Engineering',
  'Chief Technology Officer',
  'Head of Product',

  'Solutions Architect',
  'Technical Program Manager',
  'Scrum Master',
  'Business Analyst',
  'Developer Advocate',
  'Technical Recruiter',
  'Customer Success Engineer',
];

export const getRubricWeights = (roleTitle: string) => {
  const title = roleTitle.toLowerCase();
  if (title.includes('product') || title.includes('pm')) {
    return { technical: 25, communication: 45, culture: 30 };
  }
  if (title.includes('frontend') || title.includes('react') || title.includes('developer') || title.includes('engineer')) {
    return { technical: 50, communication: 25, culture: 25 };
  }
  return { technical: 40, communication: 30, culture: 30 };
};
