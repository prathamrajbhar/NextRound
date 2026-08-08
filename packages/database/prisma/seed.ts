/**
 * NextRound / HireOS — Realistic enterprise seed dataset.
 *
 * Generates a production-quality demo dataset:
 *   - 10 organizations + ~32 HR/recruiter users
 *   - 30 jobs across 6 statuses
 *   - 150 candidate profiles
 *   - 800 applications through a realistic hiring funnel
 *   - Full supporting data: interviews, assessments, coding submissions,
 *     evaluations, offers, notifications, talent bookmarks, mock sessions,
 *     prep content, and agent logs.
 *
 * Seeded RNG (mulberry32) → every run produces identical data.
 * All accounts use the password: Password123!
 *
 * Run: npx prisma db seed  (from packages/database)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/* ============================================================
 * 1. CONFIG
 * ============================================================ */
const PASSWORD = 'Password123!';
const SEED_KEY = 20260808;
const N_CANDIDATES = 150;
const N_APPLICATIONS = 800;

/* ============================================================
 * 2. SEEDED RNG HELPERS
 * ============================================================ */
type Rng = () => number;

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng: Rng = mulberry32(SEED_KEY);

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number): number {
  return rng() * (max - min) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function pickN<T>(arr: readonly T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  const count = Math.min(n, pool.length);
  while (out.length < count) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}
function chance(p: number): boolean {
  return rng() < p;
}
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
/** Random past date within [minDaysAgo, maxDaysAgo], at a realistic clock time. */
function randomPastDate(minDaysAgo: number, maxDaysAgo: number): Date {
  const d = new Date(Date.now() - randFloat(minDaysAgo, maxDaysAgo + 1) * 24 * 60 * 60 * 1000);
  d.setHours(randInt(8, 20), randInt(0, 59), 0, 0);
  return d;
}
/** Random future date within [minDays, maxDays], at a realistic clock time. */
function randomFutureDate(minDays: number, maxDays: number): Date {
  const d = new Date(Date.now() + randFloat(minDays, maxDays + 1) * 24 * 60 * 60 * 1000);
  d.setHours(randInt(9, 18), randInt(0, 59), 0, 0);
  return d;
}

/* ============================================================
 * 3. DATA POOLS — organizations
 * ============================================================ */
interface CompanyDef {
  name: string;
  industry: string;
  size: string;
  domain: string;
  logoSeed: string;
  tagline: string;
  cultureNotes: string;
  hrTeamSize: number;
  settings: {
    autoOfferEnabled: boolean;
    defaultThreshold: number;
    defaultVoice: string;
    domain: string;
    hiringSlack: string;
  };
}

// The first three are the historical demo orgs — kept so the original demo
// logins (hr@acmecloud.io, recruiter@nexusai.dev, talent@stripeflow.com) still work.
const COMPANIES: CompanyDef[] = [
  {
    name: 'Acme Cloud Labs',
    industry: 'Enterprise SaaS & Cloud Infrastructure',
    size: '500-1000 employees',
    domain: 'acmecloud.io',
    logoSeed: '1618005182384-a83a8bd57fbe',
    tagline: 'Cloud infrastructure that never sleeps',
    cultureNotes:
      'Acme Cloud Labs values asynchronous written communication, deep technical curiosity, and fast iterative delivery. Distributed-first with hubs in Austin, London, and Bangalore.',
    hrTeamSize: 4,
    settings: {
      autoOfferEnabled: true,
      defaultThreshold: 80,
      defaultVoice: 'Serena',
      domain: 'acmecloud.io',
      hiringSlack: '#acme-talent',
    },
  },
  {
    name: 'Nexus AI Studios',
    industry: 'Artificial Intelligence & Large Language Models',
    size: '50-200 employees',
    domain: 'nexusai.dev',
    logoSeed: '1620712943543-bcc4688e7485',
    tagline: 'Frontier research, production reliability',
    cultureNotes:
      'Nexus AI Studios is a research-forward lab. We publish open models, prize rigor over velocity, and hold a strong stance on ethical AI deployment.',
    hrTeamSize: 3,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 85,
      defaultVoice: 'Alloy',
      domain: 'nexusai.dev',
      hiringSlack: '#nexus-hiring',
    },
  },
  {
    name: 'StripeFlow Fintech',
    industry: 'High-Frequency Payments & Digital Banking',
    size: '1000+ employees',
    domain: 'stripeflow.com',
    logoSeed: '1634643917216-3ffb13a2d3f9',
    tagline: 'Move money at the speed of thought',
    cultureNotes:
      'StripeFlow operates under strict financial regulation. Reliability, compliance, and security are non-negotiables; hiring is rigorous and process-driven.',
    hrTeamSize: 5,
    settings: {
      autoOfferEnabled: true,
      defaultThreshold: 82,
      defaultVoice: 'Nova',
      domain: 'stripeflow.com',
      hiringSlack: '#stripeflow-talent',
    },
  },
  {
    name: 'Vertex Robotics',
    industry: 'Industrial Robotics & Automation',
    size: '200-500 employees',
    domain: 'vertexrobotics.com',
    logoSeed: '1581091226825-a6a2a5aee158',
    tagline: 'Robots that work alongside people',
    cultureNotes:
      'Vertex builds collaborative robot arms for warehouses and factories. A mix of hardware and software teams with a strong test-driven culture.',
    hrTeamSize: 3,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 78,
      defaultVoice: 'Alloy',
      domain: 'vertexrobotics.com',
      hiringSlack: '#vertex-hr',
    },
  },
  {
    name: 'Brightline Health',
    industry: 'Healthcare Technology & Telemedicine',
    size: '1000+ employees',
    domain: 'brightline.health',
    logoSeed: '1576091160399-112ba8d25d1d',
    tagline: 'Care that meets patients where they are',
    cultureNotes:
      'Brightline connects patients with clinicians through virtual visits. HIPAA compliance and patient empathy sit at the center of every product decision.',
    hrTeamSize: 4,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 80,
      defaultVoice: 'Serena',
      domain: 'brightline.health',
      hiringSlack: '#brightline-people',
    },
  },
  {
    name: 'Atlas Commerce',
    industry: 'E-Commerce Marketplace & Logistics',
    size: '500-1000 employees',
    domain: 'atlascommerce.io',
    logoSeed: '1561716516-b0b1c9f7e5a0',
    tagline: 'Shop any brand, one checkout',
    cultureNotes:
      'Atlas operates a cross-border marketplace with its own logistics network. High velocity, peak-season crunch, and a bias for shipping.',
    hrTeamSize: 4,
    settings: {
      autoOfferEnabled: true,
      defaultThreshold: 79,
      defaultVoice: 'Nova',
      domain: 'atlascommerce.io',
      hiringSlack: '#atlas-talent',
    },
  },
  {
    name: 'Bluepeak Analytics',
    industry: 'Data Analytics & Business Intelligence',
    size: '50-200 employees',
    domain: 'bluepeak.ai',
    logoSeed: '1551288049-bebda4e38f71',
    tagline: 'Turn raw data into boardroom decisions',
    cultureNotes:
      'Bluepeak builds BI tooling for mid-market CFOs. Small senior team, high agency, and a data-informed hiring loop.',
    hrTeamSize: 2,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 83,
      defaultVoice: 'Echo',
      domain: 'bluepeak.ai',
      hiringSlack: '#bluepeak-hiring',
    },
  },
  {
    name: 'Solarion Energy',
    industry: 'Clean Energy & Grid Software',
    size: '200-500 employees',
    domain: 'solarion.energy',
    logoSeed: '1509391366360-2e959784a276',
    tagline: 'Software for a renewable grid',
    cultureNotes:
      'Solarion builds monitoring and trading software for solar farms. Mission-driven, engineering-led, with a meaningful stake in decarbonizing the grid.',
    hrTeamSize: 3,
    settings: {
      autoOfferEnabled: true,
      defaultThreshold: 77,
      defaultVoice: 'Serena',
      domain: 'solarion.energy',
      hiringSlack: '#solarion-talent',
    },
  },
  {
    name: 'Craftfox Studio',
    industry: 'Digital Product & Design Studio',
    size: '10-50 employees',
    domain: 'craftfox.design',
    logoSeed: '1561070791-2526d30994b5',
    tagline: 'Beautiful software, shipped',
    cultureNotes:
      'Craftfox is a boutique studio pairing senior designers with full-stack engineers on client products. Flat structure, portfolio-driven hiring.',
    hrTeamSize: 2,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 84,
      defaultVoice: 'Alloy',
      domain: 'craftfox.design',
      hiringSlack: '#craftfox-jobs',
    },
  },
  {
    name: 'Northloop Mobility',
    industry: 'Autonomous Driving & Mobility',
    size: '500-1000 employees',
    domain: 'northloop.ai',
    logoSeed: '1553406834-36193f9c7f4a',
    tagline: 'The commute, reclaimed',
    cultureNotes:
      'Northloop develops Level 4 autonomous shuttle systems for campuses and airports. Safety-critical engineering culture with heavy simulation and formal verification.',
    hrTeamSize: 4,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 86,
      defaultVoice: 'Nova',
      domain: 'northloop.ai',
      hiringSlack: '#northloop-recruiting',
    },
  },
];

function orgLogo(def: CompanyDef): string {
  return `https://images.unsplash.com/photo-${def.logoSeed}?w=120&h=120&fit=crop&crop=faces`;
}

/* ============================================================
 * 4. DATA POOLS — people, locations, HR roles
 * ============================================================ */
const FIRST_NAMES = [
  'Aarav', 'Aisha', 'Alejandro', 'Alex', 'Amara', 'Anika', 'Arjun', 'Carlos', 'Chloe',
  'David', 'Diego', 'Dmitri', 'Elena', 'Ethan', 'Fatima', 'Grace', 'Hana', 'Hassan',
  'Isabella', 'Ivan', 'Jade', 'Juan', 'Kenji', 'Lina', 'Lucas', 'Marcus', 'Mateo',
  'Maya', 'Mei', 'Nadia', 'Nia', 'Omar', 'Priya', 'Rafael', 'Rohan', 'Sana', 'Sofia',
  'Sophia', 'Viktor', 'Wei', 'Yuki', 'Zara', 'Elias', 'Nora', 'Ibrahim', 'Priyanka',
  'Tomas', 'Amelia', 'Dev', 'Ingrid', 'Samuel', 'Riya', 'Gabriel', 'Leila', 'Owen',
  'Camila', 'Ravi', 'Tara', 'Marco', 'Hana', 'Aditi', 'Felix', 'Yara', 'Noah', 'Sara',
];

const LAST_NAMES = [
  'Rivers', 'Sharma', 'Chen', 'Patel', 'Johnson', 'Nguyen', 'Kim', 'Garcia', 'Okafor',
  'Silva', 'Kowalski', 'Wong', 'Gupta', 'Fernandez', 'Ali', 'Haddad', 'Rossi', 'Dubois',
  'Ivanov', 'Sato', 'Park', 'Mehta', 'Santos', 'Kapoor', 'Bauer', 'Iyer', 'Novak',
  'Tanaka', 'Khan', 'Murphy', 'Costa', 'Srinivasan', 'Volkov', 'Ortiz', 'Rahman',
  'Verma', 'Carter', 'Dias', 'Andersson', 'Reddy', 'Chowdhury', 'Moreau', 'Larsen',
  'da Silva', 'Hasegawa', 'Singh', 'Pereira', 'Bansal', 'Thakur', 'Nair', 'Barrett',
];

interface LocationDef {
  city: string;
  country: string;
  timezone: string;
  currency: 'usd' | 'inr' | 'eur' | 'gbp' | 'aud' | 'sgd';
}

const LOCATIONS: LocationDef[] = [
  { city: 'San Francisco', country: 'USA', timezone: 'America/Los_Angeles', currency: 'usd' },
  { city: 'Austin', country: 'USA', timezone: 'America/Chicago', currency: 'usd' },
  { city: 'New York', country: 'USA', timezone: 'America/New_York', currency: 'usd' },
  { city: 'Seattle', country: 'USA', timezone: 'America/Los_Angeles', currency: 'usd' },
  { city: 'Denver', country: 'USA', timezone: 'America/Denver', currency: 'usd' },
  { city: 'Raleigh', country: 'USA', timezone: 'America/New_York', currency: 'usd' },
  { city: 'Toronto', country: 'Canada', timezone: 'America/Toronto', currency: 'usd' },
  { city: 'London', country: 'UK', timezone: 'Europe/London', currency: 'gbp' },
  { city: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin', currency: 'eur' },
  { city: 'Amsterdam', country: 'Netherlands', timezone: 'Europe/Amsterdam', currency: 'eur' },
  { city: 'Paris', country: 'France', timezone: 'Europe/Paris', currency: 'eur' },
  { city: 'Dublin', country: 'Ireland', timezone: 'Europe/Dublin', currency: 'eur' },
  { city: 'Stockholm', country: 'Sweden', timezone: 'Europe/Stockholm', currency: 'eur' },
  { city: 'Zurich', country: 'Switzerland', timezone: 'Europe/Zurich', currency: 'eur' },
  { city: 'Bangalore', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'Hyderabad', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'Pune', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore', currency: 'sgd' },
  { city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai', currency: 'usd' },
  { city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', currency: 'usd' },
  { city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', currency: 'aud' },
  { city: 'São Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo', currency: 'usd' },
  { city: 'Mexico City', country: 'Mexico', timezone: 'America/Mexico_City', currency: 'usd' },
];

const AVATAR_SEEDS = [
  '1494790108377-be9c29b29330', '1507003211169-0a1dd7228f2d', '1438761681033-6461ffad8d80',
  '1500648767791-00dcc994a43e', '1506794778202-cad84cf45f1d', '1519345182560-3f2917c472ef',
  '1531123897727-8f129e1688ce', '1544005313-94ddf0286df2', '1547425260-76bcadfb4f2c',
  '1560250097-0b93528c311a', '1573496359142-b8d87734a5a2', '1580489944761-15a19d654956',
  '1599566150163-29194dcaad36', '1607746882042-944635dfe10e', '1508214751196-bcfd4ca60f91',
  '1517841905240-472988babdf9', '1524504388940-b1c1722653e1', '1571501679680-de32f1e7aad4',
  '1589141098257-32e35c8f24f6', '1535713875002-d1d0cf377fde', '1522075469751-3a6694fb2f61',
  '1488426862026-3ee34a7d66df', '1502823403499-6ccfcf4fb453', '1531123897727-8f129e1688ce',
  '1596815202906-c3f9e0d5d2f5', '1507003211169-0a1dd7228f2d', '1544717305-278254c7d6db',
  '1524250502761-1ac6f2e30d43', '1548142813-c348350df52b', '1534528741775-53994a69daeb',
];

const HR_TITLES = [
  'Head of Talent Acquisition', 'Senior Technical Recruiter', 'Talent Partner',
  'Engineering Recruiter', 'Recruiting Operations Lead', 'People & Talent Manager',
  'Senior Talent Sourcer', 'Talent Acquisition Lead', 'Hiring Program Manager',
];

const HR_SPECIALTIES = [
  'Backend Engineering', 'Frontend & UI', 'AI & ML Engineering', 'Product Management',
  'Design & Research', 'Data Engineering', 'DevOps & SRE', 'Executive Search',
  'Mobile Engineering', 'Early-career Programs', 'Diversity Sourcing', 'Payroll & Compliance',
];

const HR_AVATAR = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?w=200&h=200&fit=crop&crop=faces`;

const EMAIL_PROVIDERS = ['gmail.com', 'yahoo.com', 'outlook.com', 'proton.me', 'hey.com'];

function slugifyName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '.');
}

/* ============================================================
 * 5. DATA POOLS — skills, roles, domains
 * ============================================================ */
type Domain = 'frontend' | 'backend' | 'data' | 'infra' | 'mobile' | 'design' | 'product' | 'marketing' | 'security' | 'hardware';

interface DomainPool {
  key: Domain;
  label: string;
  skills: string[];
  roles: string[];
  headlineNoun: string;
}

const DOMAINS: DomainPool[] = [
  {
    key: 'frontend',
    label: 'Frontend Engineering',
    skills: ['React', 'TypeScript', 'Next.js', 'Vue', 'TailwindCSS', 'Redux', 'Zustand', 'GraphQL', 'WebGL', 'Three.js', 'Accessibility', 'Web Performance', 'Vite', 'Storybook', 'CSS-in-JS', 'Jest'],
    roles: ['Senior Frontend Engineer', 'Frontend Engineer', 'Staff Frontend Engineer', 'Design Engineer', 'Web Performance Engineer'],
    headlineNoun: 'frontend engineer',
  },
  {
    key: 'backend',
    label: 'Backend Engineering',
    skills: ['Node.js', 'Python', 'Go', 'Rust', 'Java', 'Express', 'FastAPI', 'Django', 'Spring Boot', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'gRPC', 'GraphQL', 'Docker', 'Microservices', 'Elasticsearch'],
    roles: ['Senior Backend Engineer', 'Backend Engineer', 'Staff Backend Engineer', 'Platform Engineer', 'Distributed Systems Engineer'],
    headlineNoun: 'backend engineer',
  },
  {
    key: 'data',
    label: 'Data & ML Engineering',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'JAX', 'CUDA', 'scikit-learn', 'LangChain', 'Pandas', 'Spark', 'Airflow', 'dbt', 'SQL', 'MLflow', 'Hugging Face', 'ONNX', 'Kubernetes', 'Weaviate', 'Snowflake'],
    roles: ['Machine Learning Engineer', 'Data Engineer', 'AI Research Engineer', 'Data Scientist', 'Analytics Engineer', 'ML Infrastructure Engineer'],
    headlineNoun: 'data & ML engineer',
  },
  {
    key: 'infra',
    label: 'DevOps & Infrastructure',
    skills: ['AWS', 'GCP', 'Azure', 'Terraform', 'Kubernetes', 'Docker', 'GitHub Actions', 'ArgoCD', 'Prometheus', 'Grafana', 'Istio', 'Vault', 'Linux', 'Bash', 'Ansible', 'CI/CD'],
    roles: ['DevOps Engineer', 'Site Reliability Engineer', 'Platform Engineer', 'Cloud Infrastructure Engineer'],
    headlineNoun: 'infrastructure engineer',
  },
  {
    key: 'mobile',
    label: 'Mobile Engineering',
    skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Jetpack Compose', 'Firebase', 'GraphQL', 'Fastlane'],
    roles: ['Senior Mobile Engineer', 'iOS Engineer', 'Android Engineer', 'React Native Engineer'],
    headlineNoun: 'mobile engineer',
  },
  {
    key: 'design',
    label: 'Product & UX Design',
    skills: ['Figma', 'Design Systems', 'UX Research', 'Prototyping', 'Interaction Design', 'Motion Design', 'Accessibility', 'User Testing', 'Wireframing', 'Illustration'],
    roles: ['Product Designer', 'Senior Product Designer', 'UX Researcher', 'Design Engineer'],
    headlineNoun: 'product designer',
  },
  {
    key: 'product',
    label: 'Product Management',
    skills: ['Product Strategy', 'A/B Testing', 'SQL', 'User Research', 'Roadmapping', 'Analytics', 'Stakeholder Management', 'Agile', 'OKR Planning'],
    roles: ['Product Manager', 'Senior Product Manager', 'Product Analyst', 'Program Manager'],
    headlineNoun: 'product manager',
  },
  {
    key: 'marketing',
    label: 'Marketing & Growth',
    skills: ['SEO', 'Growth Marketing', 'Content Strategy', 'Email Marketing', 'Analytics', 'A/B Testing', 'CRM', 'Copywriting', 'Paid Acquisition', 'Market Research'],
    roles: ['Growth Marketer', 'Marketing Manager', 'Content Marketing Lead', 'Product Marketing Manager'],
    headlineNoun: 'marketing professional',
  },
  {
    key: 'security',
    label: 'Security Engineering',
    skills: ['OWASP', 'Penetration Testing', 'Cryptography', 'IAM', 'SIEM', 'SOC 2', 'Zero Trust', 'Threat Modeling', 'Kubernetes Security', 'Web Security'],
    roles: ['Security Engineer', 'Application Security Engineer', 'Security Analyst', 'Compliance Analyst'],
    headlineNoun: 'security engineer',
  },
  {
    key: 'hardware',
    label: 'Robotics & Hardware',
    skills: ['ROS 2', 'C++', 'Python', 'Embedded C', 'Real-time Systems', 'Motion Planning', 'Computer Vision', 'Sensor Fusion', 'Control Theory', 'Simulation', 'Linux Kernel'],
    roles: ['Robotics Software Engineer', 'Controls Engineer', 'Embedded Systems Engineer', 'Computer Vision Engineer', 'Simulation Engineer'],
    headlineNoun: 'robotics engineer',
  },
];

const WORK_VALUES = [
  'Technical Autonomy', 'Continuous Mentorship', 'High Velocity Shipping', 'Research Rigor',
  'Open Source Contribution', 'Ethical AI Development', 'System Reliability', 'Clean Code Principles',
  'Ownership Culture', 'Design Precision', 'Accessibility Standards', 'User Delight',
  'Algorithmic Efficiency', 'Product-Centric Engineering', 'Cross-Functional Collaboration',
  'Remote-First Work', 'Data-Driven Decisions', 'Psychological Safety', 'Learning Budget',
  'Customer Obsession', 'Sustainability', 'Security First',
];

const WORK_AUTH = ['US Citizen', 'Green Card Holder', 'H-1B Visa', 'OPT / EAD', 'UK Right to Work', 'EU Citizen', 'Permanent Resident (SG)', 'No sponsorship needed', 'Need visa sponsorship'];

const NOTICE_PERIODS = ['Immediate', '1 week', '2 weeks', '3 weeks', '1 month', '2 months', '90 days'];

const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];

/* ============================================================
 * 6. DATA POOLS — job templates & description content
 * ============================================================ */
interface JobTemplate {
  org: string;
  title: string;
  domain: Domain;
  city: string;
  exp: string;
  salary: [number, number]; // [min, max] in the location currency's natural unit (k USD / L INR / k EUR...)
  status: 'active' | 'published' | 'draft' | 'paused' | 'closed';
  rubric: { technical: number; communication: number; problemSolving: number; experience: number };
  minScore: number;
  autoOffer: boolean;
  skillOverrides?: string[];
}

const JOB_TEMPLATES: JobTemplate[] = [
  // Acme Cloud Labs
  { org: 'Acme Cloud Labs', title: 'Senior Full-Stack Engineer (React & Node.js)', domain: 'backend', city: 'Austin', exp: '5-8 years', salary: [150, 190], status: 'active', rubric: { technical: 35, communication: 25, problemSolving: 25, experience: 15 }, minScore: 80, autoOffer: true },
  { org: 'Acme Cloud Labs', title: 'Platform Engineer (Kubernetes & Terraform)', domain: 'infra', city: 'San Francisco', exp: '4-7 years', salary: [160, 205], status: 'active', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 80, autoOffer: true },
  { org: 'Acme Cloud Labs', title: 'Product Manager, Developer Experience', domain: 'product', city: 'London', exp: '4-6 years', salary: [90, 120], status: 'published', rubric: { technical: 25, communication: 35, problemSolving: 20, experience: 20 }, minScore: 78, autoOffer: false },
  { org: 'Acme Cloud Labs', title: 'Staff Frontend Engineer (Design Systems)', domain: 'frontend', city: 'Austin', exp: '7-10 years', salary: [165, 210], status: 'paused', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 84, autoOffer: false },
  // Nexus AI Studios
  { org: 'Nexus AI Studios', title: 'AI Systems & LLM Infrastructure Engineer', domain: 'data', city: 'San Francisco', exp: '4-7 years', salary: [185, 240], status: 'active', rubric: { technical: 45, communication: 15, problemSolving: 25, experience: 15 }, minScore: 85, autoOffer: false },
  { org: 'Nexus AI Studios', title: 'Research Engineer, RLHF & Alignment', domain: 'data', city: 'Berlin', exp: '3-6 years', salary: [110, 145], status: 'active', rubric: { technical: 45, communication: 15, problemSolving: 25, experience: 15 }, minScore: 86, autoOffer: false },
  { org: 'Nexus AI Studios', title: 'Data Engineer, Training Pipelines', domain: 'data', city: 'Bangalore', exp: '3-5 years', salary: [40, 65], status: 'published', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 82, autoOffer: false },
  // StripeFlow Fintech
  { org: 'StripeFlow Fintech', title: 'Staff Backend Distributed Systems Architect', domain: 'backend', city: 'New York', exp: '8-12 years', salary: [210, 270], status: 'active', rubric: { technical: 40, communication: 30, problemSolving: 15, experience: 15 }, minScore: 84, autoOffer: true },
  { org: 'StripeFlow Fintech', title: 'Senior Android Engineer, Mobile Payments', domain: 'mobile', city: 'New York', exp: '4-7 years', salary: [155, 195], status: 'active', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 82, autoOffer: true },
  { org: 'StripeFlow Fintech', title: 'Application Security Engineer', domain: 'security', city: 'Toronto', exp: '4-7 years', salary: [140, 180], status: 'active', rubric: { technical: 45, communication: 15, problemSolving: 25, experience: 15 }, minScore: 83, autoOffer: false },
  { org: 'StripeFlow Fintech', title: 'Product Manager, Core Payments', domain: 'product', city: 'New York', exp: '5-8 years', salary: [170, 215], status: 'draft', rubric: { technical: 25, communication: 35, problemSolving: 20, experience: 20 }, minScore: 82, autoOffer: false },
  // Vertex Robotics
  { org: 'Vertex Robotics', title: 'Robotics Software Engineer (ROS 2)', domain: 'hardware', city: 'Austin', exp: '3-6 years', salary: [125, 165], status: 'active', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 80, autoOffer: false },
  { org: 'Vertex Robotics', title: 'Controls Engineer, Motion Planning', domain: 'hardware', city: 'Boston', exp: '5-8 years', salary: [135, 175], status: 'active', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 80, autoOffer: false },
  { org: 'Vertex Robotics', title: 'Embedded Systems Engineer', domain: 'hardware', city: 'Boston', exp: '3-6 years', salary: [120, 160], status: 'published', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 78, autoOffer: false },
  // Brightline Health
  { org: 'Brightline Health', title: 'Senior Backend Engineer (HIPAA Platform)', domain: 'backend', city: 'Denver', exp: '5-8 years', salary: [150, 190], status: 'active', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 82, autoOffer: false },
  { org: 'Brightline Health', title: 'Product Designer, Clinical Workflows', domain: 'design', city: 'Denver', exp: '4-7 years', salary: [120, 155], status: 'active', rubric: { technical: 25, communication: 35, problemSolving: 20, experience: 20 }, minScore: 80, autoOffer: false },
  { org: 'Brightline Health', title: 'Data Analyst, Population Health', domain: 'data', city: 'Raleigh', exp: '2-5 years', salary: [95, 130], status: 'published', rubric: { technical: 35, communication: 25, problemSolving: 25, experience: 15 }, minScore: 78, autoOffer: false },
  // Atlas Commerce
  { org: 'Atlas Commerce', title: 'Backend Engineer, Order Platform', domain: 'backend', city: 'Seattle', exp: '4-7 years', salary: [145, 185], status: 'active', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 80, autoOffer: true },
  { org: 'Atlas Commerce', title: 'Frontend Engineer, Checkout Experience', domain: 'frontend', city: 'Seattle', exp: '3-6 years', salary: [135, 175], status: 'active', rubric: { technical: 35, communication: 25, problemSolving: 25, experience: 15 }, minScore: 79, autoOffer: true },
  { org: 'Atlas Commerce', title: 'Data Engineer, Logistics Analytics', domain: 'data', city: 'Singapore', exp: '3-6 years', salary: [110, 145], status: 'published', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 80, autoOffer: false },
  // Bluepeak Analytics
  { org: 'Bluepeak Analytics', title: 'Analytics Engineer', domain: 'data', city: 'New York', exp: '3-6 years', salary: [130, 170], status: 'active', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 82, autoOffer: false },
  { org: 'Bluepeak Analytics', title: 'Frontend Engineer, Data Visualization', domain: 'frontend', city: 'Austin', exp: '3-6 years', salary: [125, 165], status: 'active', rubric: { technical: 35, communication: 25, problemSolving: 25, experience: 15 }, minScore: 80, autoOffer: false },
  { org: 'Bluepeak Analytics', title: 'Solutions Engineer', domain: 'product', city: 'New York', exp: '3-6 years', salary: [135, 175], status: 'published', rubric: { technical: 30, communication: 35, problemSolving: 20, experience: 15 }, minScore: 78, autoOffer: false },
  // Solarion Energy
  { org: 'Solarion Energy', title: 'Full-Stack Engineer, Grid Monitoring', domain: 'backend', city: 'Berlin', exp: '4-7 years', salary: [95, 125], status: 'active', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 79, autoOffer: true },
  { org: 'Solarion Energy', title: 'Data Scientist, Energy Forecasting', domain: 'data', city: 'Amsterdam', exp: '3-6 years', salary: [100, 135], status: 'active', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 81, autoOffer: false },
  { org: 'Solarion Energy', title: 'DevOps Engineer, Edge Platform', domain: 'infra', city: 'Berlin', exp: '3-6 years', salary: [90, 120], status: 'paused', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 78, autoOffer: false },
  // Craftfox Studio
  { org: 'Craftfox Studio', title: 'Design Engineer', domain: 'design', city: 'Amsterdam', exp: '4-7 years', salary: [85, 110], status: 'active', rubric: { technical: 35, communication: 30, problemSolving: 20, experience: 15 }, minScore: 83, autoOffer: false },
  { org: 'Craftfox Studio', title: 'Senior Product Designer', domain: 'design', city: 'Paris', exp: '5-8 years', salary: [80, 105], status: 'published', rubric: { technical: 25, communication: 35, problemSolving: 20, experience: 20 }, minScore: 82, autoOffer: false },
  { org: 'Craftfox Studio', title: 'Frontend Engineer, Brand Sites', domain: 'frontend', city: 'Amsterdam', exp: '3-6 years', salary: [75, 95], status: 'closed', rubric: { technical: 35, communication: 25, problemSolving: 25, experience: 15 }, minScore: 78, autoOffer: false },
  // Northloop Mobility
  { org: 'Northloop Mobility', title: 'Perception Engineer, Sensor Fusion', domain: 'hardware', city: 'San Francisco', exp: '4-8 years', salary: [180, 230], status: 'active', rubric: { technical: 45, communication: 15, problemSolving: 25, experience: 15 }, minScore: 85, autoOffer: false },
  { org: 'Northloop Mobility', title: 'Simulation Engineer', domain: 'hardware', city: 'Seattle', exp: '4-7 years', salary: [160, 200], status: 'active', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 84, autoOffer: false },
  { org: 'Northloop Mobility', title: 'Site Reliability Engineer, Fleet Data', domain: 'infra', city: 'San Francisco', exp: '4-7 years', salary: [170, 215], status: 'draft', rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 }, minScore: 84, autoOffer: false },
];

const RESPONSIBILITIES: Record<Domain, string[]> = {
  frontend: [
    'Build modular, accessible React UI with modern hooks and state machines',
    'Optimize Core Web Vitals and bundle size for millions of page views',
    'Ship design-system components consumed across multiple product lines',
    'Integrate GraphQL and REST APIs with rigorous loading and error states',
    'Write unit and integration tests with Jest and React Testing Library',
  ],
  backend: [
    'Design resilient REST and gRPC services under high concurrency',
    'Own database schema, indexing, and query performance on PostgreSQL',
    'Build idempotent, retry-safe APIs for mission-critical flows',
    'Instrument services with structured logging and metrics',
    'Implement caching with Redis and event-driven integration via Kafka',
  ],
  data: [
    'Build and maintain scalable data pipelines with Airflow and dbt',
    'Train, evaluate, and deploy ML models into production serving',
    'Optimize inference latency and cost for low-latency serving',
    'Design feature stores and model registries for the ML platform',
    'Partner with researchers to productionize experimental models',
  ],
  infra: [
    'Operate Kubernetes clusters at scale with Terraform and GitOps',
    'Design CI/CD pipelines that serve many product teams safely',
    'Build observability with Prometheus, Grafana, and OpenTelemetry',
    'Drive incident response and a culture of reliability',
    'Automate secrets management and compliance evidence with Vault',
  ],
  mobile: [
    'Build polished, testable mobile experiences in Kotlin or Swift',
    'Integrate secure payment and authentication flows',
    'Optimize app startup time and memory footprint',
    'Maintain CI with Fastlane and on-device test suites',
  ],
  design: [
    'Own end-to-end product design from research to high-fidelity',
    'Maintain and extend our design system and token library',
    'Run usability tests and turn insights into concrete direction',
    'Partner closely with engineers to ship pixel-perfect UI',
  ],
  product: [
    'Own the roadmap for a product area end to end',
    'Run discovery with customers, support, and sales teams',
    'Define metrics and analyze adoption with SQL',
    'Partner with design and engineering to ship quarterly goals',
  ],
  marketing: [
    'Own growth loops from acquisition through activation and retention',
    'Plan and execute multi-channel campaigns with clear attribution',
    'Build a content and SEO engine that compounds over time',
    'Measure everything against a clean, well-instrumented analytics stack',
  ],
  security: [
    'Run threat modeling across new features and infrastructure',
    'Own the application security program: SAST, DAST, and pen-testing',
    'Respond to and remediate security incidents end to end',
    'Drive SOC 2 and compliance evidence automation',
  ],
  hardware: [
    'Develop real-time control and perception software in C++',
    'Build simulation environments for hardware-in-the-loop testing',
    'Implement sensor fusion, calibration, and diagnostics pipelines',
    'Optimize embedded software for latency, power, and determinism',
    'Integrate ROS 2 components into production robot systems',
  ],
};

const REQUIREMENTS: Record<Domain, string[]> = {
  frontend: [
    '5+ years shipping production React and TypeScript',
    'Deep understanding of browser rendering and performance budgets',
    'Experience with SSR frameworks such as Next.js',
    'Strong eye for interaction detail and accessibility (WCAG 2.1)',
  ],
  backend: [
    '5+ years building backend services in Node.js, Go, or Python',
    'Strong SQL and data-modelling skills on PostgreSQL',
    'Familiarity with queues (Kafka, BullMQ) and distributed systems',
    'Experience operating services in production at meaningful scale',
  ],
  data: [
    'Strong Python and PyTorch; exposure to LLM tooling is a plus',
    'Solid SQL and cloud data-warehousing experience',
    'Experience with MLOps tooling such as MLflow or Kubeflow',
    'Comfort operating GPU clusters and containerized training',
  ],
  infra: [
    'Deep AWS or GCP experience with infrastructure-as-code',
    'Kubernetes administration and service-mesh knowledge',
    'Linux systems expertise and strong scripting',
    'SRE mindset with clear SLI and SLO ownership',
  ],
  mobile: [
    '3+ years in native or cross-platform mobile development',
    'Experience shipping transactional or regulated applications',
    'Strong understanding of offline-first architecture',
  ],
  design: [
    '4+ years designing digital products for web or mobile',
    'Portfolio showing shipped work and strong visual craft',
    'Proficiency in Figma and modern prototyping tools',
    'Experience designing for accessibility',
  ],
  product: [
    '3+ years as a product manager in B2B SaaS or platform products',
    'Strong analytical skills and SQL comfort',
    'Excellent written and verbal communication',
    'Experience with agile delivery and OKRs',
  ],
  marketing: [
    '3+ years in growth or product marketing',
    'Hands-on with analytics and A/B testing tooling',
    'Strong copywriting and storytelling',
    'Familiarity with CRM and email marketing platforms',
  ],
  security: [
    '3+ years in application or product security',
    'Deep knowledge of the OWASP Top 10 and common CWE classes',
    'Experience securing cloud and Kubernetes infrastructure',
    'Strong communication for security design reviews',
  ],
  hardware: [
    '5+ years in robotics, controls, or embedded systems',
    'Strong C++ and Python with a real-time systems background',
    'Experience with ROS 2 or equivalent middleware',
    'Familiarity with computer vision and sensor processing',
  ],
};

const SALARY_STRINGS: Record<LocationDef['currency'], (min: number, max: number) => string> = {
  usd: (min, max) => `$${Math.round(min)}k – $${Math.round(max)}k`,
  inr: (min, max) => `₹${Math.round(min)}L – ₹${Math.round(max)}L`,
  eur: (min, max) => `€${Math.round(min)}k – €${Math.round(max)}k`,
  gbp: (min, max) => `£${Math.round(min)}k – £${Math.round(max)}k`,
  aud: (min, max) => `A$${Math.round(min)}k – A$${Math.round(max)}k`,
  sgd: (min, max) => `S$${Math.round(min)}k – S$${Math.round(max)}k`,
};

function locationForCity(city: string): LocationDef {
  return LOCATIONS.find((l) => l.city === city) ?? LOCATIONS[0];
}

function buildJobDescription(tpl: JobTemplate, company: CompanyDef): string {
  const resp = pickN(RESPONSIBILITIES[tpl.domain], 3);
  const req = pickN(REQUIREMENTS[tpl.domain], 3);
  return [
    `## About ${company.name}`,
    `${company.tagline}. ${company.cultureNotes}`,
    '',
    `We are looking for a ${tpl.title.toLowerCase()} to join our ${tpl.city} team.`,
    '',
    '## Responsibilities',
    ...resp.map((r) => `- ${r}`),
    '',
    '## Requirements',
    ...req.map((r) => `- ${r}`),
    `- ${tpl.exp} years of professional experience in ${DOMAINS.find((d) => d.key === tpl.domain)?.label.toLowerCase()}`,
  ].join('\n');
}

function buildJobSkills(tpl: JobTemplate): string[] {
  const pool = DOMAINS.find((d) => d.key === tpl.domain)!.skills;
  return pickN(pool, randInt(6, 9));
}

function buildJobStages(): string[] {
  // Mirrors the edit-page stage enum: 'screening'|'assessment'|'voice_screen'|'hr_round'|'panel'|'decision'
  return ['screening', 'assessment', 'voice_screen', 'hr_round', 'panel', 'decision'];
}

function buildAssessmentConfig(): unknown {
  // Mirrors the edit page's assessmentConfig shape; codingProblemId references apps/api/src/data/coding-problems.json
  return {
    mcqCount: randInt(5, 10),
    codingProblemId: pick(['virtualized-list', 'rate-limiter', 'lru-cache', 'two-sum', 'valid-parentheses']),
    passingScore: randInt(70, 85),
  };
}

/* ============================================================
 * 7. DATA POOLS — bios, projects, interview & assessment content
 * ============================================================ */
const BIO_INTROS = [
  'Product-minded engineer with a track record of shipping',
  'Builder who cares about systems that stay up and code that reads clearly',
  'I turn ambiguous problems into well-scoped, well-tested features',
  'Engineer and mentor focused on high-leverage, durable architecture',
  'T-shaped specialist who pairs deep craft with strong collaboration',
  'I have spent my career making fast products faster and simple systems simpler',
  'Curious generalist with deep roots in',
  'Reliability engineer at heart, product advocate in practice',
  'I believe great software is designed for the humans who maintain it',
  'Researcher turned engineer, obsessed with measurable impact',
];

const BIO_MIDDLES = [
  'Across two startups and a large platform, I owned systems serving millions of users.',
  'Over the last decade I have led delivery on 0-to-1 products and critical migration projects.',
  'My recent focus has been performance, observability, and developer experience.',
  'I have built and coached high-trust teams across three continents.',
  'I bring a balance of hands-on craft and strategic product thinking to every team.',
  'I have shipped features end to end, from discovery through operations.',
  'My work consistently lands at the intersection of business goals and engineering excellence.',
  'I am at my best when mentoring engineers while unblocking gnarly technical problems.',
  'I have deep experience in regulated industries where correctness is non-negotiable.',
  'I love measuring everything, iterating quickly, and leaving codebases cleaner than I found them.',
];

const PROUD_PROJECTS = [
  'Architected a micro-frontend platform that cut page-load latency by 45% for 2M daily users.',
  'Trained and quantized a 70B parameter LLM to 4-bit for low-latency edge inference with AWQ.',
  'Built a zero-downtime event streaming pipeline that handled 500k events/second during peak.',
  'Replaced a brittle monolith with event-driven services, reducing incident count by 70%.',
  'Designed an idempotent payment retry layer that eliminated double-charges in production.',
  'Created a design system used across 12 product lines with full accessibility coverage.',
  'Implemented a lock-free concurrent B-tree in C++ achieving 3x throughput over std locks.',
  'Shipped real-time collaborative editing over WebSockets with CRDT-based conflict resolution.',
  'Led a PostgreSQL sharding migration moving 40TB with zero downtime and zero data loss.',
  'Built an on-device ML pipeline that cut inference cost 6x without accuracy loss.',
  'Operationalized Kubernetes at a fintech, taking PCI-scoped workloads from 99.5% to 99.99% uptime.',
  'Launched an internal developer platform that reduced service onboarding from weeks to hours.',
  'Drove a SOC 2 Type II audit to completion with fully automated evidence collection.',
  'Designed a fleet-wide sensor calibration tool used by 400+ robots in production.',
  'Built a real-time fraud-detection model that flagged 3x more fraud with 60% fewer false positives.',
  'Shipped an offline-first mobile checkout that lifted conversion 18% on low-bandwidth networks.',
  'Created an anomaly-detection service that surfaces grid faults 20 minutes before they cascade.',
  'Overhauled the CI/CD pipeline, cutting average merge-to-deploy time from 2 days to 35 minutes.',
  'Led a research-to-production model handoff that scaled a 40-person data science team.',
  'Rebuilt the analytics warehouse in dbt + Snowflake, cutting report build time by 80%.',
];

const INTERVIEW_INTRO_QUESTION = [
  'Tell me about a recent project you are proud of and the role you played.',
  'Walk me through your background and what draws you to this role.',
  'Describe how you approach a new problem in an unfamiliar codebase.',
  'What kind of impact have you had on your current team that you are most proud of?',
];

const INTERVIEW_CLOSING = [
  'Thanks for that detail — that wraps our technical evaluation. The hiring team will review your scorecard shortly.',
  'Excellent. That completes our questions — is there anything about the role or team you would like to ask?',
  'Great insight. We will package your scorecard for the team and be in touch on next steps.',
];

const INTERVIEW_QUESTIONS: Record<Domain, string[]> = {
  frontend: [
    'How do you approach performance optimization in a React application that is slow to hydrate?',
    'Describe a time you built a complex accessible UI — what tradeoffs did you navigate?',
    'How would you design state management for a large, multi-module application?',
    'How do you keep a design system consistent while product teams move fast?',
    'Explain how you would reduce bundle size on a growing Next.js app.',
  ],
  backend: [
    'How do you design an API to be idempotent and safe under retries?',
    'Walk me through how you would debug a database query that degrades under load.',
    'Describe how you would design a system that must process millions of events per day reliably.',
    'How do you approach service decomposition versus a monolith for a fast-moving startup?',
    'Explain your strategy for maintaining data consistency across microservices.',
  ],
  data: [
    'How would you evaluate and deploy an LLM to production cost-effectively?',
    'Describe how you would design a training data pipeline for a recommendation model.',
    'How do you measure model drift and decide when to retrain?',
    'Walk through an ML problem end to end: data, modeling, serving, monitoring.',
    'How do you think about GPU utilization and inference latency tradeoffs?',
  ],
  infra: [
    'How would you design a Kubernetes rollout strategy for zero-downtime deploys?',
    'Describe a time you improved reliability or reduced MTTR on a critical service.',
    'How do you approach cost optimization on a large cloud bill?',
    'Walk me through how you would design observability for a distributed system.',
  ],
  mobile: [
    'How do you keep an offline-first mobile app consistent when connectivity returns?',
    'Describe how you would reduce app startup time in a large mobile codebase.',
    'How do you approach secure storage of sensitive data on device?',
    'Walk through a release cycle for a mobile app and how you mitigate regressions.',
  ],
  design: [
    'Walk me through your process from user research to a shipped design.',
    'How do you balance visual delight with accessibility requirements?',
    'Describe a design decision you defended against engineering or product pushback.',
    'How do you build and maintain a design system that scales across teams?',
  ],
  product: [
    'How do you decide what to build when every stakeholder wants something different?',
    'Describe a product metric you moved meaningfully and how you did it.',
    'How do you run discovery with customers without leading them?',
    'Walk me through how you would prioritize a roadmap for the next two quarters.',
  ],
  marketing: [
    'Describe a growth campaign you ran that materially moved a core metric.',
    'How do you measure marketing attribution across multiple channels?',
    'How would you build an SEO engine for a new product category?',
    'Walk me through a time you took a failing channel and turned it around.',
  ],
  security: [
    'How would you approach threat modeling for a new payment integration?',
    'Describe a security incident you handled and what you learned.',
    'How do you balance developer velocity with security controls?',
    'Walk me through how you would secure a Kubernetes-based microservices platform.',
  ],
  hardware: [
    'How do you design a real-time control loop that must meet hard latency guarantees?',
    'Describe how you would test safety-critical robotic software.',
    'How do you handle sensor noise and failures in a perception pipeline?',
    'Walk through an embedded systems debugging session that was particularly hard.',
  ],
};

const INTERVIEW_ANSWERS: Record<Domain, string[]> = {
  frontend: [
    'I start with profiling to find the real bottleneck — usually hydration or third-party scripts — then fix the largest 20% of the problem first. I track Core Web Vitals in CI so regressions fail the build.',
    'I treat accessibility as a design constraint, not a checklist. I build with semantic HTML, test with a screen reader, and involve users with disabilities in usability sessions.',
    'I prefer the simplest state model that fits: server state in a query layer, UI state local, and a small amount of global state for cross-cutting concerns. I avoid over-centralizing.',
    'I keep the system token-based and treat components as contracts. Changes go through review, and we version breaking changes instead of breaking consumers.',
    'I measure first, then act: code-split routes, lazy-load below-the-fold libraries, and remove dead dependencies. I also audit why each dependency is in the bundle.',
  ],
  backend: [
    'Idempotency keys are the answer. Every mutating request carries a key, the server dedupes on it, and the response is cached so retries return the same result. I pair it with exactly-once delivery on the queue side.',
    'I reproduce the load with a query plan in hand. Often it is a missing index, a bad join, or a scan caused by type mismatch. I always verify the plan after the change.',
    'I design around durable queues and event sourcing: producers write, consumers process, and we guarantee at-least-once with idempotent handlers. Observability on every hop.',
    'I start from the business boundaries and keep services coarse-grained. The cost of a distributed transaction is high, so I prefer local transactions with async reconciliation.',
    'I use the Saga pattern with compensating actions, plus an outbox pattern so local writes and message publishing are atomic.',
  ],
  data: [
    'I evaluate quality and cost on representative data, use quantization and speculative decoding to cut latency, and gate deploys with offline evals plus online guardrails.',
    'I design pipelines as versioned, idempotent steps with data quality checks at each stage, and I store features in a feature store so training and serving are consistent.',
    'I track feature distributions and prediction confidence in production. When drift crosses a threshold with clear business impact, I trigger retraining with a human-in-the-loop review.',
    'I scope the problem with stakeholders, baseline the data, build a simple model first, and only add complexity when it earns its keep. Serving, monitoring, and rollback are part of the plan from day one.',
    'I think about it as throughput per dollar and per watt: right-sizing GPU instances, batching, and caching are usually the highest-leverage levers before any model change.',
  ],
  infra: [
    'I use incremental rollouts with health gates and automatic rollback. Canary releases on a small slice, watch error budgets, then scale. Everything is declarative so the deploy is reproducible.',
    'I look for the top error budget burners, remove flaky alerts so signal is clean, and invest in runbooks and postmortem-driven fixes. Reducing MTTR is mostly about clarity and automation.',
    'I tag everything, find idle and oversized resources, and use committed-use discounts. The biggest wins are usually right-sizing and deleting unused infrastructure.',
    'I follow the RED method: request rate, errors, and duration at every service, with traces correlated across the stack so a single dashboard tells the whole story.',
  ],
  mobile: [
    'I queue local mutations and reconcile with the server on reconnect, using server timestamps and monotonic local IDs to resolve conflicts deterministically.',
    'I profile the launch path with Instruments and trim the work: defer non-critical work, lazy-load modules, and prewarm only what users need first.',
    'I use the platform keychain and Keystore for secrets, never log them, and keep sensitive flows short-lived with biometric gateways.',
    'I release progressively with staged rollouts, keep feature flags in the codebase, and rely on on-device test suites plus a small, trusted beta cohort.',
  ],
  design: [
    'I begin with the user problem and research, then sketch multiple directions, prototype the strongest, test with users, and iterate. I stay close to engineers through handoff.',
    'I design for the constraints first — contrast, focus, and screen-reader semantics — then let the visual system elevate within those bounds. Delight never overrides usability.',
    'I bring the evidence: usage data, user clips, and a working prototype. I find the common ground between their concern and the user need, then ship a small experiment to settle it.',
    'I start with tokens and primitives, codify patterns, and create contribution processes with clear review. Adoption comes from making the system easier than the alternative.',
  ],
  product: [
    'I go back to strategy and user evidence. If the request is loud but unsupported, I dig for the underlying need and usually find a cheaper way to meet it. I communicate the reasoning openly.',
    'I pick one north-star metric, instrument the funnel, and run small experiments. The most meaningful move I made was a 14% activation lift by simplifying onboarding.',
    'I use open questions, silence, and observations rather than leading questions. I also watch usage behavior, which often contradicts what people say.',
    'I rank by impact, confidence, and effort, and I pressure-test with customers. I keep a clear "no" list and revisit it quarterly when the market changes.',
  ],
  marketing: [
    'I ran a lifecycle email program that lifted retention 9 points by segmenting on activation signals and timing sends to usage behavior.',
    'I use last-touch and multi-touch models together, and I sanity-check attribution against incrementality experiments like geo holdouts.',
    'I start with search intent research, build topical clusters around high-value keywords, and earn links by making genuinely useful assets. SEO compounds, so I think in quarters, not weeks.',
    'I cut spend, fixed the tracking, and rebuilt the funnel from the data — the channel went from 2x to 6x ROAS within two quarters.',
  ],
  security: [
    'I map the data flows, identify trust boundaries, and enumerate attack surfaces. I prioritize by likelihood and blast radius, and I always validate with hands-on testing.',
    'A misconfigured service briefly exposed internal data. We rotated credentials, tightened defaults, added guardrails, and did a blameless postmortem that changed how we deploy.',
    'I use security as a service model: fast, low-friction reviews, self-serve guardrails in CI, and clear risk communication. People skip controls that are slow to use.',
    'I apply least privilege everywhere, encrypt in transit and at rest, and use network policies and admission control. I also continuously validate with automated scans and red-team exercises.',
  ],
  hardware: [
    'I design for worst-case timing, not average case: fixed-priority scheduling with provable response times, minimal interrupt handling, and watchdog coverage at every critical step.',
    'I combine unit tests on the algorithms, software-in-the-loop with simulated sensors, hardware-in-the-loop for integration, and fault injection to prove safe behavior on failure.',
    'I fuse multiple sensors with confidence-weighted filtering, and I detect disagreement as a fault signal. The system degrades gracefully and surfaces a clear diagnostic.',
    'A race condition only appeared under temperature stress. I added deterministic scheduling, bounded buffers, and a stress harness that reproduced the fault in minutes.',
  ],
};

interface AptitudeQuestion {
  id: string;
  category: string;
  prompt: string;
  options: string[];
  answer: number;
}
const APTITUDE_QUESTIONS: AptitudeQuestion[] = [
  { id: 'aq1', category: 'logic', prompt: 'All roses are flowers. Some flowers fade quickly. Which statement must be true?', options: ['All roses fade quickly', 'Some flowers are roses', 'Some roses fade quickly', 'No roses fade quickly'], answer: 1 },
  { id: 'aq2', category: 'quantitative', prompt: 'A train travels 240 km in 3 hours. What is its average speed in km/h?', options: ['60', '80', '100', '120'], answer: 1 },
  { id: 'aq3', category: 'logic', prompt: 'If FISH is coded as GHTI, how is BIRD coded?', options: ['CJSE', 'CJSD', 'CHQD', 'CJQE'], answer: 0 },
  { id: 'aq4', category: 'quantitative', prompt: 'What is 15% of 240?', options: ['30', '32', '36', '40'], answer: 2 },
  { id: 'aq5', category: 'logic', prompt: 'In a queue, Priya is 7th from the front and 9th from the back. How many people are in the queue?', options: ['15', '16', '17', '14'], answer: 0 },
  { id: 'aq6', category: 'verbal', prompt: 'Choose the word closest in meaning to "mitigate".', options: ['Aggravate', 'Lessen', 'Ignore', 'Amplify'], answer: 1 },
  { id: 'aq7', category: 'quantitative', prompt: 'If 5 workers build a wall in 12 days, how many days will 8 workers take?', options: ['7.5', '8', '9', '10'], answer: 0 },
  { id: 'aq8', category: 'logic', prompt: 'Which number comes next: 2, 6, 12, 20, 30, ?', options: ['36', '38', '40', '42'], answer: 3 },
  { id: 'aq9', category: 'verbal', prompt: 'Choose the antonym of "ubiquitous".', options: ['Rare', 'Common', 'Pervasive', 'Universal'], answer: 0 },
  { id: 'aq10', category: 'logic', prompt: 'Some engineers are managers. All managers are organized. Which must be true?', options: ['All engineers are organized', 'Some organized people are managers', 'All organized people are engineers', 'No managers are engineers'], answer: 1 },
  { id: 'aq11', category: 'quantitative', prompt: 'If the ratio of cats to dogs is 3:5 and there are 40 animals total, how many dogs are there?', options: ['15', '20', '25', '30'], answer: 2 },
  { id: 'aq12', category: 'verbal', prompt: 'Pick the correctly spelled word.', options: ['Accomodate', 'Acommodate', 'Accommodate', 'Accommodatee'], answer: 2 },
];

interface CodingProblem {
  id: string;
  title: string;
  language: 'typescript' | 'python' | 'go';
  prompt: string;
  code: string;
  aiFeedback: string;
}
const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'lru-cache', title: 'LRU Cache', language: 'typescript',
    prompt: 'Implement an LRU cache with get and put operations in O(1) average time.',
    code: `export function createLRUCache<K, V>(capacity: number) {
  const map = new Map<K, V>();
  return {
    get(key: K): V | undefined {
      if (!map.has(key)) return undefined;
      const value = map.get(key)!;
      map.delete(key);
      map.set(key, value);
      return value;
    },
    put(key: K, value: V): void {
      if (map.has(key)) map.delete(key);
      map.set(key, value);
      if (map.size > capacity) {
        const oldest = map.keys().next().value;
        if (oldest !== undefined) map.delete(oldest);
      }
    },
  };
}`,
    aiFeedback: 'Clean O(1) LRU using Map insertion order. Handles eviction correctly and is easy to read.',
  },
  {
    id: 'two-sum', title: 'Two Sum', language: 'python',
    prompt: 'Given an array of integers and a target, return indices of the two numbers that sum to target.',
    code: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return [seen[complement], i]
        seen[n] = i
    return []`,
    aiFeedback: 'Single-pass hash map solution in O(n). Correct edge handling for the one-pass lookahead.',
  },
  {
    id: 'rate-limiter', title: 'Rate Limiter', language: 'go',
    prompt: 'Implement a token-bucket rate limiter that allows up to N requests per second.',
    code: `package ratelimit

type Limiter struct {
    tokens   float64
    capacity float64
    last     time.Time
    mu       sync.Mutex
}

func (l *Limiter) Allow(now time.Time) bool {
    l.mu.Lock()
    defer l.mu.Unlock()
    l.tokens = math.Min(l.capacity, l.tokens+now.Sub(l.last).Seconds())
    l.last = now
    if l.tokens < 1 {
        return false
    }
    l.tokens--
    return true
}`,
    aiFeedback: 'Correct token-bucket semantics with refill on demand. Concurrency-safe and minimal.',
  },
  {
    id: 'valid-parentheses', title: 'Valid Parentheses', language: 'typescript',
    prompt: 'Given a string containing just the characters (), {}, and [], determine if the input string is valid.',
    code: `export function isValid(s: string): boolean {
  const stack: string[] = [];
  const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  for (const ch of s) {
    if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}`,
    aiFeedback: 'Stack-based validation in O(n) with correct closing-bracket matching and empty-stack handling.',
  },
  {
    id: 'longest-substring', title: 'Longest Substring Without Repeating Characters', language: 'python',
    prompt: 'Given a string, find the length of the longest substring without repeating characters.',
    code: `def length_of_longest_substring(s: str) -> int:
    seen: dict[str, int] = {}
    left = longest = 0
    for right, ch in enumerate(s):
        if ch in seen and seen[ch] >= left:
            left = seen[ch] + 1
        seen[ch] = right
        longest = max(longest, right - left + 1)
    return longest`,
    aiFeedback: 'Sliding-window with a hash map gives O(n) time. Correctly handles the left-pointer jump.',
  },
  {
    id: 'coin-change', title: 'Coin Change', language: 'go',
    prompt: 'Return the fewest number of coins needed to make up a given amount, or -1 if impossible.',
    code: `package coinchange

func CoinChange(coins []int, amount int) int {
    dp := make([]int, amount+1)
    for i := 1; i <= amount; i++ {
        dp[i] = amount + 1
        for _, c := range coins {
            if c <= i && dp[i-c]+1 < dp[i] {
                dp[i] = dp[i-c] + 1
            }
        }
    }
    if dp[amount] > amount {
        return -1
    }
    return dp[amount]
}`,
    aiFeedback: 'Bottom-up DP with O(amount * len(coins)) time. Correctly returns -1 for impossible amounts.',
  },
];

const EVALUATION_REASONING_HIRE = [
  'Strong signal across resume, assessment, and interview. Technical depth matches the level of the role.',
  'Candidate demonstrated excellent problem-solving and clear communication. Scores clear the threshold with margin.',
  'Top-decile performance on the coding assessment and a structured approach to system design questions.',
  'Deep domain expertise paired with strong collaboration signals. Recommend advancing to offer.',
  'Consistently high scores across all stages with no bias flags detected. Confident hire.',
];

const EVALUATION_REASONING_REJECT = [
  'Resume and assessment signals fell below the minimum threshold for this seniority level.',
  'Communication in the interview was weak and technical depth did not match the role requirements.',
  'Coding assessment pass rate was below the passing bar with several incorrect edge cases.',
  'Overall composite score did not clear the configured threshold. No immediate follow-up planned.',
  'Domain experience did not align closely enough with the role. Candidate is a potential fit for future openings.',
];

/* ============================================================
 * 8. GENERATION HELPERS
 * ============================================================ */
const DOMAIN_SALARY_USD: Record<Domain, [number, number]> = {
  frontend: [110, 185],
  backend: [115, 210],
  data: [120, 230],
  infra: [115, 200],
  mobile: [110, 180],
  design: [95, 165],
  product: [110, 190],
  marketing: [80, 150],
  security: [110, 190],
  hardware: [120, 210],
};

/** Approx USD annual for a job template's salary band, so offers are realistic across currencies. */
const CURRENCY_TO_USD: Record<LocationDef['currency'], (min: number, max: number) => [number, number]> = {
  usd: (min, max) => [min * 1000, max * 1000],
  gbp: (min, max) => [min * 1000 * 1.27, max * 1000 * 1.27],
  eur: (min, max) => [min * 1000 * 1.08, max * 1000 * 1.08],
  aud: (min, max) => [min * 1000 * 0.66, max * 1000 * 0.66],
  sgd: (min, max) => [min * 1000 * 0.74, max * 1000 * 0.74],
  inr: (min, max) => [min * 12000, max * 12000],
};

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function weightedPick<T>(items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

const usedNames = new Set<string>();
const usedEmails = new Set<string>();

function uniqueFullName(): { first: string; last: string; full: string } {
  for (;;) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const full = `${first} ${last}`;
    if (!usedNames.has(full)) {
      usedNames.add(full);
      return { first, last, full };
    }
  }
}

function uniqueEmail(first: string, last: string, forced?: string): string {
  const base = slugifyName(`${first} ${last}`);
  if (forced) {
    usedEmails.add(forced);
    return forced;
  }
  let n = 1;
  let email = `${base}@${pick(EMAIL_PROVIDERS)}`;
  while (usedEmails.has(email)) email = `${base}${n++}@${pick(EMAIL_PROVIDERS)}`;
  usedEmails.add(email);
  return email;
}

function seniority(yoe: number): string {
  if (yoe >= 8) return 'Staff';
  if (yoe >= 5) return 'Senior';
  if (yoe >= 3) return 'Mid-level';
  return 'Early-career';
}

function buildBio(domainLabel: string): string {
  let intro = pick(BIO_INTROS);
  if (intro.endsWith(' in')) intro = `${intro} ${domainLabel.toLowerCase()}.`;
  return `${intro}. ${pick(BIO_MIDDLES)}`;
}

function buildTranscript(job: JobRow, candidateName: string): Array<{ speaker: string; timestamp: string; text: string }> {
  const turns: Array<{ speaker: string; timestamp: string; text: string }> = [];
  let sec = 20;
  const push = (speaker: 'interviewer' | 'candidate', text: string) => {
    const mm = String(Math.floor(sec / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    turns.push({ speaker, timestamp: `00:${mm}:${ss}`, text });
    sec += randInt(16, 40);
  };
  push('interviewer', `Welcome${candidateName ? `, ${candidateName}` : ''}! Let's begin. ${pick(INTERVIEW_INTRO_QUESTION)}`);
  push('candidate', pick(INTERVIEW_ANSWERS[job.domain]));
  for (const q of pickN(INTERVIEW_QUESTIONS[job.domain], 2)) {
    push('interviewer', q);
    push('candidate', pick(INTERVIEW_ANSWERS[job.domain]));
  }
  push('interviewer', pick(INTERVIEW_CLOSING));
  return turns;
}

function buildProctorFlags(clean: boolean): unknown {
  if (clean) {
    return {
      gazeOffScreenCount: randInt(0, 2),
      multiplePersonsDetected: false,
      audioDisruptionCount: randInt(0, 1),
      tabSwitchCount: randInt(0, 2),
      proctorClean: true,
    };
  }
  return {
    gazeOffScreenCount: randInt(4, 9),
    multiplePersonsDetected: chance(0.4),
    audioDisruptionCount: randInt(3, 6),
    tabSwitchCount: randInt(4, 8),
    proctorClean: false,
  };
}

function buildEngagementSignal(): unknown {
  return {
    engagementIndex: randInt(62, 96),
    speakingClarity: randInt(70, 98),
    pace: randInt(55, 95),
    fillerWordRate: randFloat(0.4, 3.2),
  };
}

function buildSentimentReport(decision: 'hire' | 'reject' | 'hold_for_review'): unknown {
  const positive = decision === 'hire';
  return {
    overall: positive ? 'positive' : decision === 'hold_for_review' ? 'neutral' : 'negative',
    toneScore: randInt(positive ? 72 : 38, positive ? 96 : 62),
    highlights: pickN(
      ['clear structured answers', 'strong energy and engagement', 'concise technical explanations', 'good question-asking', 'nervous but recovered well', 'some vague answers', 'low enthusiasm', 'rambling responses'],
      2,
    ),
  };
}

function buildBiasReport(flagged: boolean): unknown {
  return {
    genderBiasDetected: flagged ? chance(0.5) : false,
    nameOriginBiasDetected: flagged ? chance(0.4) : false,
    ageBiasDetected: flagged ? chance(0.4) : false,
    educationBiasDetected: flagged ? chance(0.5) : false,
    fairnessScore: flagged ? randFloat(61, 78) : randFloat(96, 99.9),
    note: flagged ? 'Manual review recommended before decision.' : 'No bias signals detected.',
  };
}

function buildAssessmentQuestions(testType: string): unknown[] {
  if (testType === 'coding') {
    const p = pick(CODING_PROBLEMS);
    return [{ id: p.id, title: p.title, prompt: p.prompt, language: p.language }];
  }
  const qs = pickN(APTITUDE_QUESTIONS, 10).map((q) => ({
    id: q.id,
    category: q.category,
    prompt: q.prompt,
    options: q.options,
  }));
  return qs;
}

function buildCodingSubmission(problem: CodingProblem, score: number): {
  language: string;
  code: string;
  test_results: unknown;
  pass_rate: number;
  execution_time_ms: number;
  memory_mb: number;
  complexity_score: number;
  ai_feedback: string;
} {
  const passRate = Math.min(1, score / 100 + randFloat(-0.12, 0.05));
  return {
    language: problem.language,
    code: problem.code,
    test_results: {
      total: 12,
      passed: Math.round(12 * passRate),
      failed: 12 - Math.round(12 * passRate),
    },
    pass_rate: passRate,
    execution_time_ms: randInt(8, 240),
    memory_mb: randFloat(12, 160),
    complexity_score: randInt(72, 98),
    ai_feedback: problem.aiFeedback,
  };
}

function offerSalary(job: JobRow): number {
  const [lo, hi] = CURRENCY_TO_USD[job.currency](job.salaryBand[0], job.salaryBand[1]);
  return Math.round(randFloat(lo * 1.02, hi * 1.08) / 1000) * 1000;
}

function equityForSalary(salaryUsd: number): string {
  const pct = (salaryUsd / 200000) * 0.25;
  return `${pct.toFixed(2)}% ESOPs`;
}

const AGENT_NAMES = [
  'sourcing-agent', 'screening-agent', 'aptitude-agent', 'coding-agent',
  'voice-interview-agent', 'evaluator-agent', 'bias-audit-agent', 'decision-agent',
  'offer-agent', 'notification-agent', 'prep-content-agent', 'talent-pool-agent',
];

const AGENT_ACTIONS = [
  'Scored candidate resume against job rubric',
  'Enqueued aptitude assessment for candidate',
  'Generated interview questions from role profile',
  'Computed composite score from evaluation signals',
  'Ran fairness and bias audit on evaluation',
  'Produced hiring recommendation',
  'Triggered offer letter generation',
  'Synced candidate into organization talent pool',
  'Created prep content for role',
];

/* ============================================================
 * 9. RUNTIME ROW TYPES
 * ============================================================ */
interface OrgRow {
  id: string;
  def: CompanyDef;
  name: string;
}
interface HrRow {
  id: string;
  name: string;
  email: string;
  orgId: string;
  orgName: string;
}
interface JobRow {
  id: string;
  title: string;
  orgId: string;
  orgName: string;
  domain: Domain;
  city: string;
  salaryBand: [number, number];
  currency: LocationDef['currency'];
  exp: string;
  skills: string[];
  minScore: number;
  status: string;
}
interface CandidateRow {
  userId: string;
  profileId: string;
  name: string;
  email: string;
  skills: string[];
  domain: Domain;
  expectedSalary: number;
  location: string;
}

/* ============================================================
 * 10. DEMO ACCOUNTS (historical logins preserved)
 * ============================================================ */
const DEMO_HR = [
  { email: 'hr@acmecloud.io', name: 'Sofia Reyes', title: 'Head of Talent Acquisition' },
  { email: 'recruiter@nexusai.dev', name: 'Daniel Kim', title: 'Senior Technical Recruiter' },
  { email: 'talent@stripeflow.com', name: 'Amelia Turner', title: 'Talent Acquisition Lead' },
];

interface DemoCandidate {
  email: string;
  name: string;
  domain: Domain;
  skills: string[];
  roles: string[];
  salary: number;
  notice: string;
  auth: string;
  proud: string;
  values: string[];
}
const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    email: 'candidate.alex@gmail.com', name: 'Alex Rivers', domain: 'backend',
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'GraphQL', 'Docker'],
    roles: ['Senior Full-Stack Engineer', 'Frontend Tech Lead'],
    salary: 165000, notice: '2 weeks', auth: 'US Citizen',
    proud: 'Architected a micro-frontend platform that reduced page-load latency by 45% for 2M daily active users.',
    values: ['Technical Autonomy', 'Continuous Mentorship', 'High Velocity Shipping'],
  },
  {
    email: 'candidate.priya@yahoo.com', name: 'Priya Sharma', domain: 'data',
    skills: ['Python', 'PyTorch', 'CUDA', 'FastAPI', 'LangChain', 'Kubernetes'],
    roles: ['AI Research Engineer', 'ML Infrastructure Engineer'],
    salary: 195000, notice: '1 month', auth: 'H-1B Visa',
    proud: 'Trained and quantized a 70B parameter LLM to 4-bit for low-latency edge inference with AWQ.',
    values: ['Research Rigor', 'Open Source Contribution', 'Ethical AI Development'],
  },
  {
    email: 'candidate.marcus@outlook.com', name: 'Marcus Johnson', domain: 'backend',
    skills: ['Go', 'Rust', 'Kubernetes', 'gRPC', 'Distributed Systems', 'Kafka'],
    roles: ['Staff Backend Engineer', 'Infrastructure Architect'],
    salary: 210000, notice: 'Immediate', auth: 'US Citizen',
    proud: 'Built a zero-downtime event streaming pipeline handling 500,000 events/second during Black Friday surge.',
    values: ['System Reliability', 'Clean Code Principles', 'Ownership Culture'],
  },
  {
    email: 'candidate.elena@dev.io', name: 'Elena Petrova', domain: 'frontend',
    skills: ['React', 'Next.js', 'TailwindCSS', 'WebGL', 'Three.js', 'Performance Optimization'],
    roles: ['Staff Frontend Engineer', 'UI/UX Systems Specialist'],
    salary: 175000, notice: '2 weeks', auth: 'Green Card Holder',
    proud: 'Created a custom WebGL particle renderer and a design-system component library used across 12 product lines.',
    values: ['Design Precision', 'Accessibility Standards', 'User Delight'],
  },
  {
    email: 'candidate.david@mit.edu', name: 'David Novak', domain: 'backend',
    skills: ['Python', 'C++', 'Algorithms', 'Distributed DBs', 'System Design'],
    roles: ['Backend Software Engineer', 'Core Database Engineer'],
    salary: 155000, notice: 'Immediate', auth: 'OPT / EAD',
    proud: 'Implemented a lock-free concurrent B-Tree index in C++ achieving 3x throughput over standard locks.',
    values: ['Algorithmic Efficiency', 'Deep Technical Understanding', 'Code Elegance'],
  },
  {
    email: 'candidate.sophia@stanford.edu', name: 'Sophia Laurent', domain: 'backend',
    skills: ['TypeScript', 'Python', 'AWS', 'Serverless', 'PostgreSQL', 'Redis'],
    roles: ['Full-Stack Developer', 'Product Engineer'],
    salary: 160000, notice: '3 weeks', auth: 'US Citizen',
    proud: 'Built a collaborative real-time whiteboarding application using WebSockets and CRDTs.',
    values: ['Product-Centric Engineering', 'Cross-Functional Collaboration', 'Agile Velocity'],
  },
];

/* ============================================================
 * 11. PIPELINE FUNNEL
 * ============================================================ */
type AppStatus =
  | 'applied' | 'screening' | 'screening_completed' | 'assessment'
  | 'interview_scheduled' | 'interviewed' | 'evaluation' | 'hr_round'
  | 'decided' | 'offered' | 'accepted' | 'rejected' | 'withdrawn';

const FUNNEL: Array<[AppStatus, number]> = [
  ['applied', 112],
  ['screening', 96],
  ['screening_completed', 64],
  ['assessment', 72],
  ['interview_scheduled', 64],
  ['interviewed', 56],
  ['evaluation', 40],
  ['hr_round', 32],
  ['decided', 24],
  ['offered', 12],
  ['accepted', 20],
  ['rejected', 160],
  ['withdrawn', 48],
];

const APPLIED_WINDOW: Record<AppStatus, [number, number]> = {
  applied: [0, 7],
  screening: [2, 14],
  screening_completed: [5, 21],
  assessment: [8, 28],
  interview_scheduled: [10, 30],
  interviewed: [15, 40],
  evaluation: [20, 50],
  hr_round: [25, 60],
  decided: [30, 70],
  offered: [35, 75],
  accepted: [45, 90],
  rejected: [1, 60],
  withdrawn: [1, 30],
};

const ENGINEERING_DOMAINS: Domain[] = ['frontend', 'backend', 'data', 'infra', 'mobile', 'hardware', 'security'];

async function main(): Promise<void> {
  const startedAt = Date.now();
  const log = (msg: string) => console.log(`  ${msg}`);

  console.log('🧹 Cleaning existing tables…');
  await prisma.talentBookmark.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.prepContent.deleteMany({});
  await prisma.mockSession.deleteMany({});
  await prisma.agentLog.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.codingSubmission.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.candidateProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  /* ---------- 10. Organizations ---------- */
  console.log('🏢 Creating organizations…');
  const orgRows: OrgRow[] = [];
  for (const def of COMPANIES) {
    const org = await prisma.organization.create({
      data: {
        name: def.name,
        logo_url: orgLogo(def),
        industry: def.industry,
        size: def.size,
        settings: def.settings,
      },
    });
    orgRows.push({ id: org.id, def, name: def.name });
  }

  /* ---------- HR users ---------- */
  console.log('👤 Creating HR users…');
  const hrRows: HrRow[] = [];
  const demoHrByOrg = new Map<string, (typeof DEMO_HR)[number]>();
  orgRows.slice(0, 3).forEach((org, i) => demoHrByOrg.set(org.name, DEMO_HR[i]));
  for (const org of orgRows) {
    const demo = demoHrByOrg.get(org.name);
    for (let i = 0; i < org.def.hrTeamSize; i++) {
      const name = i === 0 && demo ? demo.name : uniqueFullName().full;
      const email = i === 0 && demo ? demo.email : uniqueEmail(name.split(' ')[0], name.split(' ')[1] ?? '');
      const title = i === 0 && demo ? demo.title : pick(HR_TITLES);
      const loc = pick(LOCATIONS);
      const avatarSeed = pick(AVATAR_SEEDS);
      const user = await prisma.user.create({
        data: {
          email,
          password_hash: passwordHash,
          role: 'hr',
          org_id: org.id,
          profile: {
            name,
            avatarUrl: HR_AVATAR(avatarSeed),
            title,
            timezone: loc.timezone,
            location: `${loc.city}, ${loc.country}`,
            linkedinUrl: `https://linkedin.com/in/${slugifyName(name)}`,
            phone: `+1${randInt(200, 989)}${randInt(100, 999)}${randInt(1000, 9999)}`,
            specialties: pickN(HR_SPECIALTIES, 2),
            languages: ['English'],
          },
        },
      });
      hrRows.push({ id: user.id, name, email, orgId: org.id, orgName: org.name });
    }
  }

  /* ---------- Jobs ---------- */
  console.log('💼 Creating jobs…');
  const jobRows: JobRow[] = [];
  for (const tpl of JOB_TEMPLATES) {
    const org = orgRows.find((o) => o.name === tpl.org)!;
    const loc = locationForCity(tpl.city);
    const skills = buildJobSkills(tpl);
    const job = await prisma.job.create({
      data: {
        org_id: org.id,
        title: tpl.title,
        description: buildJobDescription(tpl, org.def),
        rubric: tpl.rubric,
        thresholds: { minScore: tpl.minScore, autoOffer: tpl.autoOffer },
        status: tpl.status,
        location: chance(0.3) ? `${tpl.city} · Remote` : tpl.city,
        salary: SALARY_STRINGS[loc.currency](tpl.salary[0], tpl.salary[1]),
        experienceLevel: tpl.exp,
        department: DOMAINS.find((d) => d.key === tpl.domain)!.label,
        skills,
        stages: buildJobStages(),
        assessmentConfig: buildAssessmentConfig(),
      },
    });
    jobRows.push({
      id: job.id,
      title: tpl.title,
      orgId: org.id,
      orgName: org.name,
      domain: tpl.domain,
      city: tpl.city,
      salaryBand: tpl.salary,
      currency: loc.currency,
      exp: tpl.exp,
      skills,
      minScore: tpl.minScore,
      status: tpl.status,
    });
  }

  /* ---------- Candidates ---------- */
  console.log('🎓 Creating candidates…');
  const candidates: CandidateRow[] = [];
  const usedDemoNames = new Set(DEMO_CANDIDATES.map((d) => d.name));
  usedNames.clear();
  usedNames.add('Alex Rivers');
  usedNames.add('Priya Sharma');
  usedNames.add('Marcus Johnson');
  usedNames.add('Elena Petrova');
  usedNames.add('David Novak');
  usedNames.add('Sophia Laurent');
  usedEmails.clear();
  DEMO_CANDIDATES.forEach((d) => usedEmails.add(d.email));

  const createCandidateProfile = async (name: string, email: string, def: Partial<DemoCandidate>): Promise<CandidateRow> => {
    const domain: Domain = def.domain ?? weightedPick(DOMAINS.map((d) => d.key), [14, 16, 14, 9, 5, 7, 7, 4, 3, 6]);
    const user = await prisma.user.create({ data: { email, password_hash: passwordHash, role: 'candidate' } });
    const domainPool = DOMAINS.find((d) => d.key === domain)!;
    const skills = def.skills ?? pickN(domainPool.skills, randInt(7, 10));
    const targetRoles = def.roles ?? pickN(domainPool.roles, randInt(1, 3));
    const yoe = def.salary ? Math.max(4, Math.round(def.salary / 20000)) : randInt(1, 14);
    const [lo, hi] = DOMAIN_SALARY_USD[domain];
    const t = Math.min(1, yoe / 12);
    const base = Math.round(lo + t * (hi - lo));
    const expectedSalary = def.salary ?? randInt(base - 6, base + 9) * 1000;
    const loc = pick(LOCATIONS);
    const workMode = pick(WORK_MODES);
    const notice = def.notice ?? pick(NOTICE_PERIODS);
    const auth = def.auth ?? pick(WORK_AUTH);
    const headline = `${seniority(yoe)} ${pick(targetRoles)} · ${yoe}+ yrs`;
    const firstName = name.split(' ')[0];
    const lastName = name.split(' ').slice(1).join(' ');

    const profile = await prisma.candidateProfile.create({
      data: {
        user_id: user.id,
        full_name: name,
        headline,
        phone: `+1${randInt(200, 989)}${randInt(100, 999)}${randInt(1000, 9999)}`,
        location: `${loc.city}, ${loc.country}`,
        timezone: loc.timezone,
        resume_url: `https://storage.nextround.dev/resumes/${user.id}/resume.pdf`,
        linkedin_url: `https://linkedin.com/in/${slugifyName(name)}`,
        github_url: `https://github.com/${slugifyName(firstName)}${lastName ? '.' + slugifyName(lastName) : ''}`,
        portfolio_url: chance(0.5) ? `https://${slugifyName(firstName)}.dev` : null,
        bio: buildBio(domainPool.label),
        skills,
        target_roles: targetRoles,
        years_of_experience: yoe,
        work_mode: workMode,
        current_ctc: Math.round((expectedSalary * randFloat(0.78, 0.92)) / 1000) * 1000,
        target_locations: pickN(LOCATIONS.map((l) => l.city), randInt(2, 3)),
        expected_salary: expectedSalary,
        notice_period: notice,
        work_authorization: auth,
        proud_project: def.proud ?? pick(PROUD_PROJECTS),
        work_values: def.values ?? pickN(WORK_VALUES, randInt(3, 4)),
        availability: {
          availableIn: notice,
          preferredHours: pick(['9-5', '10-6', 'Flexible']),
          remotePreferred: workMode === 'Remote',
          relocate: chance(0.45),
          timezone: loc.timezone,
        },
        settings: {
          theme: pick(['dark', 'light']),
          glassmorphism: chance(0.7),
          compactDensity: chance(0.35),
          emailNotifications: chance(0.85),
          smsReminders: chance(0.5),
          aiScoreReports: chance(0.7),
          dailyDigest: chance(0.75),
          statusUpdates: chance(0.9),
          digestFrequency: pick(['daily', 'weekly', 'never']),
          defaultVoice: pick(['Serena', 'Alloy', 'Nova', 'Echo', 'Onyx']),
          liveTranscript: chance(0.8),
          autoSubmitTranscript: chance(0.65),
          timezone: loc.timezone,
          privacyMode: chance(0.25),
          visibility: pick(['public', 'private', 'recruiters_only']),
          hideSalary: chance(0.3),
          twoFactor: chance(0.35),
        },
      },
    });
    return {
      userId: user.id,
      profileId: profile.id,
      name,
      email,
      skills,
      domain,
      expectedSalary,
      location: loc.city,
    };
  };

  // Demo candidates first (their logins must keep working).
  for (const demo of DEMO_CANDIDATES) {
    candidates.push(await createCandidateProfile(demo.name, demo.email, demo));
  }
  // Generated candidates.
  while (candidates.length < N_CANDIDATES) {
    const { full } = uniqueFullName();
    const first = full.split(' ')[0];
    const last = full.split(' ').slice(1).join(' ');
    const email = uniqueEmail(first, last);
    candidates.push(await createCandidateProfile(full, email, {}));
  }

  /* ---------- Applications ---------- */
  console.log('📋 Creating applications (realistic funnel)…');

  // Per-candidate application counts tuned to sum exactly to N_APPLICATIONS.
  const counts: number[] = [];
  let total = 0;
  for (let i = 0; i < candidates.length; i++) {
    const r = rng();
    let c: number;
    if (r < 0.12) c = randInt(1, 2);
    else if (r < 0.5) c = randInt(4, 5);
    else if (r < 0.86) c = randInt(6, 7);
    else c = randInt(8, 10);
    counts.push(c);
    total += c;
  }
  let diff = total - N_APPLICATIONS;
  let ci = 0;
  while (diff > 0) {
    if (counts[ci] > 1) {
      counts[ci]--;
      diff--;
    }
    ci = (ci + 1) % counts.length;
  }
  ci = 0;
  while (diff < 0) {
    if (counts[ci] < 10) {
      counts[ci]++;
      diff++;
    }
    ci = (ci + 1) % counts.length;
  }

  // Build (candidate, job) pairs preferring skill-matched jobs.
  const pairs: Array<{ candidate: CandidateRow; job: JobRow }> = [];
  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    const preferred = [...shuffle(jobRows.filter((j) => j.domain === cand.domain)), ...shuffle(jobRows.filter((j) => j.domain !== cand.domain))];
    for (const job of preferred.slice(0, counts[i])) pairs.push({ candidate: cand, job });
  }

  // Assign statuses by funnel counts.
  const statusPool: AppStatus[] = [];
  for (const [status, n] of FUNNEL) for (let k = 0; k < n; k++) statusPool.push(status);
  shuffle(statusPool);

  const interviewRows: unknown[] = [];
  const assessmentRows: unknown[] = [];
  const codingRows: unknown[] = [];
  const evaluationRows: unknown[] = [];
  const offerRows: unknown[] = [];
  let offersMade = 0;

  for (let i = 0; i < pairs.length; i++) {
    const status = statusPool[i];
    const { candidate, job } = pairs[i];
    const [minAgo, maxAgo] = APPLIED_WINDOW[status];
    const appliedAt = randomPastDate(minAgo, maxAgo);

    let depth: number;
    let decision: 'hire' | 'reject' | 'hold_for_review' = 'hold_for_review';
    if (status === 'rejected') {
      const r = rng();
      if (r < 0.45) depth = 0;
      else if (r < 0.75) depth = 3; // failed assessment
      else if (r < 0.9) depth = 5; // failed interview
      else depth = 6; // rejected at evaluation
      decision = 'reject';
    } else if (status === 'withdrawn') {
      depth = 0;
    } else {
      depth = { applied: 0, screening: 1, screening_completed: 2, assessment: 3, interview_scheduled: 4, interviewed: 5, evaluation: 6, hr_round: 7, decided: 8, offered: 9, accepted: 10 }[status]!;
      if (status === 'accepted' || status === 'offered' || (status === 'decided' && chance(0.75))) decision = 'hire';
    }

    const hasAssessment = depth >= 3;
    const hasInterview = depth >= 4;
    const hasEvaluation = depth >= 6;

    // hr_round fields
    let hrRoundStatus: string | undefined;
    let hrRoundScheduledAt: Date | undefined;
    let hrRoundCompletedAt: Date | undefined;
    if (status === 'hr_round') {
      hrRoundStatus = 'scheduled';
      hrRoundScheduledAt = randomFutureDate(1, 10);
    } else if (status === 'decided' || status === 'offered' || status === 'accepted') {
      hrRoundStatus = chance(0.82) ? 'passed' : 'failed';
      hrRoundCompletedAt = randomPastDate(5, 30);
    }

    const app = await prisma.application.create({
      data: {
        candidate_id: candidate.profileId,
        job_id: job.id,
        status,
        hr_round_status: hrRoundStatus as never,
        hr_round_scheduled_at: hrRoundScheduledAt,
        hr_round_completed_at: hrRoundCompletedAt,
        applied_at: appliedAt,
      },
    });

    /* --- Assessment --- */
    if (hasAssessment) {
      const isEngineering = ENGINEERING_DOMAINS.includes(job.domain);
      const testType = isEngineering ? (chance(0.55) ? 'coding' : 'aptitude') : weightedPick(['aptitude', 'video'], [70, 30]);
      const pastAssessment = depth >= 4;
      const asStatus = status === 'rejected' ? 'completed' : pastAssessment ? 'completed' : weightedPick(['pending', 'in_progress', 'completed'], [30, 40, 30]);
      const score = asStatus === 'completed' ? (status === 'rejected' ? randInt(35, 68) : status === 'accepted' || status === 'offered' ? randInt(82, 98) : randInt(55, 96)) : null;
      const questions = buildAssessmentQuestions(testType);

      assessmentRows.push({
        application_id: app.id,
        test_type: testType,
        questions,
        status: asStatus,
        score,
        responses:
          asStatus === 'completed' && testType !== 'coding'
            ? {
                startedAt: appliedAt.toISOString(),
                submittedAt: daysAgo(randInt(0, 2)).toISOString(),
                answers: APTITUDE_QUESTIONS.map((q) => ({
                  questionId: q.id,
                  selectedIndex: rng() < 0.7 ? q.answer : randInt(0, 3),
                  correct: rng() < 0.7,
                })),
              }
            : null,
        category_breakdown:
          asStatus === 'completed'
            ? { logic: randInt(50, 98), quantitative: randInt(50, 98), verbal: randInt(50, 98) }
            : null,
        created_at: appliedAt,
      });

      // Coding submission
      if (testType === 'coding' && asStatus === 'completed') {
        const problem = pick(CODING_PROBLEMS);
        const submission = buildCodingSubmission(problem, score!);
        codingRows.push({
          application_id: app.id,
          language: problem.language,
          code: problem.code,
          test_results: submission.test_results,
          pass_rate: submission.pass_rate,
          execution_time_ms: submission.execution_time_ms,
          memory_mb: submission.memory_mb,
          complexity_score: submission.complexity_score,
          status: 'completed',
          complexity: score! >= 85 ? 'optimal' : score! >= 70 ? 'acceptable' : 'suboptimal',
          ai_feedback: problem.aiFeedback,
          created_at: daysAgo(randInt(1, 5)),
        });
      }
    }

    /* --- Interview --- */
    if (hasInterview) {
      if (status === 'interview_scheduled') {
        interviewRows.push({
          application_id: app.id,
          scheduled_at: randomFutureDate(1, 12),
          video_consent: chance(0.9),
          status: 'scheduled',
          created_at: appliedAt,
        });
      } else {
        const flagged = status === 'rejected' ? chance(0.3) : chance(0.05);
        interviewRows.push({
          application_id: app.id,
          scheduled_at: randomPastDate(Math.max(1, minAgo - 5), maxAgo),
          transcript: buildTranscript(job, candidate.name),
          proctor_flags: buildProctorFlags(!flagged),
          engagement_signal: buildEngagementSignal(),
          sentiment_report: buildSentimentReport(decision),
          video_consent: chance(0.9),
          status: 'completed',
          created_at: appliedAt,
        });
      }
    }

    /* --- Evaluation --- */
    if (hasEvaluation) {
      const resumeScore = status === 'rejected' ? randInt(40, 72) : randInt(64, 98);
      const interviewScore = randInt(status === 'rejected' ? 42 : 55, status === 'rejected' ? 68 : 96);
      const aptitudeScore = randInt(status === 'rejected' ? 40 : 55, status === 'rejected' ? 65 : 95);
      const composite = Math.round((resumeScore * 0.3 + interviewScore * 0.3 + aptitudeScore * 0.4 + randInt(-3, 3)) / 1);
      const biasFlag = decision === 'hire' ? chance(0.02) : chance(0.05);
      const evalDecision = status === 'rejected' ? 'reject' : decision === 'hire' ? 'hire' : 'hold_for_review';
      evaluationRows.push({
        application_id: app.id,
        stage: status === 'accepted' || status === 'offered' || status === 'decided' ? 'final_hiring_decision' : 'ai_evaluation_node',
        resume_score: resumeScore,
        interview_score: interviewScore,
        aptitude_score: aptitudeScore,
        coding_score: hasAssessment && assessmentRows.length ? randInt(50, 96) : null,
        composite_score: composite,
        confidence: randFloat(0.78, 0.97),
        bias_flag: biasFlag,
        bias_report: buildBiasReport(biasFlag),
        decision: evalDecision as never,
        reasoning: evalDecision === 'reject' ? pick(EVALUATION_REASONING_REJECT) : pick(EVALUATION_REASONING_HIRE),
        created_at: daysAgo(randInt(2, 10)),
      });
    }

    /* --- Offer --- */
    if (status === 'offered' || status === 'accepted' || (status === 'decided' && decision === 'hire')) {
      const salary = offerSalary(job);
      const startDate = randomFutureDate(10, 30);
      const isAccepted = status === 'accepted';
      offerRows.push({
        application_id: app.id,
        role_title: job.title,
        salary,
        equity: equityForSalary(salary),
        start_date: startDate,
        valid_until: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: isAccepted ? 'accepted' : 'pending',
        signature_svg: isAccepted
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="60"><text x="12" y="34" font-family="cursive" font-size="22" fill="#1f2937">${candidate.name}</text></svg>`
          : null,
        magic_link_token: `offer_${job.id.slice(0, 6)}_${candidate.profileId.slice(0, 6)}`,
        offer_letter_content: `Official Employment Offer — ${job.title} at ${job.orgName}.\n\nDear ${candidate.name},\n\nWe are delighted to extend this offer for the ${job.title} role. Base salary $${salary.toLocaleString()} with ${equityForSalary(salary)} equity, subject to standard terms and conditions.`,
        created_at: daysAgo(randInt(3, 12)),
      });
      offersMade++;
    }
  }

  await prisma.assessment.createMany({ data: assessmentRows as never });
  await prisma.codingSubmission.createMany({ data: codingRows as never });
  await prisma.interview.createMany({ data: interviewRows as never });
  await prisma.evaluation.createMany({ data: evaluationRows as never });
  await prisma.offer.createMany({ data: offerRows as never });

  /* ---------- Extras ---------- */
  console.log('🔔 Creating notifications, bookmarks, mock sessions, prep content & agent logs…');

  // Notifications for HR.
  const HR_NOTIFICATIONS = [
    { title: 'New applicant', message: 'A new candidate matched your open role and entered screening.', type: 'shortlist' },
    { title: 'Assessment completed', message: 'A candidate completed the AI voice interview — review the scorecard.', type: 'info' },
    { title: 'Offer accepted', message: 'A candidate signed the offer letter. Onboarding checklist is ready.', type: 'system' },
    { title: 'Interview scheduled', message: 'An AI voice interview was scheduled for next week.', type: 'interview' },
    { title: 'Talent pool update', message: '3 high-signal candidates were added to your talent pool.', type: 'shortlist' },
    { title: 'Coding assessment passed', message: 'A candidate cleared the coding round with a strong pass rate.', type: 'info' },
    { title: 'Decision ready', message: 'The evaluator agent finalized a recommendation — review before it advances.', type: 'system' },
  ] as const;
  const CAND_NOTIFICATIONS = [
    { title: 'Application received', message: 'Your application was received and is being reviewed by the team.', type: 'application' },
    { title: 'Assessment ready', message: 'Your skills assessment is ready to take. Complete it within 72 hours.', type: 'assessment' },
    { title: 'Interview scheduled', message: 'Your AI voice interview is scheduled. Prepare with mock sessions.', type: 'interview' },
    { title: 'Offer update', message: 'Your offer letter is ready to review and sign.', type: 'offer' },
    { title: 'Status update', message: 'We updated the status of one of your applications.', type: 'application' },
    { title: 'Prep content ready', message: 'New interview prep content was added for your target roles.', type: 'prep' },
  ] as const;

  const notificationRows: unknown[] = [];
  for (const hr of hrRows) {
    for (let k = 0, n = randInt(2, 4); k < n; k++) {
      const ntf = pick(HR_NOTIFICATIONS);
      notificationRows.push({
        user_id: hr.id,
        title: ntf.title,
        message: ntf.message,
        type: ntf.type,
        read: chance(0.6),
        created_at: randomPastDate(0, 14),
      });
    }
  }
  for (const cand of candidates) {
    for (let k = 0, n = randInt(2, 4); k < n; k++) {
      const ntf = pick(CAND_NOTIFICATIONS);
      notificationRows.push({
        user_id: cand.userId,
        title: ntf.title,
        message: ntf.message,
        type: ntf.type,
        read: chance(0.55),
        created_at: randomPastDate(0, 20),
      });
    }
  }
  await prisma.notification.createMany({ data: notificationRows as never });

  // Talent bookmarks: HR saves promising candidates.
  const bookmarkRows: unknown[] = [];
  const bookmarkSeen = new Set<string>();
  const bookmarkCandidates = candidates.filter((c) => c.domain !== 'marketing');
  for (let k = 0; k < 60 && bookmarkCandidates.length; k++) {
    const org = pick(orgRows);
    const cand = pick(bookmarkCandidates);
    const key = `${org.id}|${cand.profileId}`;
    if (bookmarkSeen.has(key)) continue;
    bookmarkSeen.add(key);
    const job = pick(jobRows.filter((j) => j.domain === cand.domain)) ?? jobRows[0];
    bookmarkRows.push({
      org_id: org.id,
      candidate_id: cand.profileId,
      job_id: job.id,
      notes: pick([
        'Strong match — consider for upcoming roles.',
        'High-signal candidate. Fast-track on next opening.',
        'Great culture fit, follow up next quarter.',
        'Impressive portfolio — shortlist for design review.',
      ]),
      created_at: randomPastDate(0, 60),
    });
  }
  await prisma.talentBookmark.createMany({ data: bookmarkRows as never });

  // Mock sessions for a subset of candidates.
  const mockRows: unknown[] = [];
  const mockCandidates = pickN(candidates, Math.floor(candidates.length * 0.55));
  for (const cand of mockCandidates) {
    const count = randInt(1, 3);
    for (let k = 0; k < count; k++) {
      const target = pick(COMPANIES);
      const targetRole = pick(DOMAINS.find((d) => d.key === cand.domain)!.roles);
      const completed = chance(0.65);
      const score = completed ? randFloat(58, 92) : null;
      mockRows.push({
        candidate_id: cand.profileId,
        target_company: target.name,
        target_role: targetRole,
        difficulty: pick(['easy', 'medium', 'hard']),
        type: weightedPick(['mock', 'interview', 'resume', 'behavioral'], [45, 30, 15, 10]),
        status: completed ? 'completed' : 'active',
        topic: pick(['System Design', 'Algorithms', 'Behavioral Fit', 'Coding', 'Product Sense']),
        focus_areas: pickN(WORK_VALUES, 2),
        rubric: { clarity: 40, technical: 40, composure: 20 },
        transcript: completed
          ? pickN(INTERVIEW_QUESTIONS[cand.domain], 3).map((q, idx) => ({ id: `mq${idx}`, question: q, answer: pick(INTERVIEW_ANSWERS[cand.domain]) }))
          : null,
        score,
        feedback: completed
          ? {
              strengths: pickN(['clear communication', 'strong technical depth', 'good structure', 'calm under pressure'], 2),
              improvements: pickN(['more concrete metrics', 'faster to the point', 'show more enthusiasm'], 1),
            }
          : null,
        generated_resume: chance(0.3) ? { atsScore: randInt(70, 95), suggestions: pickN(['Add quantifiable impact', 'Include tech stack list', 'Tighten summary'], 2) } : null,
        resume_pdf_url: chance(0.4) ? `https://storage.nextround.dev/resumes/${cand.profileId}/mock-resume.pdf` : null,
        ended_at: completed ? daysAgo(randInt(1, 30)) : null,
        created_at: randomPastDate(0, 40),
      });
    }
  }
  await prisma.mockSession.createMany({ data: mockRows as never });

  // Prep content per job.
  const prepRows: unknown[] = [];
  for (const job of jobRows) {
    const org = orgRows.find((o) => o.id === job.orgId)!;
    prepRows.push({
      company_name: job.orgName,
      role_archetype: job.title,
      job_id: job.id,
      org_id: job.orgId,
      questions: pickN(INTERVIEW_QUESTIONS[job.domain], 3),
      culture_notes: org.def.cultureNotes,
      skill_checklist: pickN(job.skills, Math.min(5, job.skills.length)),
      updated_at: daysAgo(randInt(1, 30)),
    });
  }
  await prisma.prepContent.createMany({ data: prepRows as never });

  // Agent logs per org + job.
  const agentLogRows: unknown[] = [];
  for (const org of orgRows) {
    for (let k = 0; k < randInt(3, 5); k++) {
      agentLogRows.push({
        org_id: org.id,
        job_id: null,
        agent_name: pick(AGENT_NAMES),
        action: pick(AGENT_ACTIONS),
        input: { requestId: `req_${k}_${org.id.slice(0, 6)}` },
        output: { ok: true, processed: randInt(1, 20) },
        status: chance(0.92) ? 'completed' : 'failed',
        error: null,
        created_at: randomPastDate(0, 30),
      });
    }
  }
  for (const job of jobRows.slice(0, 40)) {
    agentLogRows.push({
      org_id: job.orgId,
      job_id: job.id,
      agent_name: pick(AGENT_NAMES),
      action: pick(AGENT_ACTIONS),
      input: { jobTitle: job.title },
      output: { ok: true, processed: randInt(1, 8) },
      status: 'completed',
      error: null,
      created_at: randomPastDate(0, 30),
    });
  }
  await prisma.agentLog.createMany({ data: agentLogRows as never });

  /* ---------- Summary ---------- */
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log('');
  console.log('✅ Seed complete.');
  console.log(`   Organizations:  ${orgRows.length}`);
  console.log(`   HR users:       ${hrRows.length}`);
  console.log(`   Jobs:           ${jobRows.length}`);
  console.log(`   Candidates:     ${candidates.length}`);
  console.log(`   Applications:   ${pairs.length}`);
  console.log(`   Assessments:    ${assessmentRows.length}`);
  console.log(`   Coding subs:    ${codingRows.length}`);
  console.log(`   Interviews:     ${interviewRows.length}`);
  console.log(`   Evaluations:    ${evaluationRows.length}`);
  console.log(`   Offers:         ${offerRows.length} (${offersMade})`);
  console.log(`   Notifications:  ${notificationRows.length}`);
  console.log(`   Bookmarks:      ${bookmarkRows.length}`);
  console.log(`   Mock sessions:  ${mockRows.length}`);
  console.log(`   Prep content:   ${prepRows.length}`);
  console.log(`   Agent logs:     ${agentLogRows.length}`);
  console.log(`   Time:           ${seconds}s`);
  console.log('');
  console.log('🔑 Demo logins (password for all: Password123!):');
  for (const d of DEMO_HR) console.log(`   ${d.email}   (HR — ${d.name})`);
  for (const d of DEMO_CANDIDATES) console.log(`   ${d.email}   (Candidate — ${d.name})`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



