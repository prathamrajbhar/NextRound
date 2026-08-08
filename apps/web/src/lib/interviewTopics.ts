export interface Topic {
  topic: string;
  question: string;
  followUp: string;
  keywords: string[];
}

export const getTopicsForRoleAndCompany = (role: string, company: string): Topic[] => {
  const cleanCompany = company.trim() || 'the organization';
  const cleanRole = role.trim() || 'Software Engineer';

  return [
    {
      topic: `${cleanRole} System Architecture`,
      question: `How would you design and structure the core workflow for a high-concurrency ${cleanRole} feature at ${cleanCompany}?`,
      followUp: `That is clear. How do you handle edge-case failures, data persistence, and performance bottlenecks under sudden traffic spikes?`,
      keywords: ['architecture', 'system', 'scale', 'performance', 'resilience', 'bottleneck'],
    },
    {
      topic: `Technical Tradeoffs & Optimization`,
      question: `Describe a complex technical challenge you solved in a ${cleanRole} position and how you evaluated the tradeoffs.`,
      followUp: `Understood. What specific metrics or telemetry did you use to verify that your technical solution achieved the desired performance goals?`,
      keywords: ['tradeoffs', 'optimization', 'metrics', 'telemetry', 'execution', 'quality'],
    },
    {
      topic: `Cross-Functional Leadership at ${cleanCompany}`,
      question: `How do you handle technical disagreements or scope changes when collaborating with product and design teams at ${cleanCompany}?`,
      followUp: `Great perspective. How do you balance rapid feature delivery velocity against long-term engineering maintenance and code quality?`,
      keywords: ['collaboration', 'leadership', 'velocity', 'quality', 'communication', 'ownership'],
    },
  ];
};
