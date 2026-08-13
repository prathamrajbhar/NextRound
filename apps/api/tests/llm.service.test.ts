import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateText } from '../src/services/llm.service';

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock('@google/genai', () => {
  class GoogleGenAI {
    models = { generateContent: mockGenerateContent };
  }
  return { GoogleGenAI };
});

describe('llm.service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...process.env };
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should call Gemini when GEMINI_API_KEY is present and succeeds', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    mockGenerateContent.mockResolvedValueOnce({
      text: 'Gemini Response',
    });

    const result = await generateText('Hello');

    expect(result).toBe('Gemini Response');
    expect(mockGenerateContent).toHaveBeenCalledWith({
      model: 'gemini-2.5-flash',
      contents: 'Hello',
    });
  });

  it('should throw when Gemini fails (no model fallback)', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini API Error'));

    await expect(generateText('Hello')).rejects.toThrow('Gemini API Error');
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('should throw if no Gemini key is configured', async () => {
    await expect(generateText('Hello')).rejects.toThrow(/GEMINI_API_KEY is not configured/);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });
});