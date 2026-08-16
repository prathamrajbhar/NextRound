import path from 'path';
import { config } from 'dotenv';
// Load API .env first before dynamic imports are evaluated (BullMQ/prisma modules read env at import)
config({ path: path.resolve(__dirname, '../.env') });

process.env.PROFILE_SCRAPER_BASE_URL = process.env.PROFILE_SCRAPER_BASE_URL || 'https://social_scraper.bytemap.in';
process.env.PROFILE_SCRAPER_TIMEOUT_MS = process.env.PROFILE_SCRAPER_TIMEOUT_MS || '90000';

import { describe, it, expect, beforeAll } from 'vitest';

let normalizeUsername: (input: string | undefined | null, platform: 'github' | 'linkedin') => { ok: true; username: string } | { ok: false; reason: string };
let hashContent: (content: string) => string;
let buildContextText: (context: unknown, maxLength?: number) => string;
let CandidateInterviewContext: unknown;

beforeAll(async () => {
  const social = await import('../src/services/social-sync.service');
  normalizeUsername = social.normalizeUsername;
  const embedding = await import('../src/services/candidate-embedding.service');
  hashContent = embedding.hashContent;
  const context = await import('../src/services/candidate-context.service');
  buildContextText = context.buildContextText;
  const shared = await import('@nextround/shared');
  CandidateInterviewContext = shared;
});

describe('normalizeUsername', () => {
  it('extracts a username from a GitHub URL', () => {
    const result = normalizeUsername('https://github.com/alex-morgan', 'github');
    expect(result).toEqual({ ok: true, username: 'alex-morgan' });
  });

  it('extracts a username from a LinkedIn URL with a trailing slash', () => {
    const result = normalizeUsername('https://www.linkedin.com/in/alexmorgan/', 'linkedin');
    expect(result).toEqual({ ok: true, username: 'alexmorgan' });
  });

  it('strips a leading @ from a bare username', () => {
    const result = normalizeUsername('@alexmorgan', 'github');
    expect(result).toEqual({ ok: true, username: 'alexmorgan' });
  });

  it('accepts a bare username', () => {
    const result = normalizeUsername('alexmorgan', 'linkedin');
    expect(result).toEqual({ ok: true, username: 'alexmorgan' });
  });

  it('rejects an empty input', () => {
    const result = normalizeUsername('   ', 'github');
    expect(result.ok).toBe(false);
  });

  it('rejects an overlong GitHub username', () => {
    const result = normalizeUsername('a'.repeat(40), 'github');
    expect(result.ok).toBe(false);
  });

  it('falls back to the last URL path segment for a non-/in/ LinkedIn URL', () => {
    const result = normalizeUsername('https://linkedin.com/company/acme', 'linkedin');
    expect(result).toEqual({ ok: true, username: 'acme' });
  });
});

describe('hashContent', () => {
  it('is deterministic for identical content', () => {
    expect(hashContent('same text')).toBe(hashContent('same text'));
  });

  it('differs when content changes', () => {
    expect(hashContent('same text')).not.toBe(hashContent('different text'));
  });
});

describe('buildContextText', () => {
  const context = {
    candidate: {
      fullName: 'Alex Morgan',
      headline: 'Senior Full-Stack Engineer',
      location: 'Bengaluru, India',
      yearsOfExperience: 6,
      targetRoles: ['Senior Engineer'],
      bio: 'Builder of scalable systems.',
    },
    resume: {
      rawText: 'Experienced in React, Node and Go.',
      parsed: null,
      sections: [],
    },
    social: {
      github: { username: 'alexmorgan', totalStars: 420 },
      linkedin: { headline: 'Senior Full-Stack Engineer' },
    },
    skills: ['TypeScript', 'Go', 'React'],
    experience: [{ title: 'Senior Engineer', company: 'Acme' }],
    projects: [{ name: 'nextround' }],
    education: [{ degree: 'B.Tech' }],
    achievements: [],
    job: {
      title: 'Staff Engineer',
      description: 'Lead platform initiatives.',
      location: 'Remote',
      experienceLevel: 'senior',
      skills: ['TypeScript'],
      rubric: { technical: 0.4 },
      thresholds: { pass: 70 },
    },
    interviewFocus: [
      { sourceType: 'github', section: 'projects', content: 'Pushed 400 commits to nextround.' },
    ],
  };

  it('composes candidate, job and social sections into one string', () => {
    const text = buildContextText(context);
    expect(text).toContain('Candidate: Alex Morgan');
    expect(text).toContain('Headline: Senior Full-Stack Engineer');
    expect(text).toContain('JOB: Staff Engineer');
    expect(text).toContain('Skills: TypeScript, Go, React');
  });

  it('applies the maxLength cap', () => {
    const text = buildContextText(context, 120);
    expect(text.length).toBeLessThanOrEqual(120);
  });

  it('handles a minimal context without crashing', () => {
    const minimal = {
      candidate: { fullName: 'A' },
      resume: { rawText: '', parsed: null, sections: [] },
      social: { github: null, linkedin: null },
      skills: [],
      experience: [],
      projects: [],
      education: [],
      achievements: [],
      job: { title: 'Role', description: '', location: '', experienceLevel: '', skills: [], rubric: undefined, thresholds: undefined },
      interviewFocus: [],
    };
    const text = buildContextText(minimal);
    expect(text).toContain('Candidate: A');
  });
});