import { GoogleGenAI } from '@google/genai';
import { AptitudeChunkSchema, AptitudeQuestionInput } from '@nextround/shared';
import aptitudeFallbackQuestions from '@nextround/shared/data/aptitude-questions.json';

export interface GeneratedQuestion {
  id: string;
  category: string;
  question: string;
  text: string;
  options: string[];
  correctIndex: number;
  difficulty?: string;
  explanation?: string;
  source?: string;
}

export interface AptitudeChunkOptions {
  jobTitle: string;
  jobDescription?: string;
  difficulty?: string;
  chunkIndex: number;
  chunkSize?: number;
  previousQuestions?: string[];
  category?: string;
}

const CATEGORIES = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
];

/**
 * Generates an AI-driven chunk/section of aptitude questions with strict Zod validation.
 * Supports progressive generation (chunk 0, chunk 1, chunk 2...) passing previous stems
 * to ensure non-repetition.
 */
export async function generateAptitudeChunk(options: AptitudeChunkOptions): Promise<AptitudeQuestionInput[]> {
  const isProduction = process.env.NODE_ENV === 'production';
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const chunkSize = Math.max(1, Math.min(10, options.chunkSize || 3));
  const chunkIndex = Math.max(0, options.chunkIndex || 0);
  const diff = ['easy', 'medium', 'hard'].includes(String(options.difficulty).toLowerCase()) ? String(options.difficulty).toLowerCase() : 'medium';
  const role = options.jobTitle || 'Software Engineer';
  const targetCategory = options.category || CATEGORIES[chunkIndex % CATEGORIES.length];

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const previousStems = (options.previousQuestions || []).slice(-15).join('\n- ');

      const prompt = `You are a principal assessment architect generating a PROGRESSIVE CHUNK of aptitude questions.

<JOB_TITLE>${role}</JOB_TITLE>
<JOB_DESCRIPTION>${(options.jobDescription || '').slice(0, 1000)}</JOB_DESCRIPTION>
<DIFFICULTY>${diff}</DIFFICULTY>
<CHUNK_INDEX>${chunkIndex}</CHUNK_INDEX>
<TARGET_CATEGORY>${targetCategory}</TARGET_CATEGORY>
<CHUNK_SIZE>${chunkSize}</CHUNK_SIZE>

<PREVIOUSLY_GENERATED_QUESTIONS>
${previousStems || 'None'}
</PREVIOUSLY_GENERATED_QUESTIONS>

CRITICAL INSTRUCTIONS:
- Generate EXACTLY ${chunkSize} NEW, DISTINCT multiple choice questions for category "${targetCategory}".
- Do NOT repeat any question stem or concept listed in PREVIOUSLY_GENERATED_QUESTIONS.
- Return ONLY valid raw JSON array of ${chunkSize} objects.
- Each object must have:
  - "id": "chunk_${chunkIndex}_q1", "chunk_${chunkIndex}_q2", etc.
  - "category": "${targetCategory}"
  - "difficulty": "${diff}"
  - "question": clear, unambiguous question stem
  - "options": array of EXACTLY 4 distinct choice strings
  - "correctIndex": integer (0, 1, 2, or 3)
  - "explanation": 1-sentence step-by-step solution

Return ONLY raw JSON array:
[
  {
    "id": "chunk_${chunkIndex}_q1",
    "category": "${targetCategory}",
    "difficulty": "${diff}",
    "question": "Question stem text...",
    "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
    "correctIndex": 0,
    "explanation": "Explanation text..."
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      const cleanJson = extractFirstJsonArray(responseText);

      if (cleanJson && Array.isArray(cleanJson) && cleanJson.length > 0) {
        const mapped = cleanJson.slice(0, chunkSize).map((q: any, idx: number) => {
          const opts = Array.isArray(q.options) && q.options.length >= 2
            ? q.options.map(String).slice(0, 4)
            : ['Option A', 'Option B', 'Option C', 'Option D'];
          while (opts.length < 4) {
            opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
          }
          const stem = String(q.question || q.text || `Question ${idx + 1}`);

          return {
            id: String(q.id || `chunk_${chunkIndex}_q${idx + 1}`),
            category: String(q.category || targetCategory),
            difficulty: diff as any,
            question: stem,
            text: stem,
            options: opts,
            correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
            explanation: q.explanation ? String(q.explanation) : undefined,
            source: 'ai-chunk-generator',
          };
        });

        // Strict Zod schema validation before saving or returning
        const validated = AptitudeChunkSchema.parse(mapped);
        return validated;
      }
    } catch (err) {
      console.error(`[AI Chunk Generation Error] Chunk ${chunkIndex}:`, err);
    }
  }

  // Production Safety: Never use static fallback files in production mode!
  if (isProduction) {
    throw new Error(`AI aptitude chunk generation failed for chunk ${chunkIndex} in production. Static fallback is disabled in production.`);
  }

  // Development / Testing fallback ONLY
  return generateDevelopmentFallbackChunk(chunkIndex, chunkSize, role, diff, targetCategory);
}

/**
 * Generates dynamic questions for full assessment backwards compatibility.
 */
export async function generateAiAptitudeQuestions(
  jobTitle: string,
  jobDescription: string,
  count: number = 5,
  difficulty?: string
): Promise<GeneratedQuestion[]> {
  const targetCount = Math.max(1, Math.min(100, count));
  const chunkSize = 3;
  const numChunks = Math.ceil(targetCount / chunkSize);

  const accumulated: GeneratedQuestion[] = [];
  const previousQuestions: string[] = [];

  for (let c = 0; c < numChunks; c++) {
    const currentChunkSize = Math.min(chunkSize, targetCount - accumulated.length);
    const chunk = await generateAptitudeChunk({
      jobTitle,
      jobDescription,
      difficulty,
      chunkIndex: c,
      chunkSize: currentChunkSize,
      previousQuestions,
    });

    for (const q of chunk) {
      accumulated.push({
        id: q.id,
        category: q.category,
        question: q.question,
        text: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        difficulty: q.difficulty,
        explanation: q.explanation,
        source: q.source,
      });
      previousQuestions.push(q.question);
    }

    if (accumulated.length >= targetCount) break;
  }

  return accumulated.slice(0, targetCount);
}

function generateDevelopmentFallbackChunk(
  chunkIndex: number,
  chunkSize: number,
  role: string,
  difficulty: string,
  category: string
): AptitudeQuestionInput[] {
  const startIndex = (chunkIndex * chunkSize) % aptitudeFallbackQuestions.length;
  const selected = (aptitudeFallbackQuestions as any[]).slice(startIndex, startIndex + chunkSize);

  if (selected.length < chunkSize) {
    selected.push(...(aptitudeFallbackQuestions as any[]).slice(0, chunkSize - selected.length));
  }

  return selected.map((q: any, idx: number) => {
    const stem = String(q.question || q.text || '').replace('{role}', role);
    return {
      id: `dev_${q.id}_c${chunkIndex}_q${idx}`,
      category: category || String(q.category || 'General Aptitude'),
      difficulty: (difficulty as any) || 'medium',
      question: stem,
      text: stem,
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      explanation: q.explanation ? String(q.explanation) : undefined,
      source: 'development-fallback',
    };
  });
}

function extractFirstJsonArray(text: string): any {
  try {
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      const candidate = text.slice(firstBracket, lastBracket + 1);
      return JSON.parse(candidate);
    }
  } catch {}
  return null;
}
