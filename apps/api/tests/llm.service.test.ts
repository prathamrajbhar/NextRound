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
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...process.env };
    // Clear keys by default
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    globalThis.fetch = mockFetch as unknown as typeof fetch;
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
    // The Ollama task runs in parallel (Promise.any), so fetch is still invoked.
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', expect.anything());
  });

  it('should fallback to Ollama when Gemini fails', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini API Error'));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Ollama Response' }),
    });

    const result = await generateText('Hello');

    expect(result).toBe('Ollama Response');
    expect(mockGenerateContent).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"prompt":"Hello"'),
      })
    );
  });

  it('should immediately call Ollama if no Gemini key is configured', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Ollama Response Direct' }),
    });

    const result = await generateText('Hello');

    expect(result).toBe('Ollama Response Direct');
    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should throw an error if both Gemini and Ollama fail', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini Error'));
    mockFetch.mockRejectedValueOnce(new Error('Ollama connection failed'));

    await expect(generateText('Hello')).rejects.toThrow(
      'Both Gemini and Ollama models failed to generate content'
    );
  });
});
