import { UserRole } from '../../src/generated/prisma/client';

export interface CompanyDef {
  name: string;
  industry: string;
  size: string;
  logoUrl: string;
  tagline: string;
  cultureNotes: string;
  settings: Record<string, unknown>;
}

export const COMPANIES: CompanyDef[] = [
  {
    name: 'RazorFlow Technologies',
    industry: 'High-Throughput Fintech & Payment Infrastructure',
    size: '1000+ employees',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop&crop=faces',
    tagline: 'Powering real-time global and domestic payments',
    cultureNotes: 'RazorFlow operates mission-critical payment rails across India and Southeast Asia. We value extreme system reliability, distributed consensus, low-latency microservices, and radical transparency.',
    settings: { autoOfferEnabled: true, defaultThreshold: 82, defaultVoice: 'Serena', domain: 'razorflow.io', hiringSlack: '#razorflow-talent' },
  },
  {
    name: 'NexusCloud Labs',
    industry: 'Enterprise Cloud Infrastructure & Distributed AI',
    size: '500-1000 employees',
    logoUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=200&h=200&fit=crop&crop=faces',
    tagline: 'Next-generation cloud orchestrator for AI workloads',
    cultureNotes: 'NexusCloud builds multi-cloud orchestration and serverless GPU clusters. Engineering-first culture with deep contributions to open-source Kubernetes and Rust ecosystem.',
    settings: { autoOfferEnabled: false, defaultThreshold: 85, defaultVoice: 'Alloy', domain: 'nexuscloud.io', hiringSlack: '#nexus-hiring' },
  },
  {
    name: 'ZomatoScale QuickCommerce',
    industry: 'Hyperlocal Logistics & E-Commerce Platform',
    size: '1000+ employees',
    logoUrl: 'https://images.unsplash.com/photo-1561716516-b0b1c9f7e5a0?w=200&h=200&fit=crop&crop=faces',
    tagline: 'Sub-10 minute delivery at national scale',
    cultureNotes: 'High-velocity shipping culture. We run massive real-time dispatch systems, route optimization algorithms, and fault-tolerant mobile apps supporting millions of daily active orders.',
    settings: { autoOfferEnabled: true, defaultThreshold: 80, defaultVoice: 'Nova', domain: 'zomatoscale.tech', hiringSlack: '#zomato-talent' },
  },
  {
    name: 'ZerodhaCore Trading Systems',
    industry: 'Low-Latency Financial Markets & WealthTech',
    size: '200-500 employees',
    logoUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop&crop=faces',
    tagline: 'Reliable, zero-brokerage trading architecture',
    cultureNotes: 'Minimalist, highly disciplined engineering. Frugal architecture, single-tenant Go/C++ trading engines, and a strong preference for simple, auditable systems over bloated frameworks.',
    settings: { autoOfferEnabled: false, defaultThreshold: 86, defaultVoice: 'Echo', domain: 'zerodhacore.tech', hiringSlack: '#zerodha-hiring' },
  },
  {
    name: 'CREDExperience Studio',
    industry: 'Design Systems & High-Fidelity UI Engineering',
    size: '50-200 employees',
    logoUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&h=200&fit=crop&crop=faces',
    tagline: 'Artisanal software craftsmanship and kinetic UI',
    cultureNotes: 'Obsessed with micro-interactions, 120fps fluid animations, custom WebGL shaders, and pixel-perfect design system architecture.',
    settings: { autoOfferEnabled: false, defaultThreshold: 88, defaultVoice: 'Alloy', domain: 'credexperience.design', hiringSlack: '#cred-design-jobs' },
  },
];

export interface HRRecruiter {
  email: string;
  name: string;
  avatarUrl: string;
  title: string;
  location: string;
  phone: string;
  specialties: string[];
  languages: string[];
  role: UserRole;
  orgName: string;
}

export const RECRUITERS: HRRecruiter[] = [
  {
    email: 'steve.hr@gmail.com',
    name: 'Steve Rao',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
    title: 'Director of Talent Acquisition',
    location: 'Bengaluru, India',
    phone: '+91 98765 43210',
    specialties: ['Leadership Hiring', 'Backend & Infrastructure', 'Fintech Talent'],
    languages: ['English', 'Hindi', 'Kannada'],
    role: 'hr',
    orgName: 'RazorFlow Technologies',
  },
  {
    email: 'ananya.recruit@nexuscloud.io',
    name: 'Ananya Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    title: 'Lead Cloud Recruiter',
    location: 'Hyderabad, India',
    phone: '+91 98123 45678',
    specialties: ['Cloud Infrastructure', 'Kubernetes Systems', 'Rust Engineers'],
    languages: ['English', 'Telugu', 'Hindi'],
    role: 'hr',
    orgName: 'NexusCloud Labs',
  },
  {
    email: 'vikram.ta@zomatoscale.tech',
    name: 'Vikram Malhotra',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
    title: 'Senior TA Partner',
    location: 'Gurgaon, India',
    phone: '+91 98234 56789',
    specialties: ['High Velocity Frontend Hiring', 'Mobile Engineering'],
    languages: ['English', 'Hindi', 'Punjabi'],
    role: 'hr',
    orgName: 'ZomatoScale QuickCommerce',
  },
  {
    email: 'sneha.talent@zerodhacore.tech',
    name: 'Sneha Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
    title: 'Lead Tech Recruiter',
    location: 'Bengaluru, India',
    phone: '+91 98345 67890',
    specialties: ['Low Latency Engineers', 'Go/C++ Systems Developers'],
    languages: ['English', 'Gujarati', 'Hindi'],
    role: 'hr',
    orgName: 'ZerodhaCore Trading Systems',
  },
  {
    email: 'kunal.design@credexperience.design',
    name: 'Kunal Sen',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces',
    title: 'UI Design Recruiter',
    location: 'Mumbai, India',
    phone: '+91 98456 78901',
    specialties: ['High Fidelity UI Engineers', 'WebGL/WebGL Specialists'],
    languages: ['English', 'Bengali', 'Hindi'],
    role: 'hr',
    orgName: 'CREDExperience Studio',
  },
];
