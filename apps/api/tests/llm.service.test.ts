import { generateText } from '../src/services/llm.service';

const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      };
    }),
  };
});

describe('llm.service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = { ...process.env };
    // Clear keys by default
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    global.fetch = jest.fn();
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
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fallback to Ollama when Gemini fails', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini API Error'));
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Ollama Response' }),
    });

    const result = await generateText('Hello');

    expect(result).toBe('Ollama Response');
    expect(mockGenerateContent).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"prompt":"Hello"'),
      })
    );
  });

  it('should immediately call Ollama if no Gemini key is configured', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Ollama Response Direct' }),
    });

    const result = await generateText('Hello');

    expect(result).toBe('Ollama Response Direct');
    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should throw an error if both Gemini and Ollama fail', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini Error'));
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Ollama connection failed'));

    await expect(generateText('Hello')).rejects.toThrow(
      'Both Gemini and Ollama models failed to generate content'
    );
  });
});
