export interface AssessmentDifficultyDistribution {
  easy: number;
  intermediate: number;
  advanced: number;
}

export interface AssessmentQuestionPromptOptions {
  title?: string;
  description: string;
  skills?: string[];
  experienceLevel?: string;
  distribution: AssessmentDifficultyDistribution;
}

export function buildAssessmentQuestionGenPrompt(options: AssessmentQuestionPromptOptions): string {
  const {
    title = 'Software Engineer',
    description,
    skills = [],
    experienceLevel = 'Mid-Level',
    distribution,
  } = options;

  const totalRequired = distribution.easy + distribution.intermediate + distribution.advanced;

  const tierRequirements: string[] = [];
  if (distribution.easy > 0) {
    tierRequirements.push(`- Generate exactly ${distribution.easy} question(s) with "difficulty": "easy" (core definitions, foundational concepts, basic syntax, fundamental knowledge).`);
  }
  if (distribution.intermediate > 0) {
    tierRequirements.push(`- Generate exactly ${distribution.intermediate} question(s) with "difficulty": "intermediate" (practical problem-solving, debugging scenarios, framework API usage, real-world development trade-offs).`);
  }
  if (distribution.advanced > 0) {
    tierRequirements.push(`- Generate exactly ${distribution.advanced} question(s) with "difficulty": "advanced" (performance optimization, edge cases, scalability, concurrency, distributed systems, deep architecture pitfalls).`);
  }

  return `You are a principal technical interviewer and assessment designer for top technology companies.
Generate a high-quality, practical Multiple-Choice Assessment (MCQ) based on the provided Job Description and required competencies.

ROLE CONTEXT:
- Title: ${title}
- Seniority / Level: ${experienceLevel}
- Core Skills: ${skills.join(', ') || 'Derived from description'}
- Job Description:
${description.slice(0, 8000)}

EXACT QUANTITY & DIFFICULTY BREAKDOWN (Total ${totalRequired} questions):
${tierRequirements.join('\n')}

REQUIREMENTS:
1. You MUST generate ONLY the exact counts specified above for each difficulty level. Do NOT generate difficulties that have a count of 0.
2. Every question must have:
   - "id": Unique string identifier (e.g. "q_easy_1", "q_int_1", "q_adv_1").
   - "difficulty": Exactly "easy" | "intermediate" | "advanced".
   - "category": Relevant skill or topic name (e.g., "Python", "System Design", "SQL", "React").
   - "question": Clear, concise, professional question text.
   - "options": Exactly 4 plausible options [Option 0, Option 1, Option 2, Option 3].
   - "correctIndex": Integer index (0, 1, 2, or 3) indicating the single unambiguously correct answer.
   - "explanation": 1-2 sentences explaining why the correct answer is right and why other options are incorrect.

3. Zero bias, high technical accuracy, no trivial trick questions, and no duplicated questions.

Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "id": string,
      "difficulty": "easy" | "intermediate" | "advanced",
      "category": string,
      "question": string,
      "options": string[],
      "correctIndex": number,
      "explanation": string
    }
  ]
}`;
}
