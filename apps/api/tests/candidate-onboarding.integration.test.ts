import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';
// Load API .env first before dynamic imports are evaluated
config({ path: path.resolve(__dirname, '../.env') });

process.env.PROFILE_SCRAPER_BASE_URL =
  process.env.PROFILE_SCRAPER_BASE_URL || 'https://social_scraper.bytemap.in';
process.env.PROFILE_SCRAPER_TIMEOUT_MS = process.env.PROFILE_SCRAPER_TIMEOUT_MS || '90000';

import { describe, it, expect, beforeAll } from 'vitest';

const RESUME_PATH = process.env.TEST_RESUME_PATH || '/home/pratham/Desktop/latest CV.pdf';
const SOCIAL_USERNAME = process.env.TEST_SOCIAL_USERNAME || 'prathamrajbhar';

type NormalizeSocialSync = (
  githubInput?: string,
  linkedinInput?: string
) => Promise<{
  extractedSkills?: string[];
  syncedAt?: string;
  syncs: Array<{ source: 'github' | 'linkedin'; username: string; status: string; synced: boolean; reason?: string }>;
  github?: Record<string, unknown> | null;
  linkedin?: Record<string, unknown> | null;
}>;

let extractTextFromBuffer: (buffer: Buffer, mimeType: string, filename: string) => Promise<string>;
let parseResumeWithGemini: (rawText: string) => Promise<Record<string, unknown>>;
let syncCandidateSocialProfiles: NormalizeSocialSync;
let buildContextSections: (
  profile: unknown,
  syncs?: Array<{ source: string; normalized_data: unknown }>
) => Array<{ sourceType: string; section: string; content: string }>;
let hashContent: (content: string) => string;

beforeAll(async () => {
  const resumeParser = await import('../src/services/resume-parser.service');
  extractTextFromBuffer = resumeParser.extractTextFromBuffer;
  parseResumeWithGemini = resumeParser.parseResumeWithGemini;

  const social = await import('../src/services/social-sync.service');
  syncCandidateSocialProfiles = social.syncCandidateSocialProfiles;

  const embedding = await import('../src/services/candidate-embedding.service');
  buildContextSections = embedding.buildContextSections;
  hashContent = embedding.hashContent;

  if (!fs.existsSync(RESUME_PATH)) {
    throw new Error(`Resume file not found at ${RESUME_PATH}. Set TEST_RESUME_PATH to override.`);
  }
});

// Run only when explicitly requested: RUN_INTEGRATION=1 npx vitest run apps/api/tests/candidate-onboarding.integration.test.ts
describe.runIf(process.env.RUN_INTEGRATION === '1')(
  'candidate onboarding end-to-end (real resume + real social scraper)',
  () => {
    let rawText = '';
    let parsed: Record<string, unknown> = {};
    let social: Awaited<ReturnType<NormalizeSocialSync>>;

    it(
      'extracts text from the real resume PDF',
      async () => {
        const buffer = fs.readFileSync(RESUME_PATH);
        rawText = await extractTextFromBuffer(buffer, 'application/pdf', path.basename(RESUME_PATH));
        expect(rawText.length).toBeGreaterThan(200);
        expect(rawText.trim().length).toBeGreaterThan(200);
      },
      120000
    );

    it(
      'synthesizes a recruiter-ready profile with Gemini',
      async () => {
        parsed = await parseResumeWithGemini(rawText);
        expect(parsed).toBeDefined();
        const fullName = String(parsed.fullName || '');
        expect(fullName.trim().length).toBeGreaterThan(0);
        expect(Array.isArray(parsed.skills) && (parsed.skills as string[]).length > 0).toBe(true);
        expect(String(parsed.headline || '')).toBeTruthy();
      },
      180000
    );

    it(
      'syncs GitHub + LinkedIn for the prathamrajbhar username',
      async () => {
        social = await syncCandidateSocialProfiles(SOCIAL_USERNAME, SOCIAL_USERNAME);

        const github = social.syncs.find((s) => s.source === 'github');
        const linkedin = social.syncs.find((s) => s.source === 'linkedin');

        expect(github).toBeDefined();
        expect(github!.username).toBe(SOCIAL_USERNAME);
        expect(['synced', 'failed', 'not_found']).toContain(github!.status);

        expect(linkedin).toBeDefined();
        expect(linkedin!.username).toBe(SOCIAL_USERNAME);
        expect(['synced', 'failed', 'not_found']).toContain(linkedin!.status);

        if (github!.synced && social.github) {
          expect(social.github.username).toBe(SOCIAL_USERNAME);
          expect(Array.isArray(social.github.repositories)).toBe(true);
        }
      },
      240000
    );

    it(
      'builds per-source context sections from the real resume + social data',
      () => {
        const profile = {
          raw_resume_text: rawText,
          parsed_resume: parsed,
          bio: String(parsed.bio || ''),
          headline: String(parsed.headline || ''),
          skills: (parsed.skills as string[]) || [],
          social_data: {
            github: social?.github || null,
            linkedin: social?.linkedin || null,
          },
        };

        const syncs = (social?.syncs || []).map((s) => ({
          source: s.source,
          normalized_data: s.source === 'github' ? social.github : social.linkedin,
        }));

        const sections = buildContextSections(profile, syncs);

        const sources = new Set(sections.map((s) => s.sourceType));
        expect(sources.has('resume')).toBe(true);

        const githubSynced = social?.syncs.find((s) => s.source === 'github')?.synced;
        if (githubSynced) {
          expect(sources.has('github')).toBe(true);
        }

        expect(sections.length).toBeGreaterThan(0);
        expect(sections.every((s) => s.content.trim().length > 0)).toBe(true);
        expect(sections.every((s) => hashContent(s.content).length === 64)).toBe(true);
      },
      30000
    );

    it('produces a consistent content hash across the pipeline', () => {
      const sample = buildContextSections({ raw_resume_text: rawText, parsed_resume: parsed, bio: '', headline: '', skills: [], social_data: null }, []);
      const first = hashContent(sample[0].content);
      const second = hashContent(sample[0].content);
      expect(first).toBe(second);
    });
  }
);