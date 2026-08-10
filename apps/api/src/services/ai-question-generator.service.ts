import { generateText } from './llm.service';
import { AptitudeChunkSchema, AptitudeQuestionInput } from '@nextround/shared';




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
  const chunkSize = Math.max(1, Math.min(10, options.chunkSize || 3));
  const chunkIndex = Math.max(0, options.chunkIndex || 0);

  // Difficulty and role are caller-provided config. No default category or
  // difficulty is invented — the caller supplies what the job actually needs.
  const requestedDiff = String(options.difficulty ?? '').toLowerCase();
  const diff = ['easy', 'medium', 'hard'].includes(requestedDiff) ? requestedDiff : null;
  const role = options.jobTitle || '';
  const targetCategory = options.category || null;
  if (!targetCategory) {
    throw new Error('generateAptitudeChunk requires a category; no category is invented.');
  }
  if (!diff) {
    throw new Error('generateAptitudeChunk requires a difficulty; no difficulty is invented.');
  }

  try {
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

    const responseText = await generateText(prompt);
    const cleanJson = extractFirstJsonArray(responseText);

    if (cleanJson && Array.isArray(cleanJson) && cleanJson.length > 0) {
      const mapped = cleanJson.slice(0, chunkSize).map((q: any, idx: number) => {
        // Every field must be real: options, question text, and correctIndex all
        // come from the LLM. Fabricated options or a default correctIndex are
        // rejected — a malformed question is skipped, never invented.
        const opts = Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [];
        const stem = typeof q.question === 'string' ? q.question : (typeof q.text === 'string' ? q.text : null);
        const correctIndex = typeof q.correctIndex === 'number' && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3
          ? q.correctIndex
          : null;

        if (opts.length < 4 || !stem || correctIndex === null) {
          throw new Error(`LLM returned a malformed question at index ${idx} (missing options, stem, or valid correctIndex).`);
        }

        return {
          id: String(q.id || `chunk_${chunkIndex}_q${idx + 1}`),
          category: targetCategory,
          difficulty: diff as any,
          question: stem,
          text: stem,
          options: opts,
          correctIndex,
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
    throw err;
  }

  throw new Error(`AI aptitude chunk generation failed for chunk ${chunkIndex} (both Gemini and Ollama failed).`);
}

/**
 * Generates dynamic questions for full assessment backwards compatibility.
 */
export async function generateAiAptitudeQuestions(
  jobTitle: string,
  jobDescription: string,
  count: number = 5,
  difficulty: string,
  category: string
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
      category,
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
