export interface AssessmentQuestionPromptOptions {
  title?: string;
  description: string;
  skills?: string[];
  experienceLevel?: string;
  countPerTier?: number;
}

export function buildAssessmentQuestionGenPrompt(options: AssessmentQuestionPromptOptions): string {
  const {
    title = 'Software Engineer',
    description,
    skills = [],
    experienceLevel = 'Mid-Level',
    countPerTier = 4,
  } = options;

  return `You are a principal technical interviewer and assessment designer for top technology companies.
Generate a high-quality, practical Multiple-Choice Assessment (MCQ) based on the provided Job Description and required competencies.

ROLE CONTEXT:
- Title: ${title}
- Seniority / Level: ${experienceLevel}
- Core Skills: ${skills.join(', ') || 'Derived from description'}
- Job Description:
${description.slice(0, 8000)}

REQUIREMENTS:
1. Generate exactly ${countPerTier} questions for EACH of the following 3 difficulty tiers (total ${countPerTier * 3} questions):
   - "easy": Foundational concepts, definitions, core syntax, direct knowledge checks relevant to the role's stack.
   - "intermediate": Practical problem solving, debugging scenarios, API/framework usage, architectural trade-offs.
   - "advanced": Performance optimization, edge cases, distributed systems / concurrency, scalability, or tricky real-world system pitfalls.

2. Every question must have:
   - "id": Unique string identifier (e.g. "q_easy_1", "q_int_1", "q_adv_1").
   - "difficulty": Exactly one of "easy" | "intermediate" | "advanced".
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
