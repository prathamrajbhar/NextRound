import { GoogleGenAI } from '@google/genai';

export async function generateText(prompt: string): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!geminiApiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Set it in the environment to enable AI text generation.'
    );
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  const text = response.text || '';
  if (!text.trim()) {
    throw new Error('Gemini returned empty text');
  }
  return text;
}
