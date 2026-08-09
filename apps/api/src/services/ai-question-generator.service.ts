import { GoogleGenAI } from '@google/genai';

export interface GeneratedQuestion {
  id: string;
  category: string;
  question: string;
  text: string;
  options: string[];
  correctIndex: number;
  difficulty?: string;
  source?: string;
}

/**
 * Generates N dynamic aptitude questions using Gemini LLM.
 * Categories: Quantitative Aptitude, Logical Reasoning, Verbal Ability, Data Interpretation.
 * Strictly respects the exact question count set by the employer (up to 100).
 */
export async function generateAiAptitudeQuestions(
  jobTitle: string,
  jobDescription: string,
  count: number = 5,
  difficulty?: string
): Promise<GeneratedQuestion[]> {
  const targetCount = Math.max(1, Math.min(100, count));
  const apiKey = process.env.GEMINI_API_KEY;
  const diff = difficulty || 'medium';

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a senior assessment architect generating aptitude questions for a recruitment test.
Generate EXACTLY ${targetCount} unique, high-quality multiple choice aptitude questions for a candidate applying for:

JOB TITLE: ${jobTitle || 'Software Engineer'}
JOB CONTEXT: ${(jobDescription || '').slice(0, 2000)}
DIFFICULTY: ${diff}

CATEGORY DISTRIBUTION — distribute questions evenly across these 4 categories:
1. "Quantitative Aptitude" — arithmetic, percentages, ratios, profit & loss, time-speed-distance, work-rate problems
2. "Logical Reasoning" — series completion, syllogisms, blood relations, coding-decoding, direction sense, arrangements
3. "Verbal Ability" — synonyms, antonyms, sentence completion, reading comprehension, grammar, vocabulary
4. "Data Interpretation" — bar chart analysis, pie chart percentages, table data reading, line graph trends

REQUIREMENTS per question:
- "id": "gen_q1", "gen_q2", etc.
- "category": exactly one of the 4 category names above (verbatim)
- "question": clear, unambiguous question stem
- "options": array of EXACTLY 4 distinct choices
- "correctIndex": integer (0, 1, 2, or 3)
- "difficulty": "${diff}"

Return ONLY a valid raw JSON array of ${targetCount} objects:
[
  {
    "id": "gen_q1",
    "category": "Quantitative Aptitude",
    "difficulty": "${diff}",
    "question": "Question text here...",
    "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
    "correctIndex": 0
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validCategories = ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation'];
          return parsed.slice(0, targetCount).map((q: any, idx: number) => {
            const opts = Array.isArray(q.options) && q.options.length >= 2
              ? q.options.map(String).slice(0, 4)
              : ['Option A', 'Option B', 'Option C', 'Option D'];
            while (opts.length < 4) {
              opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
            }
            const stem = String(q.question || q.text || `Aptitude question ${idx + 1}`);
            const category = validCategories.includes(q.category)
              ? q.category
              : validCategories[idx % validCategories.length];
            return {
              id: String(q.id || `gen_q${idx + 1}`),
              category,
              question: stem,
              text: stem,
              options: opts,
              correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < opts.length ? q.correctIndex : 0,
              difficulty: String(q.difficulty || diff),
              source: 'gemini-ai',
            };
          });
        }
      }
    } catch (err) {
      console.error('Gemini AI question generation error:', err);
    }
  }

  return generateProceduralAptitudeQuestions(targetCount, jobTitle, difficulty);
}

import aptitudeFallbackQuestions from '@nextround/shared/data/aptitude-questions.json';

function generateProceduralAptitudeQuestions(count: number, jobTitle?: string, difficulty?: string): GeneratedQuestion[] {
  const role = jobTitle?.trim() || 'Software Engineer';
  const diff = difficulty?.trim();
  const selected = (aptitudeFallbackQuestions as any[]).slice(0, Math.min(count, aptitudeFallbackQuestions.length));

  return selected.map((q: any) => {
    const stem = String(q.question || q.text || '').replace('{role}', role);
    return {
      id: String(q.id),
      category: String(q.category || 'General Aptitude'),
      question: stem,
      text: stem,
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      difficulty: diff || String(q.difficulty || 'medium'),
      explanation: q.explanation ? String(q.explanation) : undefined,
      source: 'canonical-bank',
    };
  });
}

