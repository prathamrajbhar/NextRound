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
  count: number = 5
): Promise<GeneratedQuestion[]> {
  const targetCount = Math.max(1, Math.min(100, count));
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a senior assessment architect generating aptitude questions for a recruitment test.
Generate EXACTLY ${targetCount} unique, high-quality multiple choice aptitude questions for a candidate applying for:

JOB TITLE: ${jobTitle || 'Software Engineer'}
JOB CONTEXT: ${(jobDescription || '').slice(0, 2000)}

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
- "difficulty": "easy", "medium", or "hard"

Return ONLY a valid raw JSON array of ${targetCount} objects:
[
  {
    "id": "gen_q1",
    "category": "Quantitative Aptitude",
    "difficulty": "medium",
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
              difficulty: String(q.difficulty || 'medium'),
              source: 'gemini-ai',
            };
          });
        }
      }
    } catch (err) {
      console.error('Gemini AI question generation error:', err);
    }
  }

  return generateProceduralAptitudeQuestions(targetCount);
}

/**
 * Procedural fallback — generates standard aptitude questions across 4 categories.
 * Used when Gemini API key is absent or the API call fails.
 */
function generateProceduralAptitudeQuestions(count: number): GeneratedQuestion[] {
  const categories = ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation'];
  const questions: GeneratedQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const categoryIndex = i % 4;
    const category = categories[categoryIndex];
    const seed = i + 1;
    let questionText = '';
    let options: string[] = [];
    let correctIdx = 0;

    if (categoryIndex === 0) {
      // Quantitative Aptitude
      const cost = 10 + (seed * 7) % 40;
      const qty = 5 + (seed * 3) % 20;
      const pct = 10 + (seed * 5) % 40;
      const sp = Math.round(cost * (1 + pct / 100));
      const total = sp * qty;
      questionText = `A merchant buys ${qty} items at Rs.${cost} each and sells at a ${pct}% profit. What is the total selling price?`;
      options = [
        `Rs.${total - qty * 5}`,
        `Rs.${total}`,
        `Rs.${total + qty * 5}`,
        `Rs.${cost * qty}`,
      ];
      correctIdx = 1;
    } else if (categoryIndex === 1) {
      // Logical Reasoning
      const start = 2 + (seed % 5);
      const diff = 3 + (seed % 4);
      const seq = [start, start + diff, start + diff * 2, start + diff * 3];
      const next = start + diff * 4;
      questionText = `Find the next number in the series: ${seq.join(', ')}, ?`;
      options = [
        String(next - diff),
        String(next + diff),
        String(next),
        String(next * 2),
      ];
      correctIdx = 2;
    } else if (categoryIndex === 2) {
      // Verbal Ability
      const wordSets = [
        { q: 'Choose the word most similar in meaning to "ELOQUENT":', opts: ['Silent', 'Articulate', 'Confused', 'Reckless'], ans: 1 },
        { q: 'Choose the antonym of "ABUNDANT":', opts: ['Scarce', 'Plentiful', 'Rich', 'Generous'], ans: 0 },
        { q: 'Select the correctly spelled word:', opts: ['Accomodate', 'Accommodate', 'Acommodate', 'Accommadate'], ans: 1 },
        { q: 'Complete the sentence: "She was so tired she could ___ keep her eyes open."', opts: ['barely', 'nearly', 'mostly', 'largely'], ans: 0 },
        { q: 'Choose the synonym of "METICULOUS":', opts: ['Careless', 'Precise', 'Hasty', 'Vague'], ans: 1 },
        { q: 'Choose the antonym of "BENEVOLENT":', opts: ['Kind', 'Generous', 'Malevolent', 'Charitable'], ans: 2 },
        { q: 'Choose the word most similar to "VERBOSE":', opts: ['Brief', 'Wordy', 'Clear', 'Concise'], ans: 1 },
      ];
      const ws = wordSets[i % wordSets.length];
      questionText = ws.q;
      options = ws.opts;
      correctIdx = ws.ans;
    } else {
      // Data Interpretation
      const salesA = 120 + (seed * 30) % 200;
      const salesB = 80 + (seed * 20) % 150;
      const salesC = 50 + (seed * 15) % 100;
      const total = salesA + salesB + salesC;
      const pctA = Math.round((salesA / total) * 100);
      questionText = `In Q${(seed % 4) + 1}, Company A sold ${salesA} units, B sold ${salesB} units, C sold ${salesC} units. What percentage of total sales did Company A contribute?`;
      options = [
        `${pctA - 10}%`,
        `${pctA - 5}%`,
        `${pctA}%`,
        `${pctA + 8}%`,
      ];
      correctIdx = 2;
    }

    questions.push({
      id: `apt_gen_${i + 1}`,
      category,
      question: questionText,
      text: questionText,
      options,
      correctIndex: correctIdx,
      difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
      source: 'procedural',
    });
  }

  return questions;
}
