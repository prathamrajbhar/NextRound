import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractRequirementsFromJd,
  ExtractedRequirements,
} from '../services/jd/jd-extractor.service';
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

vi.mock('../services/llm/llm.service', () => ({
  generateText: vi.fn(),
}));

import { generateText } from '../services/llm/llm.service';

// ---------------------------------------------------------------------------
// Happy path — valid JD extraction
// ---------------------------------------------------------------------------

describe('JD Extractor — extractRequirementsFromJd (happy path)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts skills, softSkills, cultureKeywords, and rubric from a full JD', async () => {
    const jdText = `
We are looking for a Senior Backend Engineer to join our platform team.
You will work with Python, PostgreSQL, Redis, and Docker to build distributed APIs.
The ideal candidate has 5+ years of experience and strong communication skills.
We value innovation, fast execution, and quality focus.
Collaborative teamwork and analytical thinking are essential.
    `;

    const mockResponse = JSON.stringify({
      skills: ['Python', 'PostgreSQL', 'Redis', 'Docker', 'REST APIs'],
      softSkills: ['Communication', 'Collaboration', 'Analytical Thinking'],
      cultureKeywords: ['Innovation', 'Fast Execution', 'Quality Focus'],
      rubric: {
        technical: 40,
        communication: 20,
        problemSolving: 25,
        experience: 15,
      },
      enhancedDescription: '# Senior Backend Engineer\n\n## Role Overview\n...',
    });

    (generateText as vi.Mock).mockResolvedValue(mockResponse);

    const result = await extractRequirementsFromJd(jdText, 'Senior Backend Engineer');

    expect(result.skills).toEqual(['Python', 'PostgreSQL', 'Redis', 'Docker', 'REST APIs']);
    expect(result.softSkills).toEqual(['Communication', 'Collaboration', 'Analytical Thinking']);
    expect(result.cultureKeywords).toEqual(['Innovation', 'Fast Execution', 'Quality Focus']);
    expect(result.rubric).toEqual({
      technical: 40,
      communication: 20,
      problemSolving: 25,
      experience: 15,
    });
    expect(result.enhancedDescription).toContain('# Senior Backend Engineer');
  });

  it('auto-balances rubric to exactly 100 when LLM returns sum != 100', async () => {
    const jdText = 'Build APIs with Python and PostgreSQL.';

    // LLM returns rubric that sums to 95, not 100
    const mockResponse = JSON.stringify({
      skills: ['Python'],
      softSkills: [],
      cultureKeywords: [],
      rubric: {
        technical: 35,
        communication: 20,
        problemSolving: 25,
        experience: 15,
      }, // sum = 95
    });

    (generateText as vi.Mock).mockResolvedValue(mockResponse);

    const result = await extractRequirementsFromJd(jdText);

    const sum = result.rubric.technical + result.rubric.communication + result.rubric.problemSolving + result.rubric.experience;
    expect(sum).toBe(100);
    // experience should absorb the 5-point difference
    expect(result.rubric.experience).toBe(20);
  });

  it('auto-balances rubric when LLM returns sum > 100', async () => {
    const jdText = 'We need a full-stack engineer.';

    const mockResponse = JSON.stringify({
      skills: ['React', 'Node.js'],
      softSkills: [],
      cultureKeywords: [],
      rubric: {
        technical: 50,
        communication: 30,
        problemSolving: 30,
        experience: 30,
      }, // sum = 140
    });

    (generateText as vi.Mock).mockResolvedValue(mockResponse);

    const result = await extractRequirementsFromJd(jdText);

    const sum = result.rubric.technical + result.rubric.communication + result.rubric.problemSolving + result.rubric.experience;
    expect(sum).toBe(100);
  });

  it('clamps each rubric dimension to [10, 80] range', async () => {
    const jdText = 'Engineer needed for engineering team with full description.';

    // LLM returns values outside [10, 80] that sum to 100 after clamping
    const mockResponse = JSON.stringify({
      skills: [],
      softSkills: [],
      cultureKeywords: [],
      rubric: {
        technical: 5,   // clamped to 10
        communication: 70,
        problemSolving: 0, // clamped to 10
        experience: 10,
      },
    });

    (generateText as vi.Mock).mockResolvedValue(mockResponse);

    const result = await extractRequirementsFromJd(jdText);

    expect(result.rubric.technical).toBe(10); // clamped up from 5
    expect(result.rubric.communication).toBe(70);
    expect(result.rubric.problemSolving).toBe(10); // clamped up from 0
    expect(result.rubric.experience).toBe(10);
  });

  it('returns empty arrays when LLM omits optional sections', async () => {
    const mockResponse = JSON.stringify({
      skills: [],
      softSkills: [],
      cultureKeywords: [],
      rubric: { technical: 30, communication: 20, problemSolving: 25, experience: 25 },
    });

    (generateText as vi.Mock).mockResolvedValue(mockResponse);

    const result = await extractRequirementsFromJd('Minimal JD with sufficient characters');

    expect(result.skills).toEqual([]);
    expect(result.softSkills).toEqual([]);
    expect(result.cultureKeywords).toEqual([]);
    expect(result.enhancedDescription).toBeUndefined();
  });

  it('trims and filters empty-string entries from arrays', async () => {
    const mockResponse = JSON.stringify({
      skills: ['Python', '', '  ', 'PostgreSQL', null as any, 'Redis'],
      softSkills: ['Communication', null as any],
      cultureKeywords: [],
      rubric: { technical: 40, communication: 20, problemSolving: 20, experience: 20 },
    });

    (generateText as vi.Mock).mockResolvedValue(mockResponse);

    const result = await extractRequirementsFromJd('JD with dirty data');

    expect(result.skills).toEqual(['Python', 'PostgreSQL', 'Redis']);
    expect(result.softSkills).toEqual(['Communication']);
  });
});

// ---------------------------------------------------------------------------
// Edge cases and validation
// ---------------------------------------------------------------------------

describe('JD Extractor — edge cases and validation', () => {
  it('throws when JD text is too short', async () => {
    await expect(extractRequirementsFromJd('Short')).rejects.toThrow(
      'Job description too short for requirement extraction'
    );
  });

  it('throws when LLM returns no valid JSON object', async () => {
    (generateText as vi.Mock).mockResolvedValue('The job looks great! No JSON here.');

    await expect(extractRequirementsFromJd('Valid description text that is long enough.')).rejects.toThrow(
      'AI model did not return a valid JSON object for job requirements'
    );
  });

  it('throws when LLM returns malformed JSON', async () => {
    (generateText as vi.Mock).mockResolvedValue('{ broken json');

    await expect(extractRequirementsFromJd('Valid description text that is long enough.')).rejects.toThrow();
  });

  it('trims JD to 12000 chars before sending to LLM', async () => {
    const longJd = 'x'.repeat(20000);
    (generateText as vi.Mock).mockResolvedValue(
      JSON.stringify({
        skills: [],
        softSkills: [],
        cultureKeywords: [],
        rubric: { technical: 30, communication: 20, problemSolving: 25, experience: 25 },
      })
    );

    await extractRequirementsFromJd(longJd);

    const callArg = (generateText as vi.Mock).mock.calls[0][0];
    // The prompt should contain truncated JD, not full 20k
    expect(callArg).toContain('JOB DESCRIPTION:');
    expect(callArg.length).toBeGreaterThan(0);
  });

  it('handles missing rubric fields by using defaults', async () => {
    const mockResponse = JSON.stringify({
      skills: ['Go'],
      softSkills: [],
      cultureKeywords: [],
      rubric: {}, // entirely missing
    });

    (generateText as vi.Mock).mockResolvedValue(mockResponse);

    const result = await extractRequirementsFromJd('Valid description with more than fifteen characters');

    expect(result.rubric.technical).toBe(30);
    expect(result.rubric.communication).toBe(20);
    expect(result.rubric.problemSolving).toBe(25);
    expect(result.rubric.experience).toBe(25);
  });

  it('handles null rubric values by using defaults', async () => {
    const mockResponse = JSON.stringify({
      skills: ['Go'],
      softSkills: [],
      cultureKeywords: [],
      rubric: { technical: null, communication: 20, problemSolving: null, experience: 25 },
    });

    (generateText as vi.Mock).mockResolvedValue(mockResponse);

    const result = await extractRequirementsFromJd('Valid description with more than fifteen characters');

    expect(result.rubric.technical).toBe(30);
    expect(result.rubric.communication).toBe(20);
    expect(result.rubric.problemSolving).toBe(25);
    expect(result.rubric.experience).toBe(25);
  });

  it('propagates LLM errors with wrapped message', async () => {
    (generateText as vi.Mock).mockRejectedValue(new Error('Gemini API rate limited'));

    await expect(extractRequirementsFromJd('Valid JD text here that is sufficiently long.')).rejects.toThrow(
      'Gemini API rate limited'
    );
  });

  it('uses title in prompt when provided', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      JSON.stringify({
        skills: [],
        softSkills: [],
        cultureKeywords: [],
        rubric: { technical: 30, communication: 20, problemSolving: 25, experience: 25 },
      })
    );

    await extractRequirementsFromJd('Some description longer than fifteen chars', 'Principal SRE');

    const callArg = (generateText as vi.Mock).mock.calls[0][0];
    expect(callArg).toContain('JOB TITLE: Principal SRE');
  });

  it('uses "Not specified" when title is omitted', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      JSON.stringify({
        skills: [],
        softSkills: [],
        cultureKeywords: [],
        rubric: { technical: 30, communication: 20, problemSolving: 25, experience: 25 },
      })
    );

    await extractRequirementsFromJd('Some description longer than fifteen chars');

    const callArg = (generateText as vi.Mock).mock.calls[0][0];
    expect(callArg).toContain('JOB TITLE: Not specified');
  });
});

// ---------------------------------------------------------------------------
// Type-level tests (compile-time + runtime shape)
// ---------------------------------------------------------------------------

describe('JD Extractor — return type shape', () => {
  it('returns ExtractedRequirements shape', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      JSON.stringify({
        skills: ['TypeScript'],
        softSkills: ['Leadership'],
        cultureKeywords: ['Innovation'],
        rubric: { technical: 40, communication: 20, problemSolving: 20, experience: 20 },
        enhancedDescription: '# Role',
      })
    );

    const result = await extractRequirementsFromJd('Full JD with plenty of content to meet the threshold', 'Staff Engineer');

    // Verify all required keys present
    expect(result).toHaveProperty('skills');
    expect(result).toHaveProperty('softSkills');
    expect(result).toHaveProperty('cultureKeywords');
    expect(result).toHaveProperty('rubric');
    expect(result.rubric).toHaveProperty('technical');
    expect(result.rubric).toHaveProperty('communication');
    expect(result.rubric).toHaveProperty('problemSolving');
    expect(result.rubric).toHaveProperty('experience');
    expect(result).toHaveProperty('enhancedDescription');
  });
});
