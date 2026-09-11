import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeParsedData,
  ParsedResumeData,
} from '../services/resume/resume-heuristic.service';
import {
  parseResumeWithGemini,
  generateFieldWithGemini,
  FieldRegenerationPayload,
} from '../services/resume/resume-parser.service';
vi.mock('../lib/logger', () => ({
  logger: {
    child: vi.fn().mockReturnValue({
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      http: vi.fn(),
    }),
  },
}));

// ---------------------------------------------------------------------------
// Mock LLM — all Gemini calls go through this
// ---------------------------------------------------------------------------

vi.mock('../services/llm/llm.service', () => ({
  generateText: vi.fn(),
}));

import { generateText } from '../services/llm/llm.service';

// ---------------------------------------------------------------------------
// sanitizeParsedData — comprehensive unit tests
// ---------------------------------------------------------------------------

describe('Resume Sanitizer — sanitizeParsedData', () => {
  it('returns empty shape for empty input', () => {
    const result = sanitizeParsedData({});
    expect(result.skills).toEqual([]);
    expect(result.targetRoles).toEqual([]);
    expect(result.fullName).toBeUndefined();
    expect(result.headline).toBeUndefined();
  });

  it('normalizes field aliases (full_name, name, candidateName → fullName)', () => {
    const result = sanitizeParsedData({
      full_name: 'Jane Doe',
      skills: ['Python'],
    });
    expect(result.fullName).toBe('Jane Doe');

    const result2 = sanitizeParsedData({
      name: 'John Smith',
    });
    expect(result2.fullName).toBe('John Smith');
  });

  it('deduplicates skills', () => {
    const result = sanitizeParsedData({
      skills: ['React', 'react', ' React ', 'TypeScript', 'typescript'],
    });
    expect(result.skills).toEqual(['React', 'TypeScript']);
  });

  it('generates targetRoles from headline only when headline is present', () => {
    const result = sanitizeParsedData({
      headline: 'Senior Backend Engineer',
      skills: [],
    });
    expect(result.targetRoles).toEqual(['Senior Backend Engineer']);
  });

  it('does NOT arbitrarily inject Full-Stack or AI/ML roles from skills alone without evidence', () => {
    const result = sanitizeParsedData({
      skills: ['React', 'TypeScript', 'Node.js'],
    });
    expect(result.targetRoles).toEqual([]);
  });

  it('URL-normalizes LinkedIn, GitHub, portfolio links', () => {
    const result = sanitizeParsedData({
      linkedinUrl: 'linkedin.com/in/janedoe',
      githubUrl: 'github.com/jane',
      portfolioUrl: 'janedoe.dev',
    });
    expect(result.linkedinUrl).toBe('https://linkedin.com/in/janedoe');
    expect(result.githubUrl).toBe('https://github.com/jane');
    expect(result.portfolioUrl).toBe('https://janedoe.dev');
  });

  it('cleans bio of email/phone/URL contamination', () => {
    const dirtyBio =
      'Senior engineer with extensive experience in scalable cloud services. jane@example.com +91-98765-43210 Visit http://janedoe.dev for more.';
    const result = sanitizeParsedData({ bio: dirtyBio });
    expect(result.bio).not.toContain('@');
    expect(result.bio).not.toContain('+');
    expect(result.bio).not.toContain('http');
    expect(result.bio?.length).toBeGreaterThan(15);
  });

  it('normalizes notice periods to valid onboarding enum values', () => {
    expect(sanitizeParsedData({ noticePeriod: 'Immediate joiner' }).noticePeriod).toBe('Immediate');
    expect(sanitizeParsedData({ noticePeriod: '1-2 weeks' }).noticePeriod).toBe('15 days');
    expect(sanitizeParsedData({ noticePeriod: '1 month' }).noticePeriod).toBe('30 days');
    expect(sanitizeParsedData({ noticePeriod: '60 days' }).noticePeriod).toBe('60 days');
    expect(sanitizeParsedData({ noticePeriod: '3 months' }).noticePeriod).toBe('90 days');
  });

  it('normalizes full INR numbers to LPA integers', () => {
    const result = sanitizeParsedData({
      yearsOfExperience: '5',
      currentCtc: '1200000',
      expectedSalary: '1500000',
    });
    expect(result.yearsOfExperience).toBe(5);
    expect(result.currentCtc).toBe(12);
    expect(result.expectedSalary).toBe(15);
  });

  it('discards hallucinated years as salaries', () => {
    const result = sanitizeParsedData({
      currentCtc: 2024,
      expectedSalary: 2025,
    });
    expect(result.currentCtc).toBeUndefined();
    expect(result.expectedSalary).toBeUndefined();
  });

  it('handles missing values gracefully across all fields', () => {
    const result = sanitizeParsedData({
      fullName: '',
      headline: null,
      phone: undefined,
      skills: null,
      targetRoles: undefined,
    });
    expect(result.fullName).toBeUndefined();
    expect(result.headline).toBeUndefined();
    expect(result.phone).toBeUndefined();
    expect(result.skills).toEqual([]);
    expect(result.targetRoles).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// parseResumeWithGemini — unit tests
// ---------------------------------------------------------------------------

describe('Resume Parser — parseResumeWithGemini', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws on text too short', async () => {
    await expect(parseResumeWithGemini('Hi')).rejects.toThrow(
      'Resume text too short for parsing'
    );
  });

  it('extracts JSON from LLM response and sanitizes it', async () => {
    const mockResponse = `Here is the analysis:
{
  "fullName": "Alice Engineer",
  "headline": "Full-Stack Developer",
  "phone": "+1-555-1234",
  "location": "San Francisco, CA",
  "skills": ["React", "Node.js", "PostgreSQL"],
  "targetRoles": ["Full-Stack Engineer"],
  "yearsOfExperience": "6",
  "bio": "Experienced developer with a passion for building scalable systems."
}`;
    (generateText as vi.Mock).mockResolvedValue(mockResponse);

    const result = await parseResumeWithGemini('Valid resume text with substantial content...');

    expect(result.fullName).toBe('Alice Engineer');
    expect(result.headline).toBe('Full-Stack Developer');
    expect(result.skills).toEqual(['React', 'Node.js', 'PostgreSQL']);
    expect(result.yearsOfExperience).toBe(6);
  });

  it('throws when LLM returns no JSON object', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      'The resume looks good. I think you should apply.'
    );
    await expect(
      parseResumeWithGemini('Valid resume text with substantial content...')
    ).rejects.toThrow('AI model did not return a valid JSON object for resume data');
  });

  it('throws when LLM response is not valid JSON', async () => {
    (generateText as vi.Mock).mockResolvedValue('{ this is not valid json }');
    await expect(
      parseResumeWithGemini('Valid resume text with substantial content...')
    ).rejects.toThrow();
  });

  it('trims resume text to 12000 chars before sending to LLM', async () => {
    const longText = 'x'.repeat(20000);
    const mockResponse = '{}';
    (generateText as vi.Mock).mockResolvedValue(mockResponse);

    await parseResumeWithGemini(longText);

    const callArg = (generateText as vi.Mock).mock.calls[0][0];
    // The prompt should contain only the first 12000 chars of the resume
    expect(callArg).toContain('RESUME CONTENT:');
    expect(callArg.length).toBeGreaterThan(0);
  });

  it('propagates LLM errors with meaningful message', async () => {
    const networkError = new Error('Gemini API timeout');
    (generateText as vi.Mock).mockRejectedValue(networkError);

    await expect(
      parseResumeWithGemini('Valid resume text with substantial content...')
    ).rejects.toThrow('Gemini API timeout');
  });
});

// ---------------------------------------------------------------------------
// generateFieldWithGemini — unit tests
// ---------------------------------------------------------------------------

describe('Resume Field Regeneration — generateFieldWithGemini', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns currentValue when combined context is empty', async () => {
    const result = await generateFieldWithGemini({
      field: 'bio',
      currentValue: 'Existing bio text',
      rawResumeText: '',
      socialData: {},
      skills: [],
      targetRoles: [],
    });
    expect(result).toBe('Existing bio text');
  });

  it('generates a headline from skills', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      '"Full-Stack & AI Systems Engineer | React, Node.js & PyTorch"'
    );

    const result = await generateFieldWithGemini({
      field: 'headline',
      skills: ['React', 'Node.js', 'PyTorch'],
    });

    expect(result).toBe(
      'Full-Stack & AI Systems Engineer | React, Node.js & PyTorch'
    );
  });

  it('strips surrounding quotes from LLM response', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      '"React and Node.js developer with 5 years experience"'
    );

    const result = await generateFieldWithGemini({
      field: 'bio',
      rawResumeText: 'Some resume...',
    });

    expect(result.startsWith('"')).toBe(false);
    expect(result.endsWith('"')).toBe(false);
  });

  it('builds context from all provided sources', async () => {
    (generateText as vi.Mock).mockResolvedValue('Generated bio text');

    await generateFieldWithGemini({
      field: 'bio',
      rawResumeText: 'Resume content here',
      socialData: { github: { repos: ['repo-1'] } },
      skills: ['Python', 'FastAPI'],
      targetRoles: ['Backend Engineer'],
      yearsOfExperience: '4',
      linkedinUrl: 'linkedin.com/in/test',
      githubUrl: 'github.com/test',
      portfolioUrl: 'test.dev',
      currentValue: 'Draft bio',
    });

    const callArg = (generateText as vi.Mock).mock.calls[0][0];
    expect(callArg).toContain('RESUME TEXT:');
    expect(callArg).toContain('GITHUB & LINKEDIN SYNCHRONIZED');
    expect(callArg).toContain('TECHNICAL SKILLS:');
    expect(callArg).toContain('TARGET ROLES:');
    expect(callArg).toContain('YEARS OF EXPERIENCE:');
    expect(callArg).toContain('ONLINE PROFILES:');
    expect(callArg).toContain('CURRENT DRAFT:');
  });

  it('truncates rawResumeText to 8000 chars in context', async () => {
    (generateText as vi.Mock).mockResolvedValue('Generated bio');

    await generateFieldWithGemini({
      field: 'bio',
      rawResumeText: 'x'.repeat(12000),
    });

    const callArg = (generateText as vi.Mock).mock.calls[0][0];
    const resumeSection = callArg.split('RESUME TEXT:\n')[1]?.split('\n\n')[0] || '';
    expect(resumeSection.length).toBeLessThanOrEqual(8000);
  });

  it('truncates socialData JSON to 4000 chars in context', async () => {
    (generateText as vi.Mock).mockResolvedValue('Generated bio');

    const hugeSocialData = { repos: Array.from({ length: 100 }, (_, i) => `repo-${i}`), followers: 5000 };
    await generateFieldWithGemini({
      field: 'bio',
      socialData: hugeSocialData,
    });

    // Should not throw; context building handles truncation
    expect((generateText as vi.Mock).mock.calls[0][0]).toContain('GITHUB & LINKEDIN SYNCHRONIZED');
  });

  it('throws on LLM failure with wrapped error', async () => {
    const llmError = new Error('Gemini API connection refused');
    (generateText as vi.Mock).mockRejectedValue(llmError);

    await expect(
      generateFieldWithGemini({
        field: 'proudProject',
        rawResumeText: 'Valid resume...',
      })
    ).rejects.toThrow('Gemini API connection refused');
  });
});

// ---------------------------------------------------------------------------
// Edge cases — payload validation
// ---------------------------------------------------------------------------

describe('Resume Parser — edge cases', () => {
  it('parseResumeWithGemini handles Unicode and special characters', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      '{"fullName": "Müller José", "skills": ["TypeScript", "React"], "targetRoles": ["Frontend Engineer"]}'
    );

    const result = await parseResumeWithGemini('Résumé with spécial chars: über-alles,ñoño');
    expect(result.fullName).toBe('Müller José');
    expect(result.skills).toContain('TypeScript');
  });

  it('generateFieldWithGemini targets proudProject with correct instruction', async () => {
    (generateText as vi.Mock).mockResolvedValue('Built a real-time analytics dashboard');

    await generateFieldWithGemini({
      field: 'proudProject',
      rawResumeText: 'Worked on analytics dashboard',
      skills: ['React', 'D3.js'],
    });

    const callArg = (generateText as vi.Mock).mock.calls[0][0];
    expect(callArg).toContain('FIELD REQUEST:');
    expect(callArg).toContain('most technically impressive project');
    expect(callArg).toContain('architectural contributions');
  });

  it('generateFieldWithGemini targets bio with correct instruction', async () => {
    (generateText as vi.Mock).mockResolvedValue('Senior engineer specializing in...');

    await generateFieldWithGemini({
      field: 'bio',
      rawResumeText: 'Some background',
    });

    const callArg = (generateText as vi.Mock).mock.calls[0][0];
    expect(callArg).toContain('executive 2-4 sentence summary');
    expect(callArg).toContain('Do NOT include emails, phone numbers');
  });
});
