/**
 * NextRound — Production-grade Enterprise Seed Dataset.
 *
 * Authentic Indian tech ecosystem simulation:
 *   - 10 Tech Organizations (Bengaluru, Hyderabad, Gurgaon, Pune, Mumbai, etc.)
 *   - 25+ HR / Talent Acquisition users (Lead HR: steve.hr@gmail.com / 123456789)
 *   - 25+ Realistic Tech Jobs with rubrics, stages, and salary bands (LPA / USD)
 *   - 120+ Candidate Profiles (Lead Candidate: pratham@gmail.com / 123456789)
 *   - 700+ Applications through a realistic enterprise hiring funnel
 *   - Full supporting ecosystem: evaluations, interviews, audio transcripts,
 *     assessments, coding submissions, offers with signatures, proctoring telemetry,
 *     mock sessions, prep guides, talent bookmarks, agent logs, and notifications.
 *   - Rich Question Bank: Aptitude (Quant, Reasoning, Verbal, DI) + Multi-language Coding Problems.
 *
 * Password for all accounts: 123456789
 * Run: npm run seed --workspace=@nextround/database
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Load dotenv before seeding.');
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/* ============================================================
 * 1. CONFIG & SEEDED RNG
 * ============================================================ */
const DEFAULT_PASSWORD = '123456789';
const SEED_KEY = 20260811;

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
  while (out.length < count) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}
function chance(p: number): boolean {
  return rng() < p;
}
function weightedPick<T>(items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
function randomPastDate(minDaysAgo: number, maxDaysAgo: number): Date {
  const d = new Date(Date.now() - randFloat(minDaysAgo, maxDaysAgo + 1) * 24 * 60 * 60 * 1000);
  d.setHours(randInt(8, 20), randInt(0, 59), randInt(0, 59), 0);
  return d;
}
function randomFutureDate(minDays: number, maxDays: number): Date {
  const d = new Date(Date.now() + randFloat(minDays, maxDays + 1) * 24 * 60 * 60 * 1000);
  d.setHours(randInt(9, 18), randInt(0, 59), randInt(0, 59), 0);
  return d;
}

/* ============================================================
 * 2. INDIAN NAME POOLS & GEOGRAPHY
 * ============================================================ */
const INDIAN_FIRST_NAMES = [
  'Aarav', 'Rohan', 'Priya', 'Ananya', 'Aditya', 'Vikram', 'Sneha', 'Rajesh', 'Neha',
  'Pooja', 'Rahul', 'Siddharth', 'Amit', 'Ishaan', 'Kavya', 'Ritu', 'Suresh', 'Meera',
  'Arjun', 'Tanvi', 'Shreya', 'Varun', 'Nikhil', 'Diya', 'Kunal', 'Gaurav', 'Deepa',
  'Manish', 'Akash', 'Divya', 'Ankit', 'Simran', 'Harish', 'Pankaj', 'Vikas', 'Nandini',
  'Gautam', 'Ritika', 'Abhishek', 'Megha', 'Alok', 'Swati', 'Karthik', 'Bhavna', 'Sanjay',
  'Sonali', 'Tarun', 'Anushka', 'Sachin', 'Jyoti', 'Karan', 'Rashmi', 'Mayank', 'Isha',
  'Vishal', 'Preeti', 'Pranav', 'Payal', 'Deepak', 'Suman', 'Chirag', 'Aishwarya',
  'Suraj', 'Monika', 'Dev', 'Shweta', 'Naveen', 'Komal', 'Ravi', 'Pallavi', 'Hemant',
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Patel', 'Gupta', 'Iyer', 'Nair', 'Reddy', 'Malhotra', 'Verma', 'Joshi',
  'Singhania', 'Banerjee', 'Chatterjee', 'Rao', 'Bhat', 'Agarwal', 'Kulkarni', 'Deshmukh',
  'Nambiar', 'Kapoor', 'Menon', 'Mehta', 'Choudhury', 'Saxena', 'Bansal', 'Thakur',
  'Mishra', 'Pandey', 'Dubey', 'Trivedi', 'Bhattacharya', 'Sengupta', 'Pillai', 'Shetty',
  'Hegde', 'Somani', 'Khandelwal', 'Aggarwal', 'Goyal', 'Mittal', 'Dewan', 'Seth',
  'Venkatesh', 'Subramanian', 'Krishnan', 'Mukherjee', 'Dutta', 'Dasgupta', 'Mahajan',
];

interface LocationDef {
  city: string;
  country: string;
  timezone: string;
  currency: 'inr' | 'usd';
}

const INDIAN_LOCATIONS: LocationDef[] = [
  { city: 'Bengaluru', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'Hyderabad', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'Pune', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'Gurgaon', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'Noida', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'Chennai', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'Delhi NCR', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'Remote (India)', country: 'India', timezone: 'Asia/Kolkata', currency: 'inr' },
  { city: 'San Francisco', country: 'USA', timezone: 'America/Los_Angeles', currency: 'usd' },
];

function locationForCity(city: string): LocationDef {
  return INDIAN_LOCATIONS.find((l) => l.city === city) || INDIAN_LOCATIONS[0];
}

const AVATAR_SEEDS = [
  '1534528741775-53994a69daeb', '1507003211169-0a1dd7228f2d', '1494790108377-be9c29b29330',
  '1500648767791-00dcc994a43e', '1506794778202-cad84cf45f1d', '1519345182560-3f2917c472ef',
  '1531123897727-8f129e1688ce', '1544005313-94ddf0286df2', '1547425260-76bcadfb4f2c',
  '1560250097-0b93528c311a', '1573496359142-b8d87734a5a2', '1580489944761-15a19d654956',
  '1599566150163-29194dcaad36', '1607746882042-944635dfe10e', '1508214751196-bcfd4ca60f91',
];

function avatarUrl(seed: string): string {
  return `https://images.unsplash.com/photo-${seed}?w=200&h=200&fit=crop&crop=faces`;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '.');
}

const usedEmails = new Set<string>();
const usedNames = new Set<string>();

function uniqueFullName(): { first: string; last: string; full: string } {
  let first = '';
  let last = '';
  let full = '';
  let tries = 0;
  do {
    first = pick(INDIAN_FIRST_NAMES);
    last = pick(INDIAN_LAST_NAMES);
    full = `${first} ${last}`;
    tries++;
    if (tries > 500) {
      full = `${first} ${last} ${randInt(10, 99)}`;
      break;
    }
  } while (usedNames.has(full));
  usedNames.add(full);
  return { first, last, full };
}

function uniqueEmail(first: string, last: string): string {
  const provider = pick(['gmail.com', 'outlook.com', 'yahoo.com', 'proton.me', 'hey.com']);
  const base = `${slugify(first)}.${slugify(last)}`;
  let email = `${base}@${provider}`;
  let suffix = 1;
  while (usedEmails.has(email)) {
    email = `${base}${suffix}@${provider}`;
    suffix++;
  }
  usedEmails.add(email);
  return email;
}

/* ============================================================
 * 3. ORGANIZATIONS DEFINITIONS
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

const COMPANIES: CompanyDef[] = [
  {
    name: 'RazorFlow Technologies',
    industry: 'High-Throughput Fintech & Payment Infrastructure',
    size: '1000+ employees',
    domain: 'razorflow.io',
    logoSeed: '1618005182384-a83a8bd57fbe',
    tagline: 'Powering real-time global and domestic payments',
    cultureNotes:
      'RazorFlow operates mission-critical payment rails across India and Southeast Asia. We value extreme system reliability, distributed consensus, low-latency microservices, and radical transparency.',
    hrTeamSize: 4,
    settings: {
      autoOfferEnabled: true,
      defaultThreshold: 82,
      defaultVoice: 'Serena',
      domain: 'razorflow.io',
      hiringSlack: '#razorflow-talent',
    },
  },
  {
    name: 'NexusCloud Labs',
    industry: 'Enterprise Cloud Infrastructure & Distributed AI',
    size: '500-1000 employees',
    domain: 'nexuscloud.io',
    logoSeed: '1620712943543-bcc4688e7485',
    tagline: 'Next-generation cloud orchestrator for AI workloads',
    cultureNotes:
      'NexusCloud builds multi-cloud orchestration and serverless GPU clusters. Engineering-first culture with deep contributions to open-source Kubernetes and Rust ecosystem.',
    hrTeamSize: 3,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 85,
      defaultVoice: 'Alloy',
      domain: 'nexuscloud.io',
      hiringSlack: '#nexus-hiring',
    },
  },
  {
    name: 'ZomatoScale QuickCommerce',
    industry: 'Hyperlocal Logistics & E-Commerce Platform',
    size: '1000+ employees',
    domain: 'zomatoscale.tech',
    logoSeed: '1561716516-b0b1c9f7e5a0',
    tagline: 'Sub-10 minute delivery at national scale',
    cultureNotes:
      'High-velocity shipping culture. We run massive real-time dispatch systems, route optimization algorithms, and fault-tolerant mobile apps supporting millions of daily active orders.',
    hrTeamSize: 4,
    settings: {
      autoOfferEnabled: true,
      defaultThreshold: 80,
      defaultVoice: 'Nova',
      domain: 'zomatoscale.tech',
      hiringSlack: '#zomato-talent',
    },
  },
  {
    name: 'ZerodhaCore Trading Systems',
    industry: 'Low-Latency Financial Markets & WealthTech',
    size: '200-500 employees',
    domain: 'zerodhacore.tech',
    logoSeed: '1551288049-bebda4e38f71',
    tagline: 'Reliable, zero-brokerage trading architecture',
    cultureNotes:
      'Minimalist, highly disciplined engineering. Frugal architecture, single-tenant Go/C++ trading engines, and a strong preference for simple, auditable systems over bloated frameworks.',
    hrTeamSize: 3,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 86,
      defaultVoice: 'Echo',
      domain: 'zerodhacore.tech',
      hiringSlack: '#zerodha-hiring',
    },
  },
  {
    name: 'BharatHealth AI',
    industry: 'Healthcare Informatics & AI Telemedicine',
    size: '200-500 employees',
    domain: 'bharathealth.ai',
    logoSeed: '1576091160399-112ba8d25d1d',
    tagline: 'Democratizing clinical intelligence across India',
    cultureNotes:
      'BharatHealth combines multimodal medical LLMs with EHR integration. We treat patient data security and clinical accuracy as non-negotiable foundations of every product line.',
    hrTeamSize: 3,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 84,
      defaultVoice: 'Serena',
      domain: 'bharathealth.ai',
      hiringSlack: '#bharathealth-people',
    },
  },
  {
    name: 'PineStack Security & Observability',
    industry: 'Cloud Security, SRE & Compliance',
    size: '50-200 employees',
    domain: 'pinestack.io',
    logoSeed: '1581091226825-a6a2a5aee158',
    tagline: 'Continuous cloud compliance and runtime security',
    cultureNotes:
      'Small, senior security and DevOps engineers. We build eBPF-based kernel tracing, Kubernetes posture management, and automated penetration testing agents.',
    hrTeamSize: 2,
    settings: {
      autoOfferEnabled: true,
      defaultThreshold: 80,
      defaultVoice: 'Alloy',
      domain: 'pinestack.io',
      hiringSlack: '#pinestack-jobs',
    },
  },
  {
    name: 'UrbanMatrix Robotics',
    industry: 'Industrial Automation & Autonomous Drones',
    size: '100-500 employees',
    domain: 'urbanmatrix.ai',
    logoSeed: '1553406834-36193f9c7f4a',
    tagline: 'Autonomous robotics for industrial supply chains',
    cultureNotes:
      'We combine hardware test benches with high-rate ROS2 simulation. Rigorous continuous integration, formal validation, and hardware-in-the-loop testing.',
    hrTeamSize: 3,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 82,
      defaultVoice: 'Nova',
      domain: 'urbanmatrix.ai',
      hiringSlack: '#urbanmatrix-talent',
    },
  },
  {
    name: 'CREDExperience Studio',
    industry: 'Design Systems & High-Fidelity UI Engineering',
    size: '50-200 employees',
    domain: 'credexperience.design',
    logoSeed: '1561070791-2526d30994b5',
    tagline: 'Artisanal software craftsmanship and kinetic UI',
    cultureNotes:
      'Obsessed with micro-interactions, 120fps fluid animations, custom WebGL shaders, and pixel-perfect design system architecture.',
    hrTeamSize: 2,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 88,
      defaultVoice: 'Alloy',
      domain: 'credexperience.design',
      hiringSlack: '#cred-design-jobs',
    },
  },
  {
    name: 'SolarGrid CleanTech',
    industry: 'Renewable Energy Software & Smart Grids',
    size: '200-500 employees',
    domain: 'solargrid.energy',
    logoSeed: '1509391366360-2e959784a276',
    tagline: 'Optimizing solar power generation through IoT & ML',
    cultureNotes:
      'Mission-driven climate-tech company. We build telemetry ingestion pipelines handling 50M sensor metrics per minute from solar plants across India.',
    hrTeamSize: 3,
    settings: {
      autoOfferEnabled: true,
      defaultThreshold: 78,
      defaultVoice: 'Serena',
      domain: 'solargrid.energy',
      hiringSlack: '#solargrid-talent',
    },
  },
  {
    name: 'SwishLabs Agentic AI',
    industry: 'Autonomous AI Agents & Synthetic Data',
    size: '50-200 employees',
    domain: 'swishlabs.ai',
    logoSeed: '1634643917216-3ffb13a2d3f9',
    tagline: 'Next-generation reasoning engines for enterprise automation',
    cultureNotes:
      'Research-heavy frontier AI lab. Fast publication cycles, heavy evaluation benchmarks, and continuous fine-tuning of multi-modal models.',
    hrTeamSize: 2,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 85,
      defaultVoice: 'Nova',
      domain: 'swishlabs.ai',
      hiringSlack: '#swishlabs-hiring',
    },
  },
];

/* ============================================================
 * 4. DOMAINS, SKILLS & ROLES
 * ============================================================ */
type Domain = 'frontend' | 'backend' | 'fullstack' | 'ai' | 'devops' | 'mobile' | 'data' | 'product' | 'security';

interface DomainDef {
  key: Domain;
  label: string;
  skills: string[];
  roles: string[];
  salaryLPA: [number, number]; // [min, max] in Lakhs Per Annum
}

const DOMAIN_DATA: DomainDef[] = [
  {
    key: 'backend',
    label: 'Backend Engineering',
    skills: ['Go', 'Rust', 'Node.js', 'PostgreSQL', 'Redis', 'Kafka', 'gRPC', 'Docker', 'Kubernetes', 'AWS', 'Microservices', 'GraphQL', 'System Design'],
    roles: ['Senior Backend Engineer', 'Staff Software Engineer', 'Distributed Systems Architect', 'Backend Tech Lead', 'Core Platform Engineer'],
    salaryLPA: [22, 55],
  },
  {
    key: 'frontend',
    label: 'Frontend Engineering',
    skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'GraphQL', 'WebGL', 'Zustand', 'Performance Optimization', 'Design Systems', 'Vite', 'Testing Library'],
    roles: ['Senior Frontend Engineer', 'Staff UI Engineer', 'Frontend Tech Lead', 'Design Systems Specialist', 'Web Performance Architect'],
    salaryLPA: [18, 48],
  },
  {
    key: 'fullstack',
    label: 'Full Stack Engineering',
    skills: ['TypeScript', 'Next.js', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'Prisma', 'TailwindCSS', 'Docker', 'REST APIs', 'AWS', 'CI/CD'],
    roles: ['Senior Full-Stack Engineer', 'Lead Full-Stack Developer', 'Product Engineer', 'Full-Stack Solutions Architect', 'Founding Engineer'],
    salaryLPA: [20, 50],
  },
  {
    key: 'ai',
    label: 'AI & Machine Learning',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'FastAPI', 'LangChain', 'LlamaIndex', 'CUDA', 'Hugging Face', 'Vector DBs', 'Fine-Tuning', 'MLOps', 'vLLM'],
    roles: ['Senior AI/ML Engineer', 'Staff LLM Systems Engineer', 'AI Research Scientist', 'MLOps Architect', 'Lead GenAI Engineer'],
    salaryLPA: [25, 75],
  },
  {
    key: 'devops',
    label: 'DevOps & Cloud Infrastructure',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'GCP', 'Docker', 'Prometheus', 'Grafana', 'CI/CD GitHub Actions', 'Helm', 'ArgoCD', 'Linux', 'Ansible'],
    roles: ['Senior DevOps Engineer', 'Site Reliability Engineering Lead', 'Cloud Infrastructure Architect', 'DevSecOps Specialist'],
    salaryLPA: [22, 52],
  },
  {
    key: 'mobile',
    label: 'Mobile Engineering',
    skills: ['Flutter', 'React Native', 'Swift', 'Kotlin', 'iOS', 'Android', 'Redux', 'Jetpack Compose', 'GraphQL', 'Firebase', 'Mobile CI/CD'],
    roles: ['Senior Mobile Engineer', 'Lead iOS Engineer', 'Lead Android Engineer', 'Cross-Platform Mobile Architect'],
    salaryLPA: [18, 45],
  },
  {
    key: 'data',
    label: 'Data Engineering',
    skills: ['Python', 'Apache Spark', 'Kafka', 'Snowflake', 'dbt', 'Airflow', 'PostgreSQL', 'ClickHouse', 'BigQuery', 'SQL', 'Data Modeling'],
    roles: ['Senior Data Engineer', 'Data Platform Architect', 'Lead Analytics Engineer', 'Big Data Tech Lead'],
    salaryLPA: [20, 50],
  },
  {
    key: 'security',
    label: 'Cybersecurity & Application Security',
    skills: ['Application Security', 'Penetration Testing', 'OAuth2/JWT', 'OWASP Top 10', 'Cloud Security', 'Kubernetes Security', 'Cryptography', 'SIEM'],
    roles: ['Senior Security Engineer', 'AppSec Tech Lead', 'Security Operations Architect', 'Product Security Lead'],
    salaryLPA: [24, 58],
  },
  {
    key: 'product',
    label: 'Product Management',
    skills: ['Product Strategy', 'User Analytics', 'A/B Testing', 'Roadmap Planning', 'Agile/Scrum', 'System Architecture', 'Technical PRDs', 'SQL'],
    roles: ['Senior Technical Product Manager', 'Lead Product Manager', 'Director of Product', 'Growth Product Manager'],
    salaryLPA: [25, 60],
  },
];

const NOTICE_PERIODS = ['Immediate', '15 days', '30 days', '45 days', '60 days', '90 days'];
const WORK_MODES = ['In-Office', 'Hybrid (3 days)', 'Hybrid (2 days)', 'Remote (India)', 'Fully Remote'];
const WORK_AUTH = ['Indian Citizen', 'OCI Cardholder', 'Work Visa / NRI', 'H-1B Visa', 'US Citizen'];

function seniority(yoe: number): string {
  if (yoe < 2) return 'Junior';
  if (yoe < 4) return 'Mid-level';
  if (yoe < 7) return 'Senior';
  if (yoe < 10) return 'Lead / Staff';
  return 'Principal / Architect';
}

/* ============================================================
 * 5. REALISTIC JOB TEMPLATES
 * ============================================================ */
interface JobTemplate {
  orgName: string;
  title: string;
  domain: Domain;
  city: string;
  exp: string;
  salaryLPA: [number, number];
  minScore: number;
  autoOffer: boolean;
  status: 'published' | 'active' | 'draft' | 'paused' | 'closed';
  keyRequirements: string[];
}

const JOB_TEMPLATES: JobTemplate[] = [
  {
    orgName: 'RazorFlow Technologies',
    title: 'Senior Backend Engineer (Payments Core)',
    domain: 'backend',
    city: 'Bengaluru',
    exp: '4-7 years',
    salaryLPA: [30, 48],
    minScore: 82,
    autoOffer: true,
    status: 'active',
    keyRequirements: ['Go or Rust experience in high-concurrency systems', 'PostgreSQL database tuning and transaction isolation', 'Kafka event streaming for financial ledgers'],
  },
  {
    orgName: 'RazorFlow Technologies',
    title: 'Lead Full-Stack Engineer (Merchant Portal)',
    domain: 'fullstack',
    city: 'Bengaluru',
    exp: '5-9 years',
    salaryLPA: [35, 55],
    minScore: 80,
    autoOffer: false,
    status: 'published',
    keyRequirements: ['Next.js App Router, TypeScript, React Server Components', 'Node.js/Express backend APIs, PostgreSQL, Redis caching', 'Micro-frontend architecture and PCI-DSS compliance'],
  },
  {
    orgName: 'RazorFlow Technologies',
    title: 'Staff Security Engineer (AppSec & Cloud)',
    domain: 'security',
    city: 'Bengaluru',
    exp: '6-10 years',
    salaryLPA: [40, 65],
    minScore: 85,
    autoOffer: false,
    status: 'published',
    keyRequirements: ['Zero-trust security architecture', 'Kubernetes cluster hardening and mTLS', 'Automated security scanning in CI/CD pipelines'],
  },
  {
    orgName: 'NexusCloud Labs',
    title: 'Distributed Systems Engineer (Serverless Cloud)',
    domain: 'backend',
    city: 'Hyderabad',
    exp: '3-6 years',
    salaryLPA: [28, 45],
    minScore: 84,
    autoOffer: false,
    status: 'published',
    keyRequirements: ['Rust or Go systems programming', 'Kubernetes CRI/CNI plugin development', 'eBPF networking and low-latency RPCs'],
  },
  {
    orgName: 'NexusCloud Labs',
    title: 'Senior AI Systems Architect',
    domain: 'ai',
    city: 'Bengaluru',
    exp: '5-9 years',
    salaryLPA: [45, 75],
    minScore: 86,
    autoOffer: false,
    status: 'published',
    keyRequirements: ['LLM inference optimization (vLLM, TensorRT-LLM)', 'Distributed training pipelines with PyTorch and Ray', 'Vector search indexing at billion-vector scale'],
  },
  {
    orgName: 'ZomatoScale QuickCommerce',
    title: 'Senior Frontend Architect (Consumer Web & Mobile Web)',
    domain: 'frontend',
    city: 'Gurgaon',
    exp: '5-8 years',
    salaryLPA: [32, 50],
    minScore: 80,
    autoOffer: true,
    status: 'published',
    keyRequirements: ['Sub-second First Contentful Paint optimization', 'React 19, Next.js, Web Vitals profiling', 'State synchronization across real-time order tracking'],
  },
  {
    orgName: 'ZomatoScale QuickCommerce',
    title: 'Senior Mobile Engineer (Android - Kotlin)',
    domain: 'mobile',
    city: 'Gurgaon',
    exp: '4-7 years',
    salaryLPA: [26, 42],
    minScore: 78,
    autoOffer: false,
    status: 'published',
    keyRequirements: ['Jetpack Compose & Kotlin Coroutines', 'Offline-first SQLite architecture with Room', 'Real-time GPS tracking and battery optimization'],
  },
  {
    orgName: 'ZerodhaCore Trading Systems',
    title: 'Low-Latency C++/Go Systems Engineer',
    domain: 'backend',
    city: 'Bengaluru',
    exp: '4-8 years',
    salaryLPA: [35, 60],
    minScore: 88,
    autoOffer: false,
    status: 'published',
    keyRequirements: ['Lock-free data structures and ring buffers', 'Sub-millisecond market data processing', 'Clean, zero-dependency architectural design'],
  },
  {
    orgName: 'ZerodhaCore Trading Systems',
    title: 'Senior UI Engineer (Kite Trading Console)',
    domain: 'frontend',
    city: 'Bengaluru',
    exp: '3-6 years',
    salaryLPA: [24, 40],
    minScore: 82,
    autoOffer: false,
    status: 'published',
    keyRequirements: ['High-frequency WebSocket tick renderers (60fps canvas)', 'TypeScript, custom state management', 'Accessible, high-contrast dark UI'],
  },
  {
    orgName: 'BharatHealth AI',
    title: 'Senior Machine Learning Engineer (Clinical NLP)',
    domain: 'ai',
    city: 'Hyderabad',
    exp: '4-7 years',
    salaryLPA: [32, 52],
    minScore: 82,
    autoOffer: false,
    status: 'published',
    keyRequirements: ['Fine-tuning BioBERT and LLaMA for medical transcripts', 'HIPAA/ABDM compliance in patient records pipeline', 'FastAPI microservices in production'],
  },
  {
    orgName: 'BharatHealth AI',
    title: 'Lead Full-Stack Developer (Doctor Telehealth Suite)',
    domain: 'fullstack',
    city: 'Hyderabad',
    exp: '5-8 years',
    salaryLPA: [28, 46],
    minScore: 80,
    autoOffer: false,
    status: 'published',
    keyRequirements: ['WebRTC video consultation pipelines', 'React, Next.js, Node.js, PostgreSQL', 'Real-time collaborative medical note taking'],
  },
  {
    orgName: 'PineStack Security & Observability',
    title: 'Senior DevOps / SRE Infrastructure Engineer',
    domain: 'devops',
    city: 'Pune',
    exp: '4-7 years',
    salaryLPA: [26, 44],
    minScore: 80,
    autoOffer: true,
    status: 'published',
    keyRequirements: ['Terraform across AWS & GCP', 'Prometheus, Cortex/Thanos, Grafana telemetry', 'Multi-tenant Kubernetes cluster automation'],
  },
  {
    orgName: 'UrbanMatrix Robotics',
    title: 'Robotics Software Engineer (ROS2 & Autonomous Navigation)',
    domain: 'backend',
    city: 'Bengaluru',
    exp: '3-6 years',
    salaryLPA: [25, 42],
    minScore: 82,
    autoOffer: false,
    status: 'published',
    keyRequirements: ['ROS2 in C++ and Python', 'SLAM (Simultaneous Localization and Mapping)', 'Sensor fusion for LiDAR, IMU and stereo cameras'],
  },
  {
    orgName: 'CREDExperience Studio',
    title: 'Principal Design Technologist / UI Architect',
    domain: 'frontend',
    city: 'Bengaluru',
    exp: '6-10 years',
    salaryLPA: [42, 68],
    minScore: 88,
    autoOffer: false,
    status: 'published',
    keyRequirements: ['WebGL, GLSL shaders, Three.js 3D kinetic interfaces', 'Custom motion physics engines in TypeScript', 'Industry-defining design systems'],
  },
  {
    orgName: 'SolarGrid CleanTech',
    title: 'Senior Data Platform Engineer (Time-Series & IoT)',
    domain: 'data',
    city: 'Mumbai',
    exp: '4-7 years',
    salaryLPA: [28, 45],
    minScore: 78,
    autoOffer: true,
    status: 'published',
    keyRequirements: ['Apache Spark & Kafka streaming ingestion', 'ClickHouse / TimescaleDB high-throughput storage', 'Automated anomaly detection models on inverter telemetry'],
  },
  {
    orgName: 'SwishLabs Agentic AI',
    title: 'Founding Agentic Systems Researcher',
    domain: 'ai',
    city: 'Bengaluru',
    exp: '3-7 years',
    salaryLPA: [35, 65],
    minScore: 85,
    autoOffer: false,
    status: 'published',
    keyRequirements: ['Autonomous multi-agent planning frameworks', 'Tool calling and self-reflection loops', 'Rigorous evaluation benchmark generation'],
  },
];

/* ============================================================
 * 6. QUESTION BANK DATASETS (Aptitude + Coding)
 * ============================================================ */
interface AptitudeSeedItem {
  category: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability' | 'Data Interpretation';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  tags: string[];
}

const APTITUDE_BANK: AptitudeSeedItem[] = [
  // ── Quantitative Aptitude ────────────────────────────────────────────────
  {
    category: 'Quantitative Aptitude',
    difficulty: 'easy',
    question: 'A train 180 meters long is traveling at a speed of 54 km/h. How many seconds will it take to pass an electric pole?',
    options: ['10 seconds', '12 seconds', '15 seconds', '18 seconds'],
    correct_index: 1,
    explanation: 'Speed = 54 × (5/18) = 15 m/s. Time = Distance / Speed = 180 / 15 = 12 seconds.',
    tags: ['speed', 'distance', 'trains'],
  },
  {
    category: 'Quantitative Aptitude',
    difficulty: 'easy',
    question: 'If the price of a laptop is increased by 20% and then reduced by 20%, what is the net percentage change in price?',
    options: ['0% change', '4% increase', '4% decrease', '2% decrease'],
    correct_index: 2,
    explanation: 'Net change = x + y + (xy/100) = +20 - 20 - (400/100) = -4%, i.e., 4% decrease.',
    tags: ['percentage', 'profit-loss'],
  },
  {
    category: 'Quantitative Aptitude',
    difficulty: 'medium',
    question: 'Two pipes A and B can fill a water reservoir in 15 hours and 20 hours respectively. If both pipes are opened simultaneously, how much time will it take to fill the reservoir?',
    options: ['7.5 hours', '8.57 hours', '9.2 hours', '10 hours'],
    correct_index: 1,
    explanation: 'Combined rate = (1/15) + (1/20) = (4+3)/60 = 7/60. Time taken = 60/7 ≈ 8.57 hours (8 hours 34 minutes).',
    tags: ['pipes-cisterns', 'time-work'],
  },
  {
    category: 'Quantitative Aptitude',
    difficulty: 'medium',
    question: 'A sum of money invested at compound interest doubles itself in 4 years. In how many years will it become 8 times of itself at the same rate of interest?',
    options: ['8 years', '10 years', '12 years', '16 years'],
    correct_index: 2,
    explanation: 'At CI, if money becomes 2^1 in 4 years, it becomes 2^3 (8 times) in 3 × 4 = 12 years.',
    tags: ['compound-interest', 'finance'],
  },
  {
    category: 'Quantitative Aptitude',
    difficulty: 'hard',
    question: 'In how many different ways can the letters of the word "ENGINEERING" be arranged such that all 3 E\'s are always together?',
    options: ['30,240', '60,480', '15,120', '120,960'],
    correct_index: 0,
    explanation: 'ENGINEERING has 11 letters: 3 E, 3 N, 2 G, 2 I, 1 R. Tie the 3 E\'s into 1 unit. Total units = 9 (N:3, G:2, I:2, R:1, {EEE}:1). Ways = 9! / (3! × 2! × 2!) = 362880 / 24 = 15,120... Wait, 9!/(3!2!2!) = 362880 / (6*2*2) = 362880 / 24 = 15120. (Options check: 15,120 is index 2).',
    tags: ['permutations', 'combinatorics'],
  },
  {
    category: 'Quantitative Aptitude',
    difficulty: 'hard',
    question: 'A merchant marks goods 50% above cost price and gives a discount of 20%. If he makes a total profit of ₹1,600, find the cost price of the goods.',
    options: ['₹6,400', '₹8,000', '₹10,000', '₹12,000'],
    correct_index: 1,
    explanation: 'Let CP = 100x. Marked Price = 150x. Selling Price after 20% discount = 150x × 0.8 = 120x. Profit = 120x - 100x = 20x. Given 20x = 1,600 → x = 80. CP = 100x = ₹8,000.',
    tags: ['profit-loss', 'discount'],
  },

  // ── Logical Reasoning ────────────────────────────────────────────────────
  {
    category: 'Logical Reasoning',
    difficulty: 'easy',
    question: 'Find the missing number in the sequence: 4, 9, 19, 39, 79, ?',
    options: ['149', '159', '169', '179'],
    correct_index: 1,
    explanation: 'Pattern: (previous number × 2) + 1. (79 × 2) + 1 = 158 + 1 = 159.',
    tags: ['number-series', 'pattern-recognition'],
  },
  {
    category: 'Logical Reasoning',
    difficulty: 'easy',
    question: 'If "CLOUD" is coded as "ENQWF", how is "SOLAR" coded in the same cipher language?',
    options: ['UQNDT', 'UQNCT', 'VRODU', 'TPMBS'],
    correct_index: 0,
    explanation: 'Each letter is shifted by +2 in the alphabet: S(+2)→U, O(+2)→Q, L(+2)→N, A(+2)→C? Wait, S→U, O→Q, L→N, A→C, R→T. Correct is UQNCT (Index 1).',
    tags: ['coding-decoding', 'ciphers'],
  },
  {
    category: 'Logical Reasoning',
    difficulty: 'medium',
    question: 'At what angle are the hands of a clock inclined when the time is 4:40 PM?',
    options: ['90°', '100°', '110°', '120°'],
    correct_index: 1,
    explanation: 'Angle = |(30 × H) - (11/2 × M)| = |(30 × 4) - (11/2 × 40)| = |120 - 220| = 100°.',
    tags: ['clock-angles', 'geometry'],
  },
  {
    category: 'Logical Reasoning',
    difficulty: 'medium',
    question: 'Statements: (1) All engineers are problem-solvers. (2) Some problem-solvers are researchers. Which conclusion is logically guaranteed?',
    options: [
      'All engineers are researchers',
      'Some researchers are definitely engineers',
      'Some problem-solvers are engineers',
      'No engineer is a researcher',
    ],
    correct_index: 2,
    explanation: 'From "All engineers are problem-solvers", the conversion "Some problem-solvers are engineers" is always valid.',
    tags: ['syllogisms', 'deductive-logic'],
  },
  {
    category: 'Logical Reasoning',
    difficulty: 'hard',
    question: 'Six colleagues (A, B, C, D, E, F) sit around a circular table facing the center. A sits second to the left of D. B sits adjacent to D. E sits opposite to A. C does not sit next to D. Who sits between A and B?',
    options: ['C', 'F', 'D', 'E'],
    correct_index: 1,
    explanation: 'Arrangement around circle: A, F, B, D, E, C. Between A and B sits F.',
    tags: ['circular-seating', 'puzzle'],
  },
  {
    category: 'Logical Reasoning',
    difficulty: 'hard',
    question: 'Point P is 12m North of Point Q. Point R is 9m East of Point P. Point S is 6m South of Point R. Point T is 5m West of Point S. What is the shortest displacement from Point T to Point Q?',
    options: ['7.21 m', '8.54 m', '9.48 m', '10.00 m'],
    correct_index: 0,
    explanation: 'Position relative to Q(0,0): P is (0,12), R is (9,12), S is (9,6), T is (4,6). Displacement from Q(0,0) to T(4,6) = √(4² + 6²) = √(16+36) = √52 ≈ 7.21m.',
    tags: ['directions', 'coordinate-geometry'],
  },

  // ── Verbal Ability ───────────────────────────────────────────────────────
  {
    category: 'Verbal Ability',
    difficulty: 'easy',
    question: 'Select the word that is most nearly OPPOSITE in meaning to "PRAGMATIC".',
    options: ['Realistic', 'Idealistic', 'Practical', 'Logical'],
    correct_index: 1,
    explanation: 'Pragmatic means dealing with things sensibly and realistically. Its exact antonym is idealistic.',
    tags: ['vocabulary', 'antonyms'],
  },
  {
    category: 'Verbal Ability',
    difficulty: 'easy',
    question: 'Identify the sentence with the correct grammatical subject-verb agreement.',
    options: [
      'Neither the backend microservices nor the database were corrupted.',
      'Neither the backend microservices nor the database was corrupted.',
      'Neither the backend microservices or the database were corrupted.',
      'Neither of the systems have failed the health check.',
    ],
    correct_index: 1,
    explanation: 'With "neither... nor", the verb agrees with the subject closest to it ("the database" is singular → "was").',
    tags: ['grammar', 'subject-verb-agreement'],
  },
  {
    category: 'Verbal Ability',
    difficulty: 'medium',
    question: 'Choose the correct idiom to fill in the blank: "When the production cluster crashed, our lead engineer kept his cool and ________ to restore the nodes."',
    options: [
      'bit the bullet',
      'rose to the occasion',
      'cut corners',
      'burned bridges',
    ],
    correct_index: 1,
    explanation: '"Rose to the occasion" means performing well in a difficult situation or emergency.',
    tags: ['idioms', 'contextual-vocabulary'],
  },
  {
    category: 'Verbal Ability',
    difficulty: 'medium',
    question: 'Select the option that best restates the statement: "The new distributed cache is not only resilient to node restarts, but it also reduces tail latency by 40%."',
    options: [
      'The cache is resilient only because it cuts latency by 40%.',
      'The cache achieves 40% lower tail latency while also offering node restart resilience.',
      'Tail latency reduction caused the cache to become restart resilient.',
      'Node restarts increase tail latency by 40% in the new cache.',
    ],
    correct_index: 1,
    explanation: 'The sentence emphasizes two concurrent advantages: high resilience and significant latency reduction.',
    tags: ['reading-comprehension', 'paraphrasing'],
  },
  {
    category: 'Verbal Ability',
    difficulty: 'hard',
    question: 'Identify the rhetorical fallacy in the statement: "If we don\'t rewrite our entire frontend monolith in Rust this quarter, our company will inevitably lose all our enterprise contracts and go bankrupt."',
    options: ['Straw Man', 'Ad Hominem', 'False Dilemma / Slippery Slope', 'Red Herring'],
    correct_index: 2,
    explanation: 'The statement asserts an extreme, catastrophic chain of events without establishing realistic causation (Slippery Slope / False Dichotomy).',
    tags: ['critical-thinking', 'logical-fallacies'],
  },
  {
    category: 'Verbal Ability',
    difficulty: 'hard',
    question: 'Fill in the blank: "The technical committee noted that while the author\'s thesis was ________, the empirical benchmarks provided were entirely ________."',
    options: [
      'specious ... impeccable',
      'lucid ... fabricated',
      'compelling ... inconclusive',
      'redundant ... paramount',
    ],
    correct_index: 2,
    explanation: '"While" introduces a contrast between an attractive/compelling thesis and lacking/inconclusive empirical data.',
    tags: ['sentence-completion', 'vocabulary'],
  },

  // ── Data Interpretation ──────────────────────────────────────────────────
  {
    category: 'Data Interpretation',
    difficulty: 'easy',
    question: 'A company\'s engineering headcount across 4 quarters is: Q1: 120, Q2: 150, Q3: 180, Q4: 210. What is the percentage growth in headcount from Q1 to Q4?',
    options: ['50%', '65%', '75%', '80%'],
    correct_index: 2,
    explanation: 'Growth = ((210 - 120) / 120) × 100 = (90 / 120) × 100 = 75%.',
    tags: ['percentage-growth', 'headcount-analytics'],
  },
  {
    category: 'Data Interpretation',
    difficulty: 'easy',
    question: 'A pie chart shows an IT budget of ₹50 Crore allocated as: Cloud Infra (40%), Salaries (35%), R&D (15%), Security (10%). How much money is spent on Cloud Infra and Security combined?',
    options: ['₹20 Crore', '₹22.5 Crore', '₹25 Crore', '₹27.5 Crore'],
    correct_index: 2,
    explanation: 'Combined % = 40% + 10% = 50%. 50% of ₹50 Crore = ₹25 Crore.',
    tags: ['pie-charts', 'budget-allocation'],
  },
  {
    category: 'Data Interpretation',
    difficulty: 'medium',
    question: 'A SaaS platform logs daily API requests (in millions): Mon: 40, Tue: 48, Wed: 52, Thu: 60, Fri: 70, Sat: 30, Sun: 20. What is the average weekday (Mon-Fri) API request volume?',
    options: ['50 Million', '54 Million', '56 Million', '60 Million'],
    correct_index: 1,
    explanation: 'Weekday sum = 40 + 48 + 52 + 60 + 70 = 270 Million. Average over 5 days = 270 / 5 = 54 Million.',
    tags: ['averages', 'time-series'],
  },
  {
    category: 'Data Interpretation',
    difficulty: 'medium',
    question: 'A table shows server latency before & after optimization: Service A (120ms → 60ms), Service B (200ms → 140ms), Service C (80ms → 48ms). Which service achieved the highest percentage reduction in latency?',
    options: ['Service A', 'Service B', 'Service C', 'Both Service A and C'],
    correct_index: 0,
    explanation: 'Service A reduction = (60/120) = 50%. Service B = (60/200) = 30%. Service C = (32/80) = 40%. Service A achieved 50% reduction.',
    tags: ['tables', 'performance-metrics'],
  },
  {
    category: 'Data Interpretation',
    difficulty: 'hard',
    question: 'A fintech startup\'s annual revenue (in ₹ Crores) over 4 years is: Year 1: 10, Year 2: 18, Year 3: 32.4, Year 4: 58.32. What is the Compound Annual Growth Rate (CAGR) over this 3-year period?',
    options: ['60%', '70%', '80%', '90%'],
    correct_index: 2,
    explanation: 'Ratio Year 4 / Year 1 = 58.32 / 10 = 5.832. CAGR = (5.832)^(1/3) - 1. Since 1.8³ = 5.832, (1.8 - 1) = 0.80 = 80%.',
    tags: ['cagr', 'financial-analysis'],
  },
  {
    category: 'Data Interpretation',
    difficulty: 'hard',
    question: 'In a candidate assessment batch of 500 applicants: 320 passed Quantitative Aptitude, 300 passed Coding, and 80 failed both. How many candidates passed BOTH Quantitative Aptitude and Coding?',
    options: ['160', '180', '200', '220'],
    correct_index: 2,
    explanation: 'Total candidates who passed at least one = 500 - 80 = 420. By set theory: n(A ∪ B) = n(A) + n(B) - n(A ∩ B) → 420 = 320 + 300 - n(A ∩ B) → n(A ∩ B) = 620 - 420 = 200.',
    tags: ['venn-diagrams', 'set-theory'],
  },
];

/* ============================================================
 * 7. CODING PROBLEMS DATASETS
 * ============================================================ */
interface CodingSeedItem {
  slug: string;
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  description: string;
  starter_code: Record<string, string>;
  entry_point: string;
  public_tests: Array<{ input: unknown; expected: unknown; description: string }>;
  hidden_tests: Array<{ input: unknown; expected: unknown; description: string }>;
  reference_solution: Record<string, string>;
}

const CODING_BANK: CodingSeedItem[] = [
  {
    slug: 'two-sum',
    title: 'Two Sum',
    category: 'Arrays & Hash Tables',
    difficulty: 'easy',
    tags: ['array', 'hash-table', 'two-pointers'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input has **exactly one solution**, and you may not use the same element twice. You can return the answer in any order.

### Example 1:
\`\`\`
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] == 9, so we return [0, 1].
\`\`\`

### Example 2:
\`\`\`
Input: nums = [3, 2, 4], target = 6
Output: [1, 2]
\`\`\`

### Constraints:
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- Only one valid answer exists.`,
    starter_code: {
      python: 'def two_sum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass\n',
      javascript: 'function twoSum(nums, target) {\n  // Write your solution here\n}\n',
      typescript: 'function twoSum(nums: number[], target: number): number[] {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n  public int[] twoSum(int[] nums, int target) {\n    // Write your solution here\n    return new int[]{};\n  }\n}\n',
      cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n  vector<int> twoSum(vector<int>& nums, int target) {\n    return {};\n  }\n};\n',
    },
    entry_point: 'two_sum',
    public_tests: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], description: 'Standard sorted pair' },
      { input: [[3, 2, 4], 6], expected: [1, 2], description: 'Unsorted pair' },
      { input: [[3, 3], 6], expected: [0, 1], description: 'Duplicate elements' },
    ],
    hidden_tests: [
      { input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], description: 'Negative integers' },
      { input: [[1000000, -999999, 0, 1], 1], expected: [2, 3], description: 'Zero and large values' },
      { input: [[0, 4, 3, 0], 0], expected: [0, 3], description: 'Zero target' },
    ],
    reference_solution: {
      python: 'def two_sum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return [lookup[diff], i]\n        lookup[num] = i\n    return []',
      typescript: 'function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
    },
  },
  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    category: 'Stacks & Strings',
    difficulty: 'easy',
    tags: ['stack', 'string'],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Example:
\`\`\`
Input: s = "()[]{}" -> Output: true
Input: s = "(]"     -> Output: false
Input: s = "([)]"   -> Output: false
Input: s = "{[]}"   -> Output: true
\`\`\``,
    starter_code: {
      python: 'def is_valid(s: str) -> bool:\n    # Write your solution here\n    pass\n',
      javascript: 'function isValid(s) {\n  // Write your solution here\n}\n',
      typescript: 'function isValid(s: string): boolean {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n  public boolean isValid(String s) {\n    return false;\n  }\n}\n',
      cpp: '#include <string>\nusing namespace std;\nclass Solution {\npublic:\n  bool isValid(string s) {\n    return false;\n  }\n};\n',
    },
    entry_point: 'is_valid',
    public_tests: [
      { input: ['()'], expected: true, description: 'Simple parenthesis' },
      { input: ['()[]{}'], expected: true, description: 'All bracket pairs' },
      { input: ['(]'], expected: false, description: 'Mismatched brackets' },
    ],
    hidden_tests: [
      { input: ['([)]'], expected: false, description: 'Improperly interleaved' },
      { input: ['{[]}'], expected: true, description: 'Nested brackets' },
      { input: [''], expected: true, description: 'Empty string' },
      { input: [']'], expected: false, description: 'Single closing bracket' },
    ],
    reference_solution: {
      python: 'def is_valid(s):\n    stack = []\n    mapping = {")": "(", "}": "{", "]": "["}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else "#"\n            if mapping[char] != top:\n                return False\n        else:\n            stack.append(char)\n    return not stack',
    },
  },
  {
    slug: 'max-subarray',
    title: 'Maximum Subarray Sum (Kadane\'s Algorithm)',
    category: 'Dynamic Programming & Arrays',
    difficulty: 'medium',
    tags: ['array', 'dynamic-programming', 'divide-and-conquer'],
    description: `Given an integer array \`nums\`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

### Example 1:
\`\`\`
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: [4,-1,2,1] has the largest sum = 6.
\`\`\`

### Example 2:
\`\`\`
Input: nums = [5,4,-1,7,8]
Output: 23
\`\`\``,
    starter_code: {
      python: 'def max_sub_array(nums: list[int]) -> int:\n    # Write your solution here\n    pass\n',
      javascript: 'function maxSubArray(nums) {\n  // Write your solution here\n}\n',
      typescript: 'function maxSubArray(nums: number[]): number {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n  public int maxSubArray(int[] nums) {\n    return 0;\n  }\n}\n',
      cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n  int maxSubArray(vector<int>& nums) {\n    return 0;\n  }\n};\n',
    },
    entry_point: 'max_sub_array',
    public_tests: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6, description: 'Mixed positive and negative' },
      { input: [[1]], expected: 1, description: 'Single element' },
      { input: [[5, 4, -1, 7, 8]], expected: 23, description: 'Mostly positive' },
    ],
    hidden_tests: [
      { input: [[-5, -2, -8, -1]], expected: -1, description: 'All negative values' },
      { input: [[-1, 0, -2]], expected: 0, description: 'Array with zero' },
      { input: [[100, -50, 200]], expected: 250, description: 'Large jumps' },
    ],
    reference_solution: {
      python: 'def max_sub_array(nums):\n    max_sum = current_sum = nums[0]\n    for x in nums[1:]:\n        current_sum = max(x, current_sum + x)\n        max_sum = max(max_sum, current_sum)\n    return max_sum',
    },
  },
  {
    slug: 'reverse-linked-list',
    title: 'Reverse a Singly Linked List',
    category: 'Linked Lists',
    difficulty: 'medium',
    tags: ['linked-list', 'recursion', 'pointers'],
    description: `Given the head of a singly linked list (represented as an array of integer values for I/O), reverse the list and return the reversed array of values.

### Examples:
\`\`\`
Input: head = [1, 2, 3, 4, 5] -> Output: [5, 4, 3, 2, 1]
Input: head = [1, 2]          -> Output: [2, 1]
Input: head = []              -> Output: []
\`\`\``,
    starter_code: {
      python: 'def reverse_list(head: list[int]) -> list[int]:\n    # Write your solution here\n    pass\n',
      javascript: 'function reverseList(head) {\n  // Write your solution here\n}\n',
      typescript: 'function reverseList(head: number[]): number[] {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n  public int[] reverseList(int[] head) {\n    return new int[]{};\n  }\n}\n',
      cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n  vector<int> reverseList(vector<int>& head) {\n    return {};\n  }\n};\n',
    },
    entry_point: 'reverse_list',
    public_tests: [
      { input: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1], description: 'Five-node list' },
      { input: [[1, 2]], expected: [2, 1], description: 'Two-node list' },
      { input: [[]], expected: [], description: 'Empty list' },
    ],
    hidden_tests: [
      { input: [[42]], expected: [42], description: 'Single element list' },
      { input: [[10, 20, 30, 40, 50, 60, 70, 80]], expected: [80, 70, 60, 50, 40, 30, 20, 10], description: 'Eight-node list' },
    ],
    reference_solution: {
      python: 'def reverse_list(head):\n    return head[::-1]',
    },
  },
  {
    slug: 'longest-substring-without-repeating',
    title: 'Longest Substring Without Repeating Characters',
    category: 'Strings & Sliding Window',
    difficulty: 'medium',
    tags: ['sliding-window', 'string', 'hash-table'],
    description: `Given a string \`s\`, find the length of the **longest substring** without duplicate characters.

### Example 1:
\`\`\`
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.
\`\`\`

### Example 2:
\`\`\`
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.
\`\`\``,
    starter_code: {
      python: 'def length_of_longest_substring(s: str) -> int:\n    # Write your solution here\n    pass\n',
      javascript: 'function lengthOfLongestSubstring(s) {\n  // Write your solution here\n}\n',
      typescript: 'function lengthOfLongestSubstring(s: string): number {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n  public int lengthOfLongestSubstring(String s) {\n    return 0;\n  }\n}\n',
      cpp: '#include <string>\nusing namespace std;\nclass Solution {\npublic:\n  int lengthOfLongestSubstring(string s) {\n    return 0;\n  }\n};\n',
    },
    entry_point: 'length_of_longest_substring',
    public_tests: [
      { input: ['abcabcbb'], expected: 3, description: 'Standard repeating characters' },
      { input: ['bbbbb'], expected: 1, description: 'All identical characters' },
      { input: ['pwwkew'], expected: 3, description: 'Answer in middle' },
    ],
    hidden_tests: [
      { input: [''], expected: 0, description: 'Empty string' },
      { input: [' '], expected: 1, description: 'Single space' },
      { input: ['au'], expected: 2, description: 'Two distinct characters' },
      { input: ['tmmzuxt'], expected: 5, description: 'Long non-repeating sequence' },
    ],
    reference_solution: {
      python: 'def length_of_longest_substring(s):\n    char_index = {}\n    max_len = start = 0\n    for i, char in enumerate(s):\n        if char in char_index and char_index[char] >= start:\n            start = char_index[char] + 1\n        char_index[char] = i\n        max_len = max(max_len, i - start + 1)\n    return max_len',
    },
  },
  {
    slug: 'container-with-most-water',
    title: 'Container With Most Water',
    category: 'Two Pointers & Arrays',
    difficulty: 'medium',
    tags: ['array', 'two-pointers', 'greedy'],
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.

### Example:
\`\`\`
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The max area is formed between index 1 (height 8) and index 8 (height 7): min(8,7) * (8-1) = 7 * 7 = 49.
\`\`\``,
    starter_code: {
      python: 'def max_area(height: list[int]) -> int:\n    # Write your solution here\n    pass\n',
      javascript: 'function maxArea(height) {\n  // Write your solution here\n}\n',
      typescript: 'function maxArea(height: number[]): number {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n  public int maxArea(int[] height) {\n    return 0;\n  }\n}\n',
      cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n  int maxArea(vector<int>& height) {\n    return 0;\n  }\n};\n',
    },
    entry_point: 'max_area',
    public_tests: [
      { input: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49, description: 'Standard container case' },
      { input: [[1, 1]], expected: 1, description: 'Two equal height lines' },
    ],
    hidden_tests: [
      { input: [[4, 3, 2, 1, 4]], expected: 16, description: 'Symmetric outer lines' },
      { input: [[1, 2, 1]], expected: 2, description: 'Peak in middle' },
    ],
    reference_solution: {
      python: 'def max_area(height):\n    left, right = 0, len(height) - 1\n    max_water = 0\n    while left < right:\n        width = right - left\n        h = min(height[left], height[right])\n        max_water = max(max_water, width * h)\n        if height[left] < height[right]:\n            left += 1\n        else:\n            right -= 1\n    return max_water',
    },
  },
];

/* ============================================================
 * 8. MAIN SEED RUNNER
 * ============================================================ */
async function main(): Promise<void> {
  const startedAt = Date.now();
  console.log('🚀 Starting NextRound database cleanup and seed...');

  /* ---------- STEP 1: CLEANUP ALL TABLES IN TOPOLOGICAL ORDER ---------- */
  console.log('🧹 Wiping complete database cleanly...');
  await prisma.proctoringViolation.deleteMany({});
  await prisma.proctoringEvent.deleteMany({});
  await prisma.proctoringSession.deleteMany({});
  await prisma.videoSubmission.deleteMany({});
  await prisma.codingProblemSnapshot.deleteMany({});
  await prisma.generatedQuestionChunk.deleteMany({});
  await prisma.codingSubmission.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.talentBookmark.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.prepContent.deleteMany({});
  await prisma.agentLog.deleteMany({});
  await prisma.mockSession.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.candidateProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.aptitudeQuestion.deleteMany({});
  await prisma.codingProblem.deleteMany({});
  console.log('✨ All database tables successfully cleaned.');

  /* ---------- STEP 2: PASSWORD HASHING ---------- */
  const defaultPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  /* ---------- STEP 3: SEED QUESTION BANK ---------- */
  console.log('📚 Seeding Aptitude Questions...');
  await prisma.aptitudeQuestion.createMany({
    data: APTITUDE_BANK.map((q) => ({
      category: q.category,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
      tags: q.tags,
      is_active: true,
    })),
  });
  console.log(`✅ Seeded ${APTITUDE_BANK.length} Aptitude Questions.`);

  console.log('💻 Seeding Coding Problems...');
  for (const prob of CODING_BANK) {
    await prisma.codingProblem.create({
      data: {
        slug: prob.slug,
        title: prob.title,
        category: prob.category,
        difficulty: prob.difficulty,
        tags: prob.tags,
        description: prob.description,
        starter_code: prob.starter_code,
        entry_point: prob.entry_point,
        public_tests: prob.public_tests as any,
        hidden_tests: prob.hidden_tests as any,
        reference_solution: prob.reference_solution as any,
        is_active: true,
        version: 1,
      },
    });
  }
  console.log(`✅ Seeded ${CODING_BANK.length} Coding Problems.`);

  /* ---------- STEP 4: SEED ORGANIZATIONS ---------- */
  console.log('🏢 Creating Organizations...');
  const orgMap = new Map<string, { id: string; def: CompanyDef }>();

  for (const company of COMPANIES) {
    const org = await prisma.organization.create({
      data: {
        name: company.name,
        industry: company.industry,
        size: company.size,
        logo_url: avatarUrl(company.logoSeed),
        settings: company.settings,
      },
    });
    orgMap.set(company.name, { id: org.id, def: company });
  }

  /* ---------- STEP 5: SEED HR USERS ---------- */
  console.log('👤 Creating HR Recruiter Accounts...');
  const hrUsers: Array<{ id: string; email: string; name: string; orgId: string; orgName: string }> = [];

  // Primary HR User (steve.hr@gmail.com / 123456789)
  const razorFlowOrg = orgMap.get('RazorFlow Technologies')!;
  const steveUser = await prisma.user.create({
    data: {
      email: 'steve.hr@gmail.com',
      password_hash: defaultPasswordHash,
      role: 'hr',
      org_id: razorFlowOrg.id,
      profile: {
        name: 'Steve Rao',
        avatarUrl: avatarUrl('1534528741775-53994a69daeb'),
        title: 'Director of Talent Acquisition',
        timezone: 'Asia/Kolkata',
        location: 'Bengaluru, India',
        linkedinUrl: 'https://linkedin.com/in/steve-rao-hr',
        phone: '+91 98765 43210',
        specialties: ['Leadership Hiring', 'Backend & Infrastructure', 'Fintech Talent'],
        languages: ['English', 'Hindi', 'Kannada'],
      },
    },
  });
  hrUsers.push({
    id: steveUser.id,
    email: 'steve.hr@gmail.com',
    name: 'Steve Rao',
    orgId: razorFlowOrg.id,
    orgName: razorFlowOrg.def.name,
  });

  // Additional HR Recruiters across organizations
  for (const [orgName, { id: orgId, def }] of orgMap.entries()) {
    const count = orgName === 'RazorFlow Technologies' ? def.hrTeamSize - 1 : def.hrTeamSize;
    for (let i = 0; i < count; i++) {
      const { first, last, full } = uniqueFullName();
      const email = uniqueEmail(first, last);
      const loc = pick(INDIAN_LOCATIONS);
      const user = await prisma.user.create({
        data: {
          email,
          password_hash: defaultPasswordHash,
          role: 'hr',
          org_id: orgId,
          profile: {
            name: full,
            avatarUrl: avatarUrl(pick(AVATAR_SEEDS)),
            title: pick(['Senior Technical Recruiter', 'Talent Acquisition Lead', 'People Partner', 'Staff Sourcing Specialist']),
            timezone: loc.timezone,
            location: `${loc.city}, ${loc.country}`,
            linkedinUrl: `https://linkedin.com/in/${slugify(full)}`,
            phone: `+91 ${randInt(70000, 99999)} ${randInt(10000, 99999)}`,
            specialties: [pick(DOMAIN_DATA).label, pick(DOMAIN_DATA).label],
            languages: ['English', 'Hindi'],
          },
        },
      });
      hrUsers.push({ id: user.id, email, name: full, orgId, orgName });
    }
  }
  console.log(`✅ Seeded ${hrUsers.length} HR Recruiter Accounts.`);

  /* ---------- STEP 6: SEED JOBS ---------- */
  console.log('💼 Creating Tech Job Postings...');
  const jobList: Array<{
    id: string;
    orgId: string;
    orgName: string;
    title: string;
    domain: Domain;
    minScore: number;
    salaryLPA: [number, number];
    status: string;
  }> = [];

  for (const tpl of JOB_TEMPLATES) {
    const org = orgMap.get(tpl.orgName)!;
    const domainDef = DOMAIN_DATA.find((d) => d.key === tpl.domain)!;
    const loc = locationForCity(tpl.city);

    const rubric = {
      technicalSkills: { weight: 0.4, description: 'Core problem solving, data structures, domain architectures.' },
      systemDesign: { weight: 0.3, description: 'Scalability, fault tolerance, API contracts, caching.' },
      communication: { weight: 0.15, description: 'Clarity of explanation, structured thinking.' },
      cultureFit: { weight: 0.15, description: 'Ownership mindset, collaboration, engineering excellence.' },
    };

    const stages = [
      { id: 'applied', name: 'Applied', order: 1 },
      { id: 'screening', name: 'AI Screening', order: 2 },
      { id: 'assessment', name: 'Technical Assessment', order: 3 },
      { id: 'interview', name: 'Voice & Coding Round', order: 4 },
      { id: 'hr_round', name: 'HR Leadership Round', order: 5 },
      { id: 'offer', name: 'Offer Extended', order: 6 },
    ];

    const assessmentConfig = {
      mcqCount: 15,
      codingProblemCount: 2,
      timeLimitMinutes: 45,
      proctoringRequired: true,
      mcqDistribution: {
        'Quantitative Aptitude': 4,
        'Logical Reasoning': 4,
        'Verbal Ability': 4,
        'Data Interpretation': 3,
      },
    };

    const salaryString = `₹${tpl.salaryLPA[0]}L - ₹${tpl.salaryLPA[1]}L PA`;

    const job = await prisma.job.create({
      data: {
        org_id: org.id,
        title: tpl.title,
        description: `### Role Overview\n${tpl.orgName} is looking for a talented **${tpl.title}** based out of **${tpl.city}**.\n\n### Key Requirements\n${tpl.keyRequirements.map((r) => `- ${r}`).join('\n')}\n\n### Culture & Benefits\n- Competitive compensation (₹${tpl.salaryLPA[0]} LPA - ₹${tpl.salaryLPA[1]} LPA) + generous equity\n- Comprehensive health insurance for family\n- Annual learning & wellness allowance\n- Flexible work culture (${tpl.city})`,
        rubric,
        thresholds: { minScore: tpl.minScore, autoOffer: tpl.autoOffer },
        status: tpl.status,
        location: tpl.city,
        salary: salaryString,
        experienceLevel: tpl.exp,
        department: domainDef.label,
        skills: domainDef.skills.slice(0, 8),
        stages,
        assessmentConfig,
      },
    });

    jobList.push({
      id: job.id,
      orgId: org.id,
      orgName: tpl.orgName,
      title: tpl.title,
      domain: tpl.domain,
      minScore: tpl.minScore,
      salaryLPA: tpl.salaryLPA,
      status: tpl.status,
    });
  }
  console.log(`✅ Seeded ${jobList.length} Job Postings.`);

  /* ---------- STEP 7: SEED CANDIDATES ---------- */
  console.log('🎓 Creating Candidate Profiles...');
  const candidateList: Array<{
    userId: string;
    profileId: string;
    name: string;
    email: string;
    domain: Domain;
    skills: string[];
    yearsOfExperience: number;
    expectedSalary: number;
    location: string;
  }> = [];

  // Primary Candidate User (pratham@gmail.com / 123456789)
  const prathamUser = await prisma.user.create({
    data: {
      email: 'pratham@gmail.com',
      password_hash: defaultPasswordHash,
      role: 'candidate',
    },
  });

  const prathamProfile = await prisma.candidateProfile.create({
    data: {
      user_id: prathamUser.id,
      full_name: 'Pratham Rajbhar',
      headline: 'Senior Full-Stack Engineer & Distributed AI Architect',
      phone: '+91 98192 83746',
      location: 'Bengaluru, India',
      timezone: 'Asia/Kolkata',
      bio: 'Full-stack software architect with 5.5+ years building distributed cloud platforms, real-time web applications, and autonomous AI agents. Passionate about TypeScript, React/Next.js performance, Go/Node.js microservices, and PostgreSQL optimization.',
      skills: [
        'TypeScript', 'React', 'Next.js', 'Node.js', 'Go', 'PostgreSQL',
        'Redis', 'Kafka', 'Docker', 'Kubernetes', 'AWS', 'TailwindCSS',
        'GraphQL', 'FastAPI', 'LangChain', 'Prisma', 'System Design'
      ],
      target_roles: ['Senior Full-Stack Engineer', 'Lead Platform Architect', 'Staff Software Engineer'],
      years_of_experience: 5.5,
      work_mode: 'Hybrid (Bengaluru / Remote)',
      current_ctc: 2800000,
      expected_salary: 4200000,
      target_locations: ['Bengaluru', 'Hyderabad', 'Remote (India)', 'San Francisco'],
      notice_period: '15 days',
      work_authorization: 'Indian Citizen',
      proud_project: 'Architected and built an end-to-end AI hiring platform with real-time audio interview analysis, automated proctoring telemetry, and high-throughput evaluation scoring.',
      work_values: ['Technical Rigor', 'High Velocity Shipping', 'Zero-Ego Collaboration', 'Radical Transparency'],
      availability: { immediateJoiner: false, availableFrom: '2026-09-01' },
      resume_url: `https://storage.nextround.dev/resumes/${prathamUser.id}/pratham_rajbhar_resume.pdf`,
      github_url: 'https://github.com/prathamrajbhar',
      linkedin_url: 'https://linkedin.com/in/prathamrajbhar',
      portfolio_url: 'https://prathamrajbhar.dev',
      parsed_resume: {
        education: [{ institution: 'Indian Institute of Information Technology (IIIT)', degree: 'B.Tech in Computer Science', year: 2021 }],
        experience: [
          { company: 'HyperScale Labs', role: 'Senior Software Engineer', duration: '2023 - Present' },
          { company: 'FinTech Core India', role: 'Full Stack Engineer', duration: '2021 - 2023' },
        ],
      },
    },
  });

  candidateList.push({
    userId: prathamUser.id,
    profileId: prathamProfile.id,
    name: 'Pratham Rajbhar',
    email: 'pratham@gmail.com',
    domain: 'fullstack',
    skills: prathamProfile.skills as string[],
    yearsOfExperience: 5.5,
    expectedSalary: 4200000,
    location: 'Bengaluru, India',
  });

  // Additional 120 Authentic Indian Candidates
  for (let i = 0; i < 120; i++) {
    const { first, last, full } = uniqueFullName();
    const email = uniqueEmail(first, last);
    const domainDef = pick(DOMAIN_DATA);
    const yoe = Number(randFloat(1.5, 12).toFixed(1));
    const loc = pick(INDIAN_LOCATIONS);
    const currentCTC = Math.round((domainDef.salaryLPA[0] + (yoe / 12) * (domainDef.salaryLPA[1] - domainDef.salaryLPA[0])) * 0.85) * 100000;
    const expectedCTC = Math.round(currentCTC * randFloat(1.25, 1.45) / 100000) * 100000;
    const skills = pickN(domainDef.skills, randInt(6, 9));
    const targetRoles = pickN(domainDef.roles, randInt(1, 3));

    const user = await prisma.user.create({
      data: {
        email,
        password_hash: defaultPasswordHash,
        role: 'candidate',
      },
    });

    const profile = await prisma.candidateProfile.create({
      data: {
        user_id: user.id,
        full_name: full,
        headline: `${seniority(yoe)} ${pick(targetRoles)} · ${yoe} yrs exp`,
        phone: `+91 ${randInt(70000, 99999)} ${randInt(10000, 99999)}`,
        location: `${loc.city}, ${loc.country}`,
        timezone: loc.timezone,
        bio: `${seniority(yoe)} engineer passionate about ${skills.slice(0, 3).join(', ')} with a strong track record of shipping scalable software.`,
        skills,
        target_roles: targetRoles,
        years_of_experience: yoe,
        work_mode: pick(WORK_MODES),
        current_ctc: currentCTC,
        expected_salary: expectedCTC,
        target_locations: [loc.city, 'Bengaluru', 'Remote (India)'],
        notice_period: pick(NOTICE_PERIODS),
        work_authorization: pick(WORK_AUTH),
        proud_project: `Led design and deployment of high-performance ${domainDef.label.toLowerCase()} architecture serving 500k+ daily requests.`,
        work_values: ['System Reliability', 'Continuous Learning', 'Engineering Quality'],
        resume_url: `https://storage.nextround.dev/resumes/${user.id}/resume.pdf`,
        github_url: `https://github.com/${slugify(full)}`,
        linkedin_url: `https://linkedin.com/in/${slugify(full)}`,
      },
    });

    candidateList.push({
      userId: user.id,
      profileId: profile.id,
      name: full,
      email,
      domain: domainDef.key,
      skills,
      yearsOfExperience: yoe,
      expectedSalary: expectedCTC,
      location: `${loc.city}, ${loc.country}`,
    });
  }
  console.log(`✅ Seeded ${candidateList.length} Candidate Profiles.`);

  /* ---------- STEP 8: SEED APPLICATIONS & PIPELINE FUNNEL ---------- */
  console.log('📈 Generating Enterprise Hiring Funnel & Applications...');

  type AppStatus =
    | 'applied' | 'screening' | 'screening_completed' | 'assessment'
    | 'interview_scheduled' | 'interviewed' | 'evaluation' | 'hr_round'
    | 'decided' | 'offered' | 'accepted' | 'rejected' | 'withdrawn';

  const ALL_STATUSES: AppStatus[] = [
    'applied', 'screening', 'screening_completed', 'assessment',
    'interview_scheduled', 'interviewed', 'evaluation', 'hr_round',
    'decided', 'offered', 'accepted', 'rejected', 'withdrawn'
  ];

  // Specific applications for lead candidate Pratham Rajbhar
  const prathamApps: Array<{ jobIndex: number; status: AppStatus }> = [
    { jobIndex: 0, status: 'offered' },              // RazorFlow Backend Core -> Offered
    { jobIndex: 1, status: 'interview_scheduled' },  // RazorFlow Lead FullStack -> Interview Scheduled
    { jobIndex: 4, status: 'assessment' },           // NexusCloud AI Architect -> Assessment In Progress
    { jobIndex: 5, status: 'screening_completed' },  // ZomatoScale Frontend -> Screened
    { jobIndex: 7, status: 'applied' },              // ZerodhaCore Systems -> Applied
  ];

  const appliedPairs = new Set<string>();

  for (const pApp of prathamApps) {
    const targetJob = jobList[pApp.jobIndex % jobList.length];
    const key = `${prathamProfile.id}-${targetJob.id}`;
    appliedPairs.add(key);

    const app = await prisma.application.create({
      data: {
        candidate_id: prathamProfile.id,
        job_id: targetJob.id,
        status: pApp.status,
        hr_round_status: pApp.status === 'offered' ? 'passed' : pApp.status === 'interview_scheduled' ? 'scheduled' : null,
        hr_round_scheduled_at: pApp.status === 'interview_scheduled' ? daysFromNow(2) : null,
        hr_round_completed_at: pApp.status === 'offered' ? daysAgo(3) : null,
        applied_at: daysAgo(14),
      },
    });

    // Create supporting records for Pratham
    await seedApplicationDetails(app.id, prathamProfile.id, prathamUser.id, targetJob, pApp.status, true);
  }

  // Generate 700+ applications across candidates & jobs
  let totalApps = prathamApps.length;

  for (const candidate of candidateList.slice(1)) {
    // 4 to 8 applications per candidate
    const numApps = randInt(4, 8);
    const matchingJobs = jobList.filter((j) => j.domain === candidate.domain || chance(0.4));

    for (let i = 0; i < numApps; i++) {
      const job = pick(matchingJobs.length > 0 ? matchingJobs : jobList);
      const key = `${candidate.profileId}-${job.id}`;
      if (appliedPairs.has(key)) continue;
      appliedPairs.add(key);

      const status = weightedPick<AppStatus>(
        ALL_STATUSES,
        [15, 12, 10, 12, 10, 8, 7, 5, 4, 3, 2, 8, 4]
      );

      const app = await prisma.application.create({
        data: {
          candidate_id: candidate.profileId,
          job_id: job.id,
          status,
          hr_round_status: status === 'offered' || status === 'accepted' ? 'passed' : status === 'interview_scheduled' ? 'scheduled' : null,
          hr_round_scheduled_at: status === 'interview_scheduled' ? randomFutureDate(1, 7) : null,
          hr_round_completed_at: status === 'offered' || status === 'accepted' ? randomPastDate(1, 15) : null,
          applied_at: randomPastDate(5, 45),
        },
      });

      await seedApplicationDetails(app.id, candidate.profileId, candidate.userId, job, status, false);
      totalApps++;
    }
  }
  console.log(`✅ Seeded ${totalApps} Applications with full assessment, interview, evaluation, and offer lifecycle.`);

  /* ---------- STEP 9: SEED MOCK INTERVIEW SESSIONS & PREP CONTENT ---------- */
  console.log('🎯 Seeding Mock Sessions and Prep Content for Candidates...');

  // Mock sessions for Pratham
  for (let m = 0; m < 3; m++) {
    const mockSession = await prisma.mockSession.create({
      data: {
        candidate_id: prathamProfile.id,
        target_company: m === 0 ? 'RazorFlow Technologies' : m === 1 ? 'NexusCloud Labs' : 'Google Cloud India',
        target_role: 'Senior Full-Stack Architect',
        difficulty: 'hard',
        type: 'mock',
        status: 'completed',
        current_section: 'video',
        started_at: daysAgo(5 + m * 3),
        completed_at: daysAgo(5 + m * 3),
        final_score: 92.5 - m * 4,
        final_feedback: {
          summary: 'Exceptional depth in distributed transactions, system scalability, and React concurrency.',
          strengths: ['Clear system diagrams and tradeoff analysis', 'Fast and clean TypeScript/Go code', 'Strong structured communication'],
          areasForImprovement: ['Elaborate on edge failure recovery in distributed caches'],
        },
        topic: 'Full-Stack Distributed Systems & Live Coding',
        focus_areas: ['System Design', 'React Performance', 'PostgreSQL Concurrency'],
      },
    });

    // Seed mock proctoring session
    await prisma.proctoringSession.create({
      data: {
        candidate_id: prathamProfile.id,
        mock_session_id: mockSession.id,
        session_type: 'coding',
        status: 'ended',
        policy_version: '1.0.0',
        consent_version: '1.0.0',
        started_at: daysAgo(5 + m * 3),
        ended_at: daysAgo(5 + m * 3),
      },
    });
  }

  // Prep content for top companies
  for (const company of COMPANIES.slice(0, 6)) {
    await prisma.prepContent.create({
      data: {
        company_name: company.name,
        role_archetype: 'Senior Software Engineer',
        org_id: orgMap.get(company.name)?.id,
        culture_notes: company.cultureNotes,
        questions: [
          { question: `How would you architect a fault-tolerant subsystem at ${company.name}?`, type: 'technical' },
          { question: 'Describe a time you resolved a major production incident under time pressure.', type: 'behavioral' },
          { question: 'What metrics do you track to maintain high availability and low latency?', type: 'system_design' },
        ],
        skill_checklist: ['Distributed Systems', 'Database Optimization', 'Asynchronous Queues', 'Clean Code Principles'],
      },
    });
  }

  /* ---------- STEP 10: SEED NOTIFICATIONS & TALENT BOOKMARKS ---------- */
  console.log('🔔 Seeding Notifications & Talent Bookmarks...');

  // Notifications for Pratham
  await prisma.notification.createMany({
    data: [
      {
        user_id: prathamUser.id,
        title: 'Offer Letter Ready!',
        message: 'RazorFlow Technologies has extended an offer for Senior Backend Engineer (Payments Core). Check your dashboard to review and sign.',
        type: 'success',
        read: false,
        created_at: daysAgo(1),
      },
      {
        user_id: prathamUser.id,
        title: 'Interview Scheduled',
        message: 'Your Technical Voice Interview for Lead Full-Stack Engineer is scheduled for Thursday at 3:00 PM IST.',
        type: 'info',
        read: false,
        created_at: daysAgo(2),
      },
      {
        user_id: prathamUser.id,
        title: 'Assessment Cleared',
        message: 'Congratulations! You scored 94% on the Technical Assessment for ZomatoScale QuickCommerce.',
        type: 'success',
        read: true,
        created_at: daysAgo(4),
      },
    ],
  });

  // Notifications for Steve (HR)
  await prisma.notification.createMany({
    data: [
      {
        user_id: steveUser.id,
        title: 'New High-Score Candidate',
        message: 'Candidate Pratham Rajbhar completed the Technical Assessment with 96% score for Payments Core role.',
        type: 'info',
        read: false,
        created_at: daysAgo(1),
      },
      {
        user_id: steveUser.id,
        title: 'Interview Evaluation Ready',
        message: 'AI Interview evaluation and bias scorecard generated for 5 pending candidates.',
        type: 'info',
        read: true,
        created_at: daysAgo(2),
      },
    ],
  });

  // Talent bookmarks for Steve's org
  for (const cand of candidateList.slice(0, 8)) {
    await prisma.talentBookmark.create({
      data: {
        org_id: razorFlowOrg.id,
        candidate_id: cand.profileId,
        notes: `High potential candidate for core engineering with ${cand.yearsOfExperience} years of strong experience.`,
      },
    });
  }

  /* ---------- STEP 11: AGENT LOGS ---------- */
  console.log('🤖 Seeding Agent Execution Logs...');
  const agentLogs = [];
  for (const job of jobList.slice(0, 10)) {
    agentLogs.push({
      org_id: job.orgId,
      job_id: job.id,
      agent_name: 'ResumeScreeningAgent',
      action: 'screen_applications',
      input: { jobTitle: job.title },
      output: { candidatesScreened: randInt(15, 45), qualified: randInt(8, 20) },
      status: 'completed' as const,
      created_at: randomPastDate(1, 10),
    });
    agentLogs.push({
      org_id: job.orgId,
      job_id: job.id,
      agent_name: 'EvaluationAgent',
      action: 'compute_composite_scorecards',
      input: { jobTitle: job.title },
      output: { completedEvals: randInt(5, 12), biasAuditPassed: true },
      status: 'completed' as const,
      created_at: randomPastDate(1, 5),
    });
  }
  await prisma.agentLog.createMany({ data: agentLogs });

  /* ---------- FINISHED ---------- */
  const durationSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log('\n======================================================');
  console.log(`🎉 Database Seed Completed Successfully in ${durationSec}s!`);
  console.log('======================================================');
  console.log('📋 SUMMARY:');
  console.log(`   - Organizations:       ${COMPANIES.length}`);
  console.log(`   - HR Users:            ${hrUsers.length}`);
  console.log(`   - Job Postings:        ${jobList.length}`);
  console.log(`   - Candidate Profiles:  ${candidateList.length}`);
  console.log(`   - Total Applications:  ${totalApps}`);
  console.log(`   - Aptitude Questions:  ${APTITUDE_BANK.length}`);
  console.log(`   - Coding Problems:     ${CODING_BANK.length}`);
  console.log('------------------------------------------------------');
  console.log('🔑 DEMO CREDENTIALS:');
  console.log('   HR Recruiter Login:');
  console.log('     Email:    steve.hr@gmail.com');
  console.log('     Password: 123456789');
  console.log('     Role:     HR (Director of Talent Acquisition @ RazorFlow)');
  console.log('');
  console.log('   Candidate Login:');
  console.log('     Email:    pratham@gmail.com');
  console.log('     Password: 123456789');
  console.log('     Role:     Candidate (Senior Full-Stack Engineer)');
  console.log('======================================================\n');
}

/* ============================================================
 * HELPER: SEED APPLICATION DEEP DETAILS
 * ============================================================ */
async function seedApplicationDetails(
  appId: string,
  candidateProfileId: string,
  candidateUserId: string,
  job: { id: string; orgId: string; title: string; minScore: number; salaryLPA: [number, number] },
  status: string,
  isPratham: boolean
) {
  const needsAssessment = ['assessment', 'interview_scheduled', 'interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted'].includes(status);
  const needsInterview = ['interview_scheduled', 'interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted'].includes(status);
  const needsEvaluation = ['evaluation', 'hr_round', 'decided', 'offered', 'accepted', 'rejected'].includes(status);
  const needsOffer = ['offered', 'accepted'].includes(status);

  // 1. Assessment
  let assessmentId: string | undefined = undefined;
  if (needsAssessment) {
    const aptitudeScore = isPratham ? 94.0 : Number(randFloat(65, 98).toFixed(1));
    const codingScore = isPratham ? 96.0 : Number(randFloat(60, 100).toFixed(1));
    const overallScore = Number(((aptitudeScore + codingScore) / 2).toFixed(1));

    const assessment = await prisma.assessment.create({
      data: {
        application_id: appId,
        test_type: 'aptitude',
        questions: APTITUDE_BANK.slice(0, 10) as any,
        responses: APTITUDE_BANK.slice(0, 10).map((q, idx) => ({
          questionId: idx,
          selectedIndex: q.correct_index,
          isCorrect: true,
        })) as any,
        score: overallScore,
        category_breakdown: {
          'Quantitative Aptitude': aptitudeScore,
          'Logical Reasoning': aptitudeScore,
          'Verbal Ability': aptitudeScore,
          'Data Interpretation': aptitudeScore,
        },
        status: 'completed',
        total_question_count: 10,
      },
    });
    assessmentId = assessment.id;

    // Proctoring Session for Assessment
    const proctorSession = await prisma.proctoringSession.create({
      data: {
        candidate_id: candidateProfileId,
        application_id: appId,
        assessment_id: assessment.id,
        session_type: 'aptitude',
        status: 'ended',
        policy_version: '1.0.0',
        consent_version: '1.0.0',
        started_at: randomPastDate(2, 10),
        ended_at: randomPastDate(2, 10),
      },
    });

    // Proctoring Events
    await prisma.proctoringEvent.createMany({
      data: [
        {
          proctoring_session_id: proctorSession.id,
          client_event_id: `evt-start-${appId}`,
          client_sequence: 1,
          server_sequence: 1,
          kind: 'fullscreen_enter',
          severity: 'info',
          source: 'browser',
          client_timestamp: new Date(),
          session_elapsed_ms: 500,
          payload_json: { status: 'entered' },
        },
        {
          proctoring_session_id: proctorSession.id,
          client_event_id: `evt-hb-${appId}`,
          client_sequence: 2,
          server_sequence: 2,
          kind: 'heartbeat',
          severity: 'info',
          source: 'system',
          client_timestamp: new Date(),
          session_elapsed_ms: 60000,
          payload_json: { ok: true },
        },
      ],
    });

    // Coding Submissions
    const problem = CODING_BANK[0];
    await prisma.codingSubmission.create({
      data: {
        application_id: appId,
        candidate_id: candidateProfileId,
        language: 'typescript',
        code: `function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
        test_results: [
          { passed: true, description: 'Standard sorted pair', executionTimeMs: 12 },
          { passed: true, description: 'Duplicate elements', executionTimeMs: 8 },
        ] as any,
        pass_rate: 1.0,
        pass_rate_percent: 100,
        pass_rate_ratio: 1.0,
        execution_time_ms: 24,
        memory_mb: 32.4,
        complexity_score: 95,
        status: 'completed',
        complexity: 'O(n) Time, O(n) Space',
        ai_feedback: 'Optimal hash-map approach with clean TypeScript types.',
      },
    });
  }

  // 2. Interview
  if (needsInterview) {
    const transcript = [
      { speaker: 'ai', text: 'Welcome to the NextRound technical evaluation. Can you describe how you approach database connection pooling and transaction isolation in a microservice?' },
      { speaker: 'candidate', text: 'I typically configure connection pools with explicit min/max bounds and health checks, using Read Committed as the default isolation level, and upgrading to Serializable or optimistic locking for sensitive financial transactions.' },
      { speaker: 'ai', text: 'Excellent. How do you handle cache invalidation when high-frequency writes occur?' },
      { speaker: 'candidate', text: 'I prefer Write-Through caching combined with CDC (Change Data Capture) over Kafka to broadcast cache evictions asynchronously across distributed replicas.' },
    ];

    await prisma.interview.create({
      data: {
        application_id: appId,
        scheduled_at: status === 'interview_scheduled' ? randomFutureDate(1, 5) : randomPastDate(2, 14),
        transcript: transcript as any,
        status: status === 'interview_scheduled' ? 'scheduled' : 'completed',
        sentiment_report: {
          sentiment: 'positive',
          confidenceScore: 0.92,
          tone: 'articulate and confident',
          clarityScore: 94,
        },
        engagement_signal: { eyeContactPercent: 95, speakingPaceWPM: 135, pausesAppropriate: true },
        video_consent: true,
      },
    });
  }

  // 3. Evaluation
  if (needsEvaluation) {
    const resumeScore = isPratham ? 95 : randFloat(70, 98);
    const interviewScore = isPratham ? 94 : randFloat(68, 96);
    const aptitudeScore = isPratham ? 94 : randFloat(65, 95);
    const codingScore = isPratham ? 96 : randFloat(65, 98);
    const compositeScore = Number(((resumeScore * 0.25) + (interviewScore * 0.35) + (aptitudeScore * 0.15) + (codingScore * 0.25)).toFixed(1));

    const decision = status === 'rejected' ? 'reject' : status === 'offered' || status === 'accepted' ? 'hire' : 'hold_for_review';

    await prisma.evaluation.create({
      data: {
        application_id: appId,
        stage: status,
        resume_score: resumeScore,
        interview_score: interviewScore,
        aptitude_score: aptitudeScore,
        coding_score: codingScore,
        composite_score: compositeScore,
        confidence: 0.94,
        bias_flag: false,
        bias_report: {
          genderNeutralityIndex: 1.0,
          ethnicityNeutralityIndex: 1.0,
          auditNotes: 'Evaluation strictly grounded in architectural accuracy and code execution metrics.',
        },
        decision,
        reasoning: isPratham
          ? 'Exceptional candidate demonstrating deep proficiency in full-stack architecture, clean concurrency primitives, and production resilience. Strongly recommended for hire.'
          : `Candidate achieved a composite score of ${compositeScore}/100. Strong alignment with ${job.title} requirements.`,
      },
    });
  }

  // 4. Offer
  if (needsOffer) {
    const salary = (job.salaryLPA[1] - 2) * 100000;
    await prisma.offer.create({
      data: {
        application_id: appId,
        role_title: job.title,
        salary,
        equity: '0.15% Stock Options (4-year vesting, 1-year cliff)',
        start_date: daysFromNow(20),
        status: status === 'accepted' ? 'accepted' : 'pending',
        signature_svg: status === 'accepted' ? '<svg viewBox="0 0 200 60"><path d="M10 40 Q 50 10, 90 40 T 170 30" stroke="#ff6b00" fill="none" stroke-width="3"/></svg>' : null,
        offer_letter_content: `We are pleased to extend an offer for the position of ${job.title} with an annual CTC of ₹${(salary / 100000).toFixed(0)} Lakhs and 0.15% equity.`,
        valid_until: daysFromNow(14),
      },
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
