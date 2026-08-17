import { GoogleGenAI } from '@google/genai';

export async function generateText(prompt: string): Promise<string> {
  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();

  if (provider === 'ollama') {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';

    try {
      const response = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: prompt,
          stream: false,
          options: { temperature: 0.2 }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = (await response.json()) as { response?: string };
      const text = data.response || '';
      if (!text.trim()) {
        throw new Error('Ollama returned empty text');
      }
      return text.trim();
    } catch (err) {
      throw new Error(`Ollama text generation failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  // Default: gemini
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!geminiApiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Set it in the environment to enable AI text generation.'
    );
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt,
  });
  const text = response.text || '';
  if (!text.trim()) {
    throw new Error('Gemini returned empty text');
  }
  return text;
}
