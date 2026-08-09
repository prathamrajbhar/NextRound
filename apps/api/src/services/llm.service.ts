import { GoogleGenAI } from '@google/genai';

/**
 * Generates text using Gemini (primary) and switches to Ollama (fallback) if Gemini is unavailable or fails.
 */
export async function generateText(prompt: string): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const tasks: Promise<string>[] = [];

  if (geminiApiKey) {
    tasks.push((async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        const text = response.text || '';
        if (text.trim()) {
          return text;
        }
        throw new Error('Gemini returned empty text');
      } catch (err: any) {
        console.warn('[Central LLM Service] Gemini call failed:', err?.message || err);
        throw err;
      }
    })());
  }

  // Ollama generation task
  tasks.push((async () => {
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'minimax-m3:cloud';

    try {
      const url = `${ollamaBaseUrl.replace(/\/$/, '')}/api/generate`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt,
          stream: false,
          options: {
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with status: ${response.status}`);
      }

      const data = await response.json() as { response: string };
      const text = data.response || '';
      if (!text.trim()) {
        throw new Error('Ollama returned empty response');
      }
      return text;
    } catch (err: any) {
      console.warn('[Central LLM Service] Ollama call failed:', err?.message || err);
      throw err;
    }
  })());

  try {
    return await Promise.any(tasks);
  } catch (err) {
    console.error('[Central LLM Service] Parallel generation failed for all models:', err);
    throw new Error('Both Gemini and Ollama models failed to generate content');
  }
}
