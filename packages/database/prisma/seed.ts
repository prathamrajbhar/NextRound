import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient, Prisma } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Load dotenv before seeding.');
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

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
    hrTeamSize: 1,
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
    hrTeamSize: 1,
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
    hrTeamSize: 1,
    settings: {
      autoOfferEnabled: true,
      defaultThreshold: 80,
      defaultVoice: 'Nova',
      domain: 'zomatoscale.tech',
      hiringSlack: '#zomato-talent',
    },
  },
  {
    name: 'Google Cloud India',
    industry: 'Hyperscale Cloud & Platform Engineering',
    size: '1000+ employees',
    domain: 'google.co.in',
    logoSeed: '1509391366360-2e959784a276',
    tagline: 'Building infrastructure for the next billion users',
    cultureNotes:
      'Google Cloud India builds products for scale, reliability, and enterprise compliance. Highly structured engineering process with a strong emphasis on testing, security, and global coordination.',
    hrTeamSize: 1,
    settings: {
      autoOfferEnabled: false,
      defaultThreshold: 88,
      defaultVoice: 'Serena',
      domain: 'google.co.in',
      hiringSlack: '#gcp-india-jobs',
    },
  },
];

type Domain = 'frontend' | 'backend' | 'fullstack' | 'ai' | 'devops' | 'mobile' | 'data' | 'product' | 'security';

interface DomainDef {
  key: Domain;
  label: string;
  skills: string[];
  roles: string[];
  salaryLPA: [number, number];
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
  description: string;
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
    description: `## About the Role
RazorFlow is seeking a Senior Backend Engineer for our core Payments Infrastructure team. In this role, you will design, implement, and maintain high-throughput transactional APIs that process millions of requests daily. You will work on optimizing database isolation levels, preventing race conditions during ledger updates, and engineering robust retry mechanisms for payment gateways.

## Key Responsibilities
* Architect and implement scalable APIs in Go/Rust to support new payment methods.
* Optimize database locks and transaction strategies on PostgreSQL to handle concurrent transactions.
* Build low-latency event processing systems using Kafka for real-time ledger updates.
* Collaborate with security teams to enforce strict PCI-DSS compliance standards.

## Required Skills
* 5+ years of software development experience with Go, Rust, or C++.
* Expert-level understanding of PostgreSQL, query tuning, and connection pooling.
* Deep knowledge of distributed message brokers, specifically Apache Kafka or RabbitMQ.
* Experience with distributed tracing, logging, and system observability tools.

## What We Offer
- Competitive salary (₹30 LPA - ₹48 LPA) + generous equity options.
- Hybrid working environment in our state-of-the-art Bengaluru office.
- Comprehensive health insurance cover for employee and family.
- Annual learning and professional development budget.`,
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
    status: 'active',
    keyRequirements: ['Next.js App Router, TypeScript, React Server Components', 'Node.js/Express backend APIs, PostgreSQL, Redis caching', 'Micro-frontend architecture and PCI-DSS compliance'],
    description: `## About the Role
We are looking for a Lead Full-Stack Engineer to own the Next-Gen Merchant Portal. This platform is the primary interface for thousands of merchants using RazorFlow. You will lead the transition to a micro-frontend architecture, optimize core web vitals, and bridge the gap between frontend experiences and backend microservices.

## Key Responsibilities
* Lead the engineering of the merchant dashboard using Next.js App Router and TypeScript.
* Design and implement high-performance GraphQL and REST APIs in Node.js/Express.
* Optimize web performance to achieve sub-second page loads and improve SEO scores.
* Mentor junior engineers and champion clean code, TDD, and modular architecture.

## Required Skills
* 6+ years of full-stack development experience, with deep expertise in React/Next.js.
* Proficient in TypeScript, CSS/Tailwind, and modern state-management libraries (Zustand/Redux).
* Strong backend skills with Node.js, Express, and relational databases.
* Familiarity with Docker, CI/CD pipelines, and cloud deployment strategies.

## What We Offer
- Salary range of ₹35 LPA - ₹55 LPA with equity incentives.
- Standard health benefits, flexible remote-work options.
- Collaborative, high-velocity engineering culture.`,
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
    status: 'active',
    keyRequirements: ['Zero-trust security architecture', 'Kubernetes cluster hardening and mTLS', 'Automated security scanning in CI/CD pipelines'],
    description: `## About the Role
As a Staff Security Engineer, you will define the security posture for the entire RazorFlow platform. You will build secure defaults, design zero-trust networks, and automate vulnerability detection within our CI/CD pipelines. This is a high-impact leadership role reporting directly to the Head of Engineering.

## Key Responsibilities
* Architect and maintain zero-trust network boundaries across multiple Kubernetes clusters.
* Perform threat modeling, code audits, and vulnerability reviews of core payment services.
* Design and implement secure secrets management using HashiCorp Vault.
* Set up automated SAST/DAST checks and compliance monitoring in Jenkins/GitHub Actions.

## Required Skills
* 7+ years of dedicated AppSec or Cloud Security engineering experience.
* Expert knowledge of Kubernetes security runtime hardening and service meshes (Istio/mTLS).
* Proficiency in scripting and automation (Python, Go, or Bash).
* Industry certifications such as OSCP, CISSP, or CKS are highly regarded.

## What We Offer
- Premier compensation package of ₹40 LPA - ₹65 LPA.
- Executive healthcare benefits, wellness initiatives.
- Sponsorship for security conferences and professional training.`,
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
    status: 'active',
    keyRequirements: ['Rust or Go systems programming', 'Kubernetes CRI/CNI plugin development', 'eBPF networking and low-latency RPCs'],
    description: `## About the Role
NexusCloud is building a serverless container runtime for high-performance computing workloads. As a Distributed Systems Engineer, you will help design our control plane, write custom network plugins, and optimize container start-up times to the millisecond.

## Key Responsibilities
* Build and scale low-latency container orchestration agents in Go/Rust.
* Develop custom Kubernetes CNI and CSI plugins for optimal resource management.
* Implement eBPF-based kernel networking hooks to trace and route inter-pod packets.
* Optimize host-level memory virtualization and CPU isolation strategies.

## Required Skills
* 4+ years of low-level systems programming experience in Go, C, or Rust.
* Deep understanding of Linux kernel internals, namespaces, cgroups, and virtualization.
* Experience contributing to upstream open-source projects like Kubernetes, containerd, or Envoy.
* Solid grasp of distributed consensus algorithms (Raft, Paxos).

## What We Offer
- Annual package of ₹28 LPA - ₹45 LPA + equity.
- Flexible work options out of our modern Hyderabad hub.
- High-end developer workstation setup (M3 Max or Linux Workstation).`,
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
    status: 'active',
    keyRequirements: ['LLM inference optimization (vLLM, TensorRT-LLM)', 'Distributed training pipelines with PyTorch and Ray', 'Vector search indexing at billion-vector scale'],
    description: `## About the Role
We are seeking a Senior AI Systems Architect to design our large-scale GPU cluster orchestration layer. You will work on accelerating LLM inference speeds, optimizing memory bandwidth during multi-node GPU training, and building scalable model-serving APIs.

## Key Responsibilities
* Design model-serving infrastructure using vLLM, TensorRT-LLM, and Triton Inference Server.
* Build and scale distributed LLM fine-tuning pipelines using PyTorch and Ray.
* Implement low-latency vector indexing solutions with Milvus, Qdrant, or Pinecone.
* Collaborate with hardware teams to maximize GPU utilization and minimize scheduling overhead.

## Required Skills
* 5+ years of experience in ML Systems, High-Performance Computing, or MLOps.
* Proficient in Python, C++, PyTorch, and deep learning framework internals.
* Expert knowledge of GPU architectures, CUDA programming, and NCCL networking.
* Experience with cloud orchestration tools (Kubernetes, Terraform).

## What We Offer
- Highly competitive package of ₹45 LPA - ₹75 LPA.
- Performance-based bonuses and significant equity.
- Access to cutting-edge GPU clusters for testing and research.`,
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
    status: 'active',
    keyRequirements: ['Sub-second First Contentful Paint optimization', 'React 19, Next.js, Web Vitals profiling', 'State synchronization across real-time order tracking'],
    description: `## About the Role
ZomatoScale is building the fastest delivery experience in India. We are looking for a Senior Frontend Architect to optimize our consumer web and mobile web apps. You will own the bundle size budget, configure advanced caching strategies, and build smooth, real-time tracking dashboards that render beautifully even on low-end mobile devices.

## Key Responsibilities
* Lead the architecture of our React 19 / Next.js web application for maximum speed.
* Optimize bundle sizes, code-splitting strategies, and core web vitals (LCP, FID, CLS).
* Implement real-time WebSockets integration for live delivery tracking and countdowns.
* Collaborate with UX designers to build highly responsive, motion-heavy interfaces.

## Required Skills
* 6+ years of frontend expertise with React, TypeScript, and modern JS build tools (Vite/Webpack).
* Deep understanding of browser rendering paths, layout reflows, and performance profiling.
* Experience building progressive web applications (PWAs) and mobile-optimized layouts.
* Strong aesthetic sense and dedication to user experience details.

## What We Offer
- Excellent salary (₹32 LPA - ₹50 LPA) + quick commerce delivery credits.
- Gurgaon-based role with standard health and wellness benefits.
- Vibrant, fast-paced work culture with immediate product feedback loops.`,
  },
  {
    orgName: 'Google Cloud India',
    title: 'Cloud Infrastructure Engineer (Kubernetes Core)',
    domain: 'devops',
    city: 'Bengaluru',
    exp: '4-7 years',
    salaryLPA: [35, 60],
    minScore: 88,
    autoOffer: false,
    status: 'active',
    keyRequirements: ['Upstream Kubernetes contributions', 'Golang systems programming', 'Linux kernel namespace isolation and cgroups'],
    description: `## About the Role
Google Cloud India is seeking a Cloud Infrastructure Engineer for our Kubernetes Core development team. You will work directly on contributing code to upstream Kubernetes, design managed services (GKE) features, and help enterprise customers optimize their cluster operations.

## Key Responsibilities
* Develop, test, and maintain features for core GKE and upstream Kubernetes repositories.
* Write robust control loop controllers in Go and optimize API server responsiveness.
* Debug complex host-level networking, storage, and container runtime issues.
* Author technical whitepapers and mentor community contributors.

## Required Skills
* 5+ years of system engineering experience, with strong proficiency in Go.
* Proven track record of upstream contributions to Kubernetes or related CNCF projects.
* Deep knowledge of Linux systems programming, networking stack, and container runtimes.
* Excellent technical writing and open-source communication skills.

## What We Offer
- Competitive package (₹35 LPA - ₹60 LPA) with top-tier benefits.
- Global collaboration opportunities across Google offices.
- Generous learning allowances and matching charity contributions.`,
  },
];

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
  {
    category: 'Quantitative Aptitude',
    difficulty: 'medium',
    question: 'A work partner can complete a database migration in 6 hours, while another takes 8 hours. If they collaborate, how long will it take to finish the migration?',
    options: ['3.43 hours', '3.8 hours', '4.2 hours', '4.5 hours'],
    correct_index: 0,
    explanation: 'Rate 1 = 1/6, Rate 2 = 1/8. Combined rate = 1/6 + 1/8 = 7/24. Time taken = 24/7 ≈ 3.43 hours.',
    tags: ['work-rates', 'concurrency'],
  },
  {
    category: 'Quantitative Aptitude',
    difficulty: 'hard',
    question: 'A startup allocates 12% of its compute budget to storage, 28% to databases, and the remaining ₹15,00,000 to GPU training clusters. What is the total compute budget?',
    options: ['₹20,00,000', '₹22,00,000', '₹25,00,000', '₹30,00,000'],
    correct_index: 2,
    explanation: 'Remaining budget percentage = 100% - (12% + 28%) = 60%. If 60% is ₹15,00,000, then total budget = 15,00,000 / 0.60 = ₹25,00,000.',
    tags: ['percentages', 'startup-finance'],
  },
  {
    category: 'Logical Reasoning',
    difficulty: 'medium',
    question: 'In a microservice call graph: Service A calls B and C. Service B calls D and E. Service C calls F. If Service D fails, which services are directly or transitively affected?',
    options: ['Only D', 'Only B and D', 'A, B, and D', 'B, C, and D'],
    correct_index: 2,
    explanation: 'Service D is called by B, which is called by A. Thus, failure of D transitively affects B and A.',
    tags: ['graphs', 'system-dependencies'],
  },
  {
    category: 'Logical Reasoning',
    difficulty: 'hard',
    question: 'If all compiled binaries are executable, and some executable files are scripts, which of the following must be true?',
    options: ['All scripts are compiled binaries', 'Some compiled binaries are scripts', 'Some scripts are executable', 'No compiled binaries are scripts'],
    correct_index: 2,
    explanation: 'Since some executable files are scripts, it directly follows that some scripts are executable.',
    tags: ['syllogism', 'logic'],
  },
  {
    category: 'Verbal Ability',
    difficulty: 'medium',
    question: 'Choose the word that is most opposite in meaning to "MUTABLE" in system architectures:',
    options: ['Immutable', 'Ephemeral', 'Volatile', 'Dynamic'],
    correct_index: 0,
    explanation: 'Mutable means liable to change; its direct antonym in system design is Immutable (unchanging).',
    tags: ['vocabulary', 'architecture'],
  },
  {
    category: 'Verbal Ability',
    difficulty: 'hard',
    question: 'Select the correct word to complete the sentence: The architect\'s proposal was _______, addressing both the immediate latency issues and the long-term scalability concerns.',
    options: ['superficial', 'comprehensive', 'redundant', 'transient'],
    correct_index: 1,
    explanation: 'Comprehensive means complete or broad in scope, which fits the context of addressing both immediate and long-term concerns.',
    tags: ['sentence-completion', 'comprehension'],
  },
  {
    category: 'Data Interpretation',
    difficulty: 'medium',
    question: 'An API gateway records the following request latency over four hours: 40ms, 85ms, 120ms, 75ms. What is the average request latency?',
    options: ['75ms', '80ms', '85ms', '90ms'],
    correct_index: 1,
    explanation: 'Average = (40 + 85 + 120 + 75) / 4 = 320 / 4 = 80ms.',
    tags: ['statistics', 'latency'],
  },
  {
    category: 'Data Interpretation',
    difficulty: 'hard',
    question: 'In a load test, server memory utilization grows by 5% every 10 minutes. If it starts at 40% utilization, how long will it take to reach 80% utilization?',
    options: ['60 minutes', '80 minutes', '100 minutes', '120 minutes'],
    correct_index: 1,
    explanation: 'Growth needed = 80% - 40% = 40%. At 5% per 10 minutes, it will take (40 / 5) * 10 = 80 minutes.',
    tags: ['data-growth', 'load-testing'],
  },
];

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
  {
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    category: 'Arrays & Intervals',
    difficulty: 'medium',
    tags: ['array', 'sorting', 'intervals'],
    description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

### Example:
\`\`\`
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].
\`\`\``,
    starter_code: {
      python: 'def merge(intervals: list[list[int]]) -> list[list[int]]:\n    # Write your solution here\n    pass\n',
      javascript: 'function merge(intervals) {\n  // Write your solution here\n}\n',
      typescript: 'function merge(intervals: number[][]): number[][] {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n  public int[][] merge(int[][] intervals) {\n    return new int[0][0];\n  }\n}\n',
      cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n  vector<vector<int>> merge(vector<vector<int>>& intervals) {\n    return {};\n  }\n};\n',
    },
    entry_point: 'merge',
    public_tests: [
      { input: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]], description: 'Standard intervals overlap' },
      { input: [[[1, 4], [4, 5]]], expected: [[1, 5]], description: 'Adjoining intervals' },
    ],
    hidden_tests: [
      { input: [[[1, 4], [2, 3]]], expected: [[1, 4]], description: 'Fully enclosed interval' },
      { input: [[[1, 10]]], expected: [[1, 10]], description: 'Single interval' },
    ],
    reference_solution: {
      python: 'def merge(intervals):\n    if not intervals: return []\n    intervals.sort(key=lambda x: x[0])\n    merged = [intervals[0]]\n    for current in intervals[1:]:\n      prev_start, prev_end = merged[-1]\n      curr_start, curr_end = current\n      if curr_start <= prev_end:\n        merged[-1][1] = max(prev_end, curr_end)\n      else:\n        merged.append(current)\n    return merged',
    },
  },
  {
    slug: 'search-in-rotated-sorted-array',
    title: 'Search in Rotated Sorted Array',
    category: 'Binary Search',
    difficulty: 'medium',
    tags: ['array', 'binary-search'],
    description: `There is an integer array \`nums\` sorted in ascending order (with distinct values). Prior to being passed to your function, \`nums\` is possibly rotated at an unknown pivot index.

Given the array \`nums\` after the possible rotation and an integer \`target\`, return the index of \`target\` if it is in \`nums\`, or \`-1\` if it is not in \`nums\`. You must write an algorithm with \`O(log n)\` runtime complexity.

### Example:
\`\`\`
Input: nums = [4,5,6,7,0,1,2], target = 0
Output: 4
\`\`\``,
    starter_code: {
      python: 'def search(nums: list[int], target: int) -> int:\n    # Write your solution here\n    pass\n',
      javascript: 'function search(nums, target) {\n  // Write your solution here\n}\n',
      typescript: 'function search(nums: number[], target: number): number {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n  public int search(int[] nums, int target) {\n    return -1;\n  }\n}\n',
      cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n  int search(vector<int>& nums, int target) {\n    return -1;\n  }\n};\n',
    },
    entry_point: 'search',
    public_tests: [
      { input: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4, description: 'Target exists in right half' },
      { input: [[4, 5, 6, 7, 0, 1, 2], 3], expected: -1, description: 'Target does not exist' },
    ],
    hidden_tests: [
      { input: [[1], 0], expected: -1, description: 'Single element array target not found' },
      { input: [[1], 1], expected: 0, description: 'Single element array target found' },
      { input: [[6, 7, 1, 2, 3, 4, 5], 6], expected: 0, description: 'Target is the first element before rotation' },
    ],
    reference_solution: {
      python: 'def search(nums, target):\n    left, right = 0, len(nums) - 1\n    while left <= right:\n      mid = (left + right) // 2\n      if nums[mid] == target: return mid\n      if nums[left] <= nums[mid]:\n        if nums[left] <= target < nums[mid]:\n          right = mid - 1\n        else:\n          left = mid + 1\n      else:\n        if nums[mid] < target <= nums[right]:\n          left = mid + 1\n        else:\n          right = mid - 1\n    return -1',
    },
  },
];

async function main(): Promise<void> {
  const startedAt = Date.now();
  console.log('🚀 Starting NextRound database cleanup and seed...');

  console.log('🧹 Wiping complete database cleanly...');
  await prisma.proctoringViolation.deleteMany({});
  await prisma.proctoringEvent.deleteMany({});
  await prisma.proctoringSession.deleteMany({});
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

  const defaultPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

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

  console.log('👤 Creating HR Recruiter Accounts...');
  const hrUsers: Array<{ id: string; email: string; name: string; orgId: string; orgName: string }> = [];

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

  const nexusOrg = orgMap.get('NexusCloud Labs')!;
  const sarahUser = await prisma.user.create({
    data: {
      email: 'sarah.hr@gmail.com',
      password_hash: defaultPasswordHash,
      role: 'hr',
      org_id: nexusOrg.id,
      profile: {
        name: 'Sarah Jenkins',
        avatarUrl: avatarUrl('1494790108377-be9c29b29330'),
        title: 'Lead Talent Acquisition Partner',
        timezone: 'Asia/Kolkata',
        location: 'Bengaluru, India',
        linkedinUrl: 'https://linkedin.com/in/sarah-jenkins-nexus',
        phone: '+91 98765 43211',
        specialties: ['Distributed Systems', 'Cloud & AI Talent'],
        languages: ['English', 'Telugu'],
      },
    },
  });
  hrUsers.push({
    id: sarahUser.id,
    email: 'sarah.hr@gmail.com',
    name: 'Sarah Jenkins',
    orgId: nexusOrg.id,
    orgName: nexusOrg.def.name,
  });

  const zomatoOrg = orgMap.get('ZomatoScale QuickCommerce')!;
  const rohitUser = await prisma.user.create({
    data: {
      email: 'rohit.hr@gmail.com',
      password_hash: defaultPasswordHash,
      role: 'hr',
      org_id: zomatoOrg.id,
      profile: {
        name: 'Rohit Sharma',
        avatarUrl: avatarUrl('1500648767791-00dcc994a43e'),
        title: 'Senior Technical Talent Partner',
        timezone: 'Asia/Kolkata',
        location: 'Gurgaon, India',
        linkedinUrl: 'https://linkedin.com/in/rohit-sharma-talent',
        phone: '+91 98765 43212',
        specialties: ['High-Scale Web & Mobile', 'Frontend Engineering'],
        languages: ['English', 'Hindi'],
      },
    },
  });
  hrUsers.push({
    id: rohitUser.id,
    email: 'rohit.hr@gmail.com',
    name: 'Rohit Sharma',
    orgId: zomatoOrg.id,
    orgName: zomatoOrg.def.name,
  });

  const googleOrg = orgMap.get('Google Cloud India')!;
  const anitaUser = await prisma.user.create({
    data: {
      email: 'anita.hr@gmail.com',
      password_hash: defaultPasswordHash,
      role: 'hr',
      org_id: googleOrg.id,
      profile: {
        name: 'Anita Desai',
        avatarUrl: avatarUrl('1531123897727-8f129e1688ce'),
        title: 'Staff Talent Advisor',
        timezone: 'Asia/Kolkata',
        location: 'Bengaluru, India',
        linkedinUrl: 'https://linkedin.com/in/anita-desai-gcp',
        phone: '+91 98765 43213',
        specialties: ['Site Reliability Engineering', 'DevOps & Infrastructure'],
        languages: ['English', 'Marathi'],
      },
    },
  });
  hrUsers.push({
    id: anitaUser.id,
    email: 'anita.hr@gmail.com',
    name: 'Anita Desai',
    orgId: googleOrg.id,
    orgName: googleOrg.def.name,
  });

  console.log(`✅ Seeded ${hrUsers.length} HR Recruiter Accounts.`);

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
        description: tpl.description,
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

  const OTHER_CANDIDATES = [
    {
      email: 'priya.sharma@gmail.com',
      name: 'Priya Sharma',
      headline: 'Senior Frontend Engineer | React & WebGL Expert',
      phone: '+91 98765 12345',
      location: 'Bengaluru, India',
      timezone: 'Asia/Kolkata',
      bio: 'Frontend engineering specialist with 8 years of experience building high-performance web systems, custom WebGL canvas dashboards, and designing enterprise-grade components. React, Next.js, and Tailwind expert.',
      skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'WebGL', 'Three.js', 'Zustand', 'HTML5', 'CSS3', 'Performance Tuning'],
      targetRoles: ['Senior Frontend Engineer', 'Frontend UI Architect'],
      yoe: 8.0,
      workMode: 'Hybrid (Bengaluru)',
      currentCtc: 2400000,
      expectedSalary: 3500000,
      noticePeriod: '30 days',
      workAuthorization: 'Indian Citizen',
      proudProject: 'Built credit card kinetics screen with customized physics engine using WebGL and Canvas 2D, handling 100k daily active users.',
      workValues: ['UX Excellence', 'Pixel Perfection', 'Fast Execution'],
      domain: 'frontend' as const,
    },
    {
      email: 'amit.patel@gmail.com',
      name: 'Amit Patel',
      headline: 'Senior Platform Engineer | Go, Kubernetes & Kafka',
      phone: '+91 98234 56789',
      location: 'Pune, India',
      timezone: 'Asia/Kolkata',
      bio: 'Systems-focused software engineer with 6 years of experience building reliable infrastructure, distributed data ingestion pipelines, and automating Kubernetes container runtimes. Passionate about performance and system safety.',
      skills: ['Go', 'Kubernetes', 'Docker', 'Kafka', 'PostgreSQL', 'Redis', 'gRPC', 'AWS', 'Terraform', 'Prometheus'],
      targetRoles: ['Senior Systems Engineer', 'Platform Engineer'],
      yoe: 6.0,
      workMode: 'Hybrid (Pune)',
      currentCtc: 2200000,
      expectedSalary: 3200000,
      noticePeriod: '15 days',
      workAuthorization: 'Indian Citizen',
      proudProject: 'Designed a high-throughput event processing engine using Go and Kafka that reduced message latency by 60% at scale.',
      workValues: ['Simplicity', 'Reliability', 'System Observability'],
      domain: 'backend' as const,
    },
    {
      email: 'ananya.iyer@gmail.com',
      name: 'Ananya Iyer',
      headline: 'Frontend Developer | React, TypeScript & CSS',
      phone: '+91 98456 78901',
      location: 'Chennai, India',
      timezone: 'Asia/Kolkata',
      bio: 'Passionate and details-oriented Frontend Developer with 2 years of experience. Excited about building clean, accessible user interfaces and writing modular, well-tested TypeScript code.',
      skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'CSS3', 'HTML5', 'Redux Toolkit', 'Jest', 'Git'],
      targetRoles: ['Frontend Engineer', 'UI Developer'],
      yoe: 2.0,
      workMode: 'Remote (India)',
      currentCtc: 900000,
      expectedSalary: 1300000,
      noticePeriod: 'Immediate',
      workAuthorization: 'Indian Citizen',
      proudProject: 'Re-designed landing pages and sign-up flows for an e-commerce brand, boosting conversions by 22%.',
      workValues: ['Continuous Learning', 'User Empathy', 'Collaboration'],
      domain: 'frontend' as const,
    },
    {
      email: 'vikram.reddy@gmail.com',
      name: 'Vikram Reddy',
      headline: 'Principal Security Architect | DevSecOps & Hardening',
      phone: '+91 98567 89012',
      location: 'Hyderabad, India',
      timezone: 'Asia/Kolkata',
      bio: 'Security professional with 9 years of experience. Specializing in threat modeling, Kubernetes runtime hardening, mTLS implementation, and setting up secure CI/CD pipelines. Advocate of Zero Trust philosophy.',
      skills: ['Application Security', 'DevSecOps', 'Kubernetes Security', 'OAuth2/OIDC', 'Terraform', 'Vault', 'OWASP', 'Penetration Testing', 'CI/CD Hardening'],
      targetRoles: ['Staff Security Engineer', 'Principal Security Architect'],
      yoe: 9.0,
      workMode: 'Hybrid (Hyderabad)',
      currentCtc: 3200000,
      expectedSalary: 4500000,
      noticePeriod: '30 days',
      workAuthorization: 'Indian Citizen',
      proudProject: 'Led zero-trust access migration for a cloud services platform, eliminating hardcoded keys and securing 50+ microservices.',
      workValues: ['Defense in Depth', 'Automation', 'Engineering Alignment'],
      domain: 'security' as const,
    },
    {
      email: 'rahul.gupta@gmail.com',
      name: 'Rahul Gupta',
      headline: 'Software Engineer | C++, Go & Linux Systems',
      phone: '+91 98678 90123',
      location: 'Noida, India',
      timezone: 'Asia/Kolkata',
      bio: 'Software Developer with 3 years of experience. Strong foundational skills in system programming, data structures, low-level OS internals, and networking protocols. Always optimizing for memory and speed.',
      skills: ['C++', 'Go', 'Linux Internals', 'TCP/IP', 'PostgreSQL', 'Docker', 'Algorithms', 'Multithreading'],
      targetRoles: ['Software Engineer II', 'Systems Developer'],
      yoe: 3.0,
      workMode: 'In-Office',
      currentCtc: 1200000,
      expectedSalary: 1800000,
      noticePeriod: '60 days',
      workAuthorization: 'Indian Citizen',
      proudProject: 'Optimized network routing logs parser in C++, increasing throughput from 10k to 150k logs/sec.',
      workValues: ['Efficiency', 'Rigorous Testing', 'Deep Understanding'],
      domain: 'backend' as const,
    },
    {
      email: 'sneha.malhotra@gmail.com',
      name: 'Sneha Malhotra',
      headline: 'ML Systems Engineer | PyTorch, NLP & LLMs',
      phone: '+91 98789 01234',
      location: 'Gurgaon, India',
      timezone: 'Asia/Kolkata',
      bio: 'Machine learning systems researcher with 4 years of experience. Experienced in fine-tuning large language models, training distributed PyTorch workloads, and deployment optimizations with vLLM.',
      skills: ['Python', 'PyTorch', 'FastAPI', 'LangChain', 'LlamaIndex', 'vLLM', 'Vector Databases', 'Transformers', 'Docker', 'MLOps'],
      targetRoles: ['Senior Machine Learning Engineer', 'GenAI Architect'],
      yoe: 4.0,
      workMode: 'Hybrid (Gurgaon)',
      currentCtc: 2000000,
      expectedSalary: 2800000,
      noticePeriod: '30 days',
      workAuthorization: 'Indian Citizen',
      proudProject: 'Optimized internal customer support LLM pipeline utilizing vLLM, reducing latency by 40% and infrastructure cost by 25%.',
      workValues: ['Scientific Integrity', 'Ship Fast', 'Empirical Proof'],
      domain: 'ai' as const,
    },
    {
      email: 'kabir.shah@gmail.com',
      name: 'Kabir Shah',
      headline: 'DevOps & Cloud Architect | AWS & Terraform',
      phone: '+91 98890 12345',
      location: 'Mumbai, India',
      timezone: 'Asia/Kolkata',
      bio: 'Cloud Infrastructure and DevOps Architect with 6 years of experience. Expert in AWS, cloud migration, Infrastructure as Code, CI/CD pipelines orchestration, and multi-tenant environment setups.',
      skills: ['AWS', 'Terraform', 'Kubernetes', 'Docker', 'GitHub Actions', 'Jenkins', 'Ansible', 'Bash', 'Linux', 'Python'],
      targetRoles: ['Senior DevOps Engineer', 'Cloud Architect'],
      yoe: 6.0,
      workMode: 'Fully Remote',
      currentCtc: 2400000,
      expectedSalary: 3400000,
      noticePeriod: '15 days',
      workAuthorization: 'Indian Citizen',
      proudProject: 'Automated complete multi-tenant infrastructure provisioning using Terraform and Helm, cutting customer setup time from days to 10 minutes.',
      workValues: ['Infrastructure as Code', 'Self-Healing Systems', 'Security First'],
      domain: 'devops' as const,
    },
  ];

  for (const c of OTHER_CANDIDATES) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        password_hash: defaultPasswordHash,
        role: 'candidate',
      },
    });

    const profile = await prisma.candidateProfile.create({
      data: {
        user_id: user.id,
        full_name: c.name,
        headline: c.headline,
        phone: c.phone,
        location: c.location,
        timezone: c.timezone,
        bio: c.bio,
        skills: c.skills,
        target_roles: c.targetRoles,
        years_of_experience: c.yoe,
        work_mode: c.workMode,
        current_ctc: c.currentCtc,
        expected_salary: c.expectedSalary,
        target_locations: [c.location, 'Bengaluru', 'Remote (India)'],
        notice_period: c.noticePeriod,
        work_authorization: c.workAuthorization,
        proud_project: c.proudProject,
        work_values: c.workValues,
        resume_url: `https://storage.nextround.dev/resumes/${user.id}/resume.pdf`,
        github_url: `https://github.com/${slugify(c.name)}`,
        linkedin_url: `https://linkedin.com/in/${slugify(c.name)}`,
        parsed_resume: {
          education: [{ institution: 'Indian Institute of Information Technology (IIIT)', degree: 'B.Tech in Computer Science', year: 2018 }],
          experience: [
            { company: 'TechSolutions India', role: c.headline.split('|')[0].trim(), duration: '2021 - Present' },
          ],
        },
      },
    });

    candidateList.push({
      userId: user.id,
      profileId: profile.id,
      name: c.name,
      email: c.email,
      domain: c.domain,
      skills: c.skills,
      yearsOfExperience: c.yoe,
      expectedSalary: c.expectedSalary,
      location: c.location,
    });
  }
  console.log(`✅ Seeded ${candidateList.length} Candidate Profiles.`);

  console.log('📈 Generating Enterprise Hiring Funnel & Applications...');

  let totalApps = 0;

  const razorFlowBackendJob = jobList.find(j => j.title === 'Senior Backend Engineer (Payments Core)' && j.orgName === 'RazorFlow Technologies')!;
  const razorFlowFullStackJob = jobList.find(j => j.title === 'Lead Full-Stack Engineer (Merchant Portal)' && j.orgName === 'RazorFlow Technologies')!;
  const razorFlowSecurityJob = jobList.find(j => j.title === 'Staff Security Engineer (AppSec & Cloud)' && j.orgName === 'RazorFlow Technologies')!;

  const nexusCloudDistributedJob = jobList.find(j => j.title === 'Distributed Systems Engineer (Serverless Cloud)' && j.orgName === 'NexusCloud Labs')!;
  const nexusCloudAiJob = jobList.find(j => j.title === 'Senior AI Systems Architect' && j.orgName === 'NexusCloud Labs')!;

  const zomatoFrontendJob = jobList.find(j => j.title === 'Senior Frontend Architect (Consumer Web & Mobile Web)' && j.orgName === 'ZomatoScale QuickCommerce')!;

  const googleCloudK8sJob = jobList.find(j => j.title === 'Cloud Infrastructure Engineer (Kubernetes Core)' && j.orgName === 'Google Cloud India')!;

  const getCand = (email: string) => candidateList.find(c => c.email === email)!;

  const prathamCand = getCand('pratham@gmail.com');
  const priyaCand = getCand('priya.sharma@gmail.com');
  const amitCand = getCand('amit.patel@gmail.com');
  const ananyaCand = getCand('ananya.iyer@gmail.com');
  const vikramCand = getCand('vikram.reddy@gmail.com');
  const rahulCand = getCand('rahul.gupta@gmail.com');
  const snehaCand = getCand('sneha.malhotra@gmail.com');
  const kabirCand = getCand('kabir.shah@gmail.com');

  const appPratham1 = await prisma.application.create({
    data: {
      candidate_id: prathamCand.profileId,
      job_id: razorFlowBackendJob.id,
      status: 'offered',
      hr_round_status: 'passed',
      hr_round_completed_at: daysAgo(3),
      applied_at: daysAgo(14),
    }
  });
  await seedApplicationDetails(appPratham1.id, prathamCand.profileId, prathamCand.userId, razorFlowBackendJob, 'offered', true, {
    aptitudeScore: 94.0,
    codingScore: 96.0,
    interviewScore: 94.0,
    resumeScore: 95.0,
    evaluationDecision: 'hire',
    evaluationReasoning: 'Exceptional candidate demonstrating deep proficiency in full-stack architecture, clean concurrency primitives, and production resilience. Strongly recommended for hire.',
    offerSalaryLPA: 46,
  });
  totalApps++;

  const appPratham2 = await prisma.application.create({
    data: {
      candidate_id: prathamCand.profileId,
      job_id: razorFlowFullStackJob.id,
      status: 'interview_scheduled',
      hr_round_status: 'scheduled',
      hr_round_scheduled_at: daysFromNow(2),
      applied_at: daysAgo(10),
    }
  });
  await seedApplicationDetails(appPratham2.id, prathamCand.profileId, prathamCand.userId, razorFlowFullStackJob, 'interview_scheduled', true, {
    aptitudeScore: 92.0,
    codingScore: 94.0
  });
  totalApps++;

  const appPratham3 = await prisma.application.create({
    data: {
      candidate_id: prathamCand.profileId,
      job_id: nexusCloudAiJob.id,
      status: 'assessment',
      applied_at: daysAgo(8),
    }
  });
  await seedApplicationDetails(appPratham3.id, prathamCand.profileId, prathamCand.userId, nexusCloudAiJob, 'assessment', true, {
    isAssessmentPending: true
  });
  totalApps++;

  const appPratham4 = await prisma.application.create({
    data: {
      candidate_id: prathamCand.profileId,
      job_id: zomatoFrontendJob.id,
      status: 'applied',
      applied_at: daysAgo(4),
    }
  });
  totalApps++;

  const appPratham5 = await prisma.application.create({
    data: {
      candidate_id: prathamCand.profileId,
      job_id: googleCloudK8sJob.id,
      status: 'hr_round',
      hr_round_status: 'scheduled',
      hr_round_scheduled_at: daysFromNow(4),
      applied_at: daysAgo(12),
    }
  });
  await seedApplicationDetails(appPratham5.id, prathamCand.profileId, prathamCand.userId, googleCloudK8sJob, 'hr_round', true, {
    aptitudeScore: 90.0,
    codingScore: 92.0,
    interviewScore: 93.0,
    resumeScore: 91.0,
    evaluationDecision: 'hire',
    evaluationReasoning: 'Candidate cleared technical evaluations with outstanding performance in Linux internals and container orchestration. Advanced to HR round.',
  });
  totalApps++;

  const appPratham6 = await prisma.application.create({
    data: {
      candidate_id: prathamCand.profileId,
      job_id: nexusCloudDistributedJob.id,
      status: 'rejected',
      applied_at: daysAgo(15),
    }
  });
  await seedApplicationDetails(appPratham6.id, prathamCand.profileId, prathamCand.userId, nexusCloudDistributedJob, 'rejected', true, {
    aptitudeScore: 82.0,
    codingScore: 84.0,
    interviewScore: 75.0,
    resumeScore: 80.0,
    evaluationDecision: 'reject',
    evaluationReasoning: 'Candidate demonstrated strong backend skills but lacked deep low-latency Rust experience required for this specific role.',
  });
  totalApps++;

  const appPriya = await prisma.application.create({
    data: {
      candidate_id: priyaCand.profileId,
      job_id: razorFlowFullStackJob.id,
      status: 'interviewed',
      applied_at: daysAgo(5),
    }
  });
  await seedApplicationDetails(appPriya.id, priyaCand.profileId, priyaCand.userId, razorFlowFullStackJob, 'interviewed', false, {
    aptitudeScore: 86.0,
    codingScore: 92.0,
    interviewScore: 88.0,
    resumeScore: 90.0,
    proctoringViolations: [
      { ruleCode: 'repeated_tab_switch', severity: 'low', count: 2 }
    ],
  });
  totalApps++;

  const appAmit = await prisma.application.create({
    data: {
      candidate_id: amitCand.profileId,
      job_id: razorFlowBackendJob.id,
      status: 'screening_completed',
      applied_at: daysAgo(6),
    }
  });
  totalApps++;

  const appAnanya = await prisma.application.create({
    data: {
      candidate_id: ananyaCand.profileId,
      job_id: razorFlowFullStackJob.id,
      status: 'applied',
      applied_at: daysAgo(1),
    }
  });
  totalApps++;

  const appVikram = await prisma.application.create({
    data: {
      candidate_id: vikramCand.profileId,
      job_id: razorFlowSecurityJob.id,
      status: 'accepted',
      hr_round_status: 'passed',
      hr_round_completed_at: daysAgo(4),
      applied_at: daysAgo(20),
    }
  });
  await seedApplicationDetails(appVikram.id, vikramCand.profileId, vikramCand.userId, razorFlowSecurityJob, 'accepted', false, {
    aptitudeScore: 90.0,
    codingScore: 88.0,
    interviewScore: 94.0,
    resumeScore: 92.0,
    evaluationDecision: 'hire',
    evaluationReasoning: 'Strong principal-level security candidate. Demonstrated deep knowledge in threat modeling, Kubernetes runtime hardening, and DevSecOps compliance.',
    offerSalaryLPA: 62,
  });
  totalApps++;

  const appRahul = await prisma.application.create({
    data: {
      candidate_id: rahulCand.profileId,
      job_id: razorFlowBackendJob.id,
      status: 'rejected',
      applied_at: daysAgo(9),
    }
  });
  await seedApplicationDetails(appRahul.id, rahulCand.profileId, rahulCand.userId, razorFlowBackendJob, 'rejected', false, {
    aptitudeScore: 55.0,
    codingScore: 50.0,
    resumeScore: 60.0,
    evaluationDecision: 'reject',
    evaluationReasoning: 'Assessment score (52.5%) fell below the required threshold of 82% for this senior payments role.',
    proctoringViolations: [
      { ruleCode: 'fullscreen_exit_review', severity: 'high', count: 1 }
    ]
  });
  totalApps++;

  const appSneha = await prisma.application.create({
    data: {
      candidate_id: snehaCand.profileId,
      job_id: nexusCloudAiJob.id,
      status: 'evaluation',
      applied_at: daysAgo(11),
    }
  });
  await seedApplicationDetails(appSneha.id, snehaCand.profileId, snehaCand.userId, nexusCloudAiJob, 'evaluation', false, {
    aptitudeScore: 88.0,
    codingScore: 90.0,
    interviewScore: 85.0,
    resumeScore: 88.0,
    evaluationDecision: 'hold_for_review',
    evaluationReasoning: 'Good machine learning foundations and LLM inference tuning experience. Needs comparison with other candidates in the pool before extending an offer.',
  });
  totalApps++;

  const appKabir = await prisma.application.create({
    data: {
      candidate_id: kabirCand.profileId,
      job_id: nexusCloudDistributedJob.id,
      status: 'offered',
      applied_at: daysAgo(12),
    }
  });
  await seedApplicationDetails(appKabir.id, kabirCand.profileId, kabirCand.userId, nexusCloudDistributedJob, 'offered', false, {
    aptitudeScore: 88.0,
    codingScore: 90.0,
    interviewScore: 89.0,
    resumeScore: 90.0,
    evaluationDecision: 'hire',
    evaluationReasoning: 'Excellent platform engineer with strong AWS and Terraform infrastructure automation expertise. Highly recommended.',
    offerSalaryLPA: 42
  });
  totalApps++;

  console.log(`✅ Seeded ${totalApps} Applications with full assessment, interview, evaluation, and offer lifecycle.`);

  console.log('🎯 Seeding Mock Sessions and Prep Content for Candidates...');

  for (let m = 0; m < 3; m++) {
    const mockSession = await prisma.mockSession.create({
      data: {
        candidate_id: prathamCand.profileId,
        target_company: m === 0 ? 'RazorFlow Technologies' : m === 1 ? 'NexusCloud Labs' : 'Google Cloud India',
        target_role: 'Senior Full-Stack Architect',
        difficulty: 'hard',
        type: 'mock',
        status: 'completed',
        current_section: 'interview',
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

    await prisma.proctoringSession.create({
      data: {
        candidate_id: prathamCand.profileId,
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

  console.log('📄 Seeding completed Resume Builder history for Pratham...');
  const resumeDetails = {
    name: 'Pratham Rajbhar',
    title: 'Senior Full-Stack Engineer & Distributed AI Architect',
    email: 'pratham@gmail.com',
    phone: '+91 98192 83746',
    location: 'Bengaluru, India',
    linkedin: 'linkedin.com/in/prathamrajbhar',
    github: 'github.com/prathamrajbhar',
    portfolio: 'prathamrajbhar.dev',
    summary: 'Full-stack software architect with 5.5+ years building distributed cloud platforms, real-time web applications, and autonomous AI agents. Expertise in TypeScript, Next.js, Go/Node.js, PostgreSQL optimization, and high-performance WebGL interfaces.',
    skills: ['TypeScript', 'Next.js', 'React', 'Node.js', 'Go', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'AWS', 'System Design'],
    experience: [
      {
        role: 'Senior Full-Stack Engineer',
        company: 'RazorFlow Technologies',
        period: '2024 - Present',
        location: 'Bengaluru, India',
        highlights: [
          'Architected real-time merchant onboarding system handling 2M+ active global transactions.',
          'Reduced page-load latency by 45% using React Server Components and fine-grained caching.',
          'Built distributed event streaming pipeline using Kafka and Go microservices for fast reconciliations.'
        ]
      },
      {
        role: 'Software Engineer II',
        company: 'NexusCloud Labs',
        period: '2021 - 2024',
        location: 'Hyderabad, India',
        highlights: [
          'Led team of 4 engineers to design multi-tenant GPU serverless container platforms.',
          'Optimized database indices and connection pooling, reducing query latencies by 35% on PostgreSQL.',
          'Authored custom WebGL component library for real-time cluster visualization.'
        ]
      }
    ],
    projects: [
      {
        title: 'NextRound Interview Platform',
        techStack: ['Next.js', 'TypeScript', 'FastAPI', 'PostgreSQL'],
        description: 'An end-to-end AI hiring platform featuring proctoring telemetry, automated voice interviews, and code execution runners.',
        impact: 'Empowered recruiting teams to reduce screening cycles from 3 weeks to under 4 hours.'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Technology in Computer Science',
        institution: 'Indian Institute of Information Technology (IIIT)',
        year: '2021',
        gpa: '9.1/10'
      }
    ]
  };

  await prisma.mockSession.create({
    data: {
      candidate_id: prathamCand.profileId,
      target_company: 'RazorFlow Technologies',
      target_role: 'Senior Full-Stack Engineer',
      difficulty: 'hard',
      type: 'resume_builder',
      status: 'completed',
      started_at: daysAgo(2),
      completed_at: daysAgo(2),
      final_score: 95.0,
      generated_resume: resumeDetails as any,
    },
  });

  await prisma.mockSession.create({
    data: {
      candidate_id: prathamCand.profileId,
      target_company: 'NexusCloud Labs',
      target_role: 'Senior AI Systems Architect',
      difficulty: 'hard',
      type: 'resume_builder',
      status: 'completed',
      started_at: daysAgo(6),
      completed_at: daysAgo(6),
      final_score: 92.0,
      generated_resume: {
        ...resumeDetails,
        title: 'Senior AI Systems Architect',
        target_company: 'NexusCloud Labs',
      } as any,
    },
  });

  for (const company of COMPANIES.slice(0, 4)) {
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

  console.log('🔔 Seeding Notifications & Talent Bookmarks...');

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
        message: 'AI Interview evaluation scorecard generated for Priya Sharma.',
        type: 'info',
        read: true,
        created_at: daysAgo(2),
      },
    ],
  });

  await prisma.talentBookmark.create({
    data: {
      org_id: razorFlowOrg.id,
      candidate_id: priyaCand.profileId,
      notes: 'Priya demonstrated great frontend React capabilities during the voice round. Let\'s evaluate her soon.',
    },
  });
  await prisma.talentBookmark.create({
    data: {
      org_id: razorFlowOrg.id,
      candidate_id: amitCand.profileId,
      notes: 'Amit has strong Go/Kafka platform experience. Moving him to assessments.',
    },
  });

  console.log('🤖 Seeding Agent Execution Logs...');
  const agentLogs = [];
  for (const job of jobList) {
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
      output: { completedEvals: randInt(5, 12) },
      status: 'completed' as const,
      created_at: randomPastDate(1, 5),
    });
  }
  await prisma.agentLog.createMany({ data: agentLogs });

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

interface SeedAppCustomDetails {
  aptitudeScore?: number;
  codingScore?: number;
  interviewScore?: number;
  resumeScore?: number;
  proctoringViolations?: Array<{ ruleCode: string; severity: 'low' | 'medium' | 'high'; count: number }>;
  evaluationReasoning?: string;
  evaluationDecision?: 'hire' | 'reject' | 'hold_for_review';
  offerSalaryLPA?: number;
  isAssessmentPending?: boolean;
}

async function seedApplicationDetails(
  appId: string,
  candidateProfileId: string,
  candidateUserId: string,
  job: { id: string; orgId: string; title: string; minScore: number; salaryLPA: [number, number] },
  status: string,
  isPratham: boolean,
  custom?: SeedAppCustomDetails
) {
  const needsAssessment = ['assessment', 'interview_scheduled', 'interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted'].includes(status);
  const needsInterview = ['interview_scheduled', 'interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted'].includes(status);
  const needsEvaluation = ['evaluation', 'hr_round', 'decided', 'offered', 'accepted', 'rejected'].includes(status);
  const needsOffer = ['offered', 'accepted'].includes(status);

  let assessmentId: string | undefined = undefined;
  if (needsAssessment) {
    const isPending = custom?.isAssessmentPending ?? false;
    const aptitudeScore = custom?.aptitudeScore ?? (isPratham ? 94.0 : Number(randFloat(65, 98).toFixed(1)));
    const codingScore = custom?.codingScore ?? (isPratham ? 96.0 : Number(randFloat(60, 100).toFixed(1)));
    const overallScore = Number(((aptitudeScore + codingScore) / 2).toFixed(1));

    const assessment = await prisma.assessment.create({
      data: {
        application_id: appId,
        test_type: 'aptitude',
        questions: APTITUDE_BANK.slice(0, 10) as any,
        responses: isPending
          ? Prisma.DbNull
          : (APTITUDE_BANK.slice(0, 10).map((q, idx) => ({
              questionId: idx,
              selectedIndex: q.correct_index,
              isCorrect: true,
            })) as any),
        score: isPending ? null : overallScore,
        category_breakdown: isPending
          ? Prisma.DbNull
          : {
              'Quantitative Aptitude': aptitudeScore,
              'Logical Reasoning': aptitudeScore,
              'Verbal Ability': aptitudeScore,
              'Data Interpretation': aptitudeScore,
            },
        status: isPending ? 'pending' : 'completed',
        total_question_count: 10,
      },
    });
    assessmentId = assessment.id;

    const proctorSession = await prisma.proctoringSession.create({
      data: {
        candidate_id: candidateProfileId,
        application_id: appId,
        assessment_id: assessment.id,
        session_type: isPending ? 'coding' : 'aptitude',
        status: isPending ? 'active' : 'ended',
        policy_version: '1.0.0',
        consent_version: '1.0.0',
        started_at: randomPastDate(2, 10),
        ended_at: isPending ? null : randomPastDate(2, 10),
      },
    });

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

    if (custom?.proctoringViolations && !isPending) {
      for (const violation of custom.proctoringViolations) {
        await prisma.proctoringViolation.create({
          data: {
            proctoring_session_id: proctorSession.id,
            rule_code: violation.ruleCode,
            severity: violation.severity,
            occurrence_count: violation.count,
            first_seen_at: randomPastDate(2, 5),
            last_seen_at: randomPastDate(2, 5),
            status: 'pending_review',
          },
        });
      }
    }

    if (!isPending) {
      const dbProblem = await prisma.codingProblem.findFirst({
        where: {
          slug: job.title.includes('Frontend') ? 'valid-parentheses' : 'two-sum',
        },
      });

      await prisma.codingSubmission.create({
        data: {
          application_id: appId,
          candidate_id: candidateProfileId,
          problem_id: dbProblem?.id || null,
          language: 'typescript',
          code: job.title.includes('Frontend')
            ? `function isValid(s: string): boolean {\n  const stack: string[] = [];\n  const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };\n  for (const char of s) {\n    if (char === '(' || char === '{' || char === '[') {\n      stack.push(char);\n    } else {\n      if (stack.pop() !== map[char]) return false;\n    }\n  }\n  return stack.length === 0;\n}`
            : `function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
          test_results: job.title.includes('Frontend')
            ? ([
                { passed: true, description: 'Balanced brackets', executionTimeMs: 4 },
                { passed: true, description: 'Unbalanced brackets', executionTimeMs: 2 },
              ] as any)
            : ([
                { passed: true, description: 'Standard sorted pair', executionTimeMs: 12 },
                { passed: true, description: 'Duplicate elements', executionTimeMs: 8 },
              ] as any),
          pass_rate: 1.0,
          pass_rate_percent: 100,
          pass_rate_ratio: 1.0,
          execution_time_ms: job.title.includes('Frontend') ? 6 : 24,
          memory_mb: 32.4,
          complexity_score: 95,
          status: 'completed',
          complexity: 'O(n) Time, O(n) Space',
          ai_feedback: 'Optimal hash-map approach with clean TypeScript types.',
        },
      });
    }
  }

  if (needsInterview) {
    await prisma.interview.create({
      data: {
        application_id: appId,
        scheduled_at: status === 'interview_scheduled' ? randomFutureDate(1, 5) : randomPastDate(2, 14),
        transcript: [],
        status: status === 'interview_scheduled' ? 'scheduled' : 'completed',
        sentiment_report: null,
        engagement_signal: null,
      },
    });
  }

  if (needsEvaluation) {
    const resumeScore = custom?.resumeScore ?? (isPratham ? 95 : randFloat(70, 98));
    const interviewScore = custom?.interviewScore ?? (isPratham ? 94 : randFloat(68, 96));
    const aptitudeScore = custom?.aptitudeScore ?? (isPratham ? 94 : randFloat(65, 95));
    const codingScore = custom?.codingScore ?? (isPratham ? 96 : randFloat(65, 98));
    const compositeScore = Number(((resumeScore * 0.25) + (interviewScore * 0.35) + (aptitudeScore * 0.15) + (codingScore * 0.25)).toFixed(1));

    const decision = custom?.evaluationDecision ?? (status === 'rejected' ? 'reject' : status === 'offered' || status === 'accepted' ? 'hire' : 'hold_for_review');

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
        decision,
        reasoning: custom?.evaluationReasoning ?? (isPratham
          ? 'Exceptional candidate demonstrating deep proficiency in full-stack architecture, clean concurrency primitives, and production resilience. Strongly recommended for hire.'
          : `Candidate achieved a composite score of ${compositeScore}/100. Strong alignment with ${job.title} requirements.`),
      },
    });
  }

  if (needsOffer) {
    const salary = custom?.offerSalaryLPA ? (custom.offerSalaryLPA * 100000) : (job.salaryLPA[1] - 2) * 100000;
    await prisma.offer.create({
      data: {
        application_id: appId,
        role_title: job.title,
        salary,
        equity: '0.15% Stock Options (4-year vesting, 1-year cliff)',
        start_date: daysFromNow(20),
        status: status === 'accepted' ? 'accepted' : 'pending',
        signature_svg: null,
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
