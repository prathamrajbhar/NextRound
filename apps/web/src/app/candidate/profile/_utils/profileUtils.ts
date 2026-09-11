export const PRESET_SKILLS = [
  'React',
  'TypeScript',
  'Next.js',
  'Node.js',
  'Python',
  'PostgreSQL',
  'Tailwind CSS',
  'Docker',
  'AWS',
  'GraphQL',
  'REST API',
];

export const PRESET_ROLES = [
  'Full Stack Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'DevOps Specialist',
  'AI / ML Engineer',
];

export const DEFAULT_AVATAR = '/avatar-boy.jpg';

export function parseExpectedSalary(value: string): number | null {
  const parsed = Number(value.replace(/[^0-9]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function formatExpectedSalary(value: number | null | undefined): string {
  if (value == null || value <= 0) return '';
  return `₹${value.toLocaleString()} / yr`;
}

export function convertNumberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const doubleDigits = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tensMultiple = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const getWord = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += tensMultiple[Math.floor(n / 10)] + ' ' + singleDigits[n % 10];
    } else if (n > 9) {
      str += doubleDigits[n - 10];
    } else if (n > 0) {
      str += singleDigits[n];
    }
    return str.trim();
  };

  let result = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore > 0) {
    result += getWord(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += getWord(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += getWord(thousand) + ' Thousand ';
  }
  if (num > 0) {
    result += getWord(num) + ' ';
  }

  return result.trim() + ' Rupees Only';
}

export interface ParsedProfilePayload {
  fullName?: string;
  headline?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  targetRoles?: string[];
  yearsOfExperience?: number;
  expectedSalary?: number;
  bio?: string;
  proudProject?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export function calculateReadinessScore(params: {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  skills: string[];
  hasResume: boolean;
}): number {
  let score = 20;
  if (params.name.trim()) score += 10;
  if (params.email.trim()) score += 10;
  if (params.phone.trim()) score += 10;
  if (params.location.trim()) score += 10;
  if (params.headline.trim()) score += 10;
  if (params.linkedinUrl.trim() || params.githubUrl.trim() || params.portfolioUrl.trim()) score += 10;
  if (params.skills.length >= 3) score += 10;
  if (params.hasResume) score += 10;
  return Math.min(100, score);
}
