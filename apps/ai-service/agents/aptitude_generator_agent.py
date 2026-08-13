import json
import logging
from typing import List, Dict, Any
from core.config import settings
from services.llm_service import generate_text, extract_json_array

logger = logging.getLogger("aptitude_generator_agent")






def _parse_llm_json_response(raw_text: str, count: int, job_title: str) -> List[Dict[str, Any]]:
    """Clean and validate raw LLM text payload into a valid question array."""
    parsed = extract_json_array(raw_text)
    if not parsed:
        return []

    try:
        validated = []
        for idx, q in enumerate(parsed):
            q_id = str(q.get("id") or f"gen_q{idx+1}")
            cat = q.get("category")
            diff = q.get("difficulty")
            stem = str(q.get("question") or q.get("text") or "")
            opts = q.get("options")
            correct_idx = q.get("correctIndex")
            explanation = q.get("explanation", "")
            

            if not cat or not diff:
                logger.debug(f"Skipping question {q_id}: missing category or difficulty")
                continue
            



            if not stem or not isinstance(opts, list) or len(opts) < 2:
                continue
            if not isinstance(correct_idx, int) or correct_idx < 0 or correct_idx >= len(opts):
                continue
            opts = [str(o) for o in opts]

            validated.append({
                "id": q_id,
                "category": str(cat),
                "difficulty": str(diff),
                "question": stem,
                "text": stem,
                "options": opts,
                "correctIndex": correct_idx,
                "explanation": str(explanation) if explanation else "",


                "source": "ai-generated",
            })

        return validated[:count]
    except Exception as parse_err:
        logger.warning(f"JSON parse error in LLM payload for {job_title}: {parse_err}")
        return []


async def generate_aptitude_questions(
    job_title: str = "Software Engineer",
    job_description: str = "",
    count: int = 5
) -> List[Dict[str, Any]]:
    """
    Dynamically generate N role-customized aptitude questions using Gemini:
    1. Gemini (primary model: GEMINI_MODEL in .env, default gemini-2.5-flash)
    """
    prompt = f"""You are an expert recruiter and assessment engineer. Generate a set of {count} high-quality, non-standard cognitive aptitude test questions tailored for a candidate applying for the position of:

Job Title: {job_title}
Job Description & Context: {job_description or 'General technical & analytical role'}

Requirements for output:
1. Provide exactly {count} multiple choice questions balancing 4 core categories:
   - Logical Deduction
   - Quantitative Reasoning
   - Pattern Recognition & Data Interpretation
   - Problem Solving & Role-Specific Reasoning
2. Each question MUST have:
   - "id": unique short string like "gen_q1", "gen_q2"
   - "category": string name of category
   - "difficulty": "easy", "medium", or "hard"
   - "question": clear question stem
   - "options": list of exactly 4 distinct choices
   - "correctIndex": integer index (0, 1, 2, or 3) pointing to the correct option in "options"
3. DO NOT include any explanation or answer key rationale text. Keep payload strictly minimal.
4. Output MUST be valid JSON array of objects.

JSON Format required:
[
  {{
    "id": "gen_q1",
    "category": "Quantitative Reasoning",
    "difficulty": "medium",
    "question": "Question text here...",
    "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
    "correctIndex": 0
  }}
]
"""


    gemini_text = generate_text(prompt)
    if gemini_text:
        questions = _parse_llm_json_response(gemini_text, count, job_title)
        if questions:
            logger.info(f"Successfully generated {len(questions)} dynamic aptitude questions via Gemini ({settings.gemini_model}) for {job_title}.")
            return questions

    raise RuntimeError(
        f"AI aptitude question generation failed via Gemini for '{job_title}'."
    )


async def generate_aptitude_chunk(
    job_title: str = "Software Engineer",
    job_description: str = "",
    difficulty: str = "medium",
    chunk_index: int = 0,
    chunk_size: int = 3,
    previous_questions: List[str] = None,
    category: str = None,
) -> List[Dict[str, Any]]:
    """
    Generates a single progressive chunk (section) of aptitude questions.
    Passes previously generated question stems to prevent repetition across chunks.
    Supports category-targeted generation per chunk.
    """
    categories = [
        "Quantitative Reasoning",
        "Logical Deduction",
        "Verbal & Communication Ability",
        "Pattern Recognition & Data Interpretation",
    ]
    target_category = category or categories[chunk_index % len(categories)]
    prev_stems = "\n- ".join((previous_questions or [])[-15:])

    prompt = f"""You are a principal assessment architect generating a PROGRESSIVE CHUNK of aptitude questions.

<JOB_TITLE>{job_title}</JOB_TITLE>
<JOB_DESCRIPTION>{(job_description or "").strip()[:800]}</JOB_DESCRIPTION>
<DIFFICULTY>{difficulty}</DIFFICULTY>
<CHUNK_INDEX>{chunk_index}</CHUNK_INDEX>
<TARGET_CATEGORY>{target_category}</TARGET_CATEGORY>
<CHUNK_SIZE>{chunk_size}</CHUNK_SIZE>

<PREVIOUSLY_GENERATED_QUESTIONS>
{"- " + prev_stems if prev_stems else "None"}
</PREVIOUSLY_GENERATED_QUESTIONS>

CRITICAL INSTRUCTIONS:
- Generate EXACTLY {chunk_size} NEW, DISTINCT multiple choice questions for category "{target_category}".
- Do NOT repeat any question stem or concept listed in PREVIOUSLY_GENERATED_QUESTIONS.
- Return ONLY valid raw JSON array of {chunk_size} objects.

Each object must have:
- "id": "chunk_{chunk_index}_q1", "chunk_{chunk_index}_q2", etc.
- "category": "{target_category}"
- "difficulty": "{difficulty}"
- "question": clear, unambiguous question stem
- "options": list of exactly 4 distinct choice strings
- "correctIndex": integer (0, 1, 2, or 3)
- "explanation": 1-sentence step-by-step explanation

Return ONLY raw JSON array:
[
  {{
    "id": "chunk_{chunk_index}_q1",
    "category": "{target_category}",
    "difficulty": "{difficulty}",
    "question": "Question stem text...",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "Explanation..."
  }}
]"""


    gemini_text = generate_text(prompt)
    if gemini_text:
        questions = _parse_llm_json_response(gemini_text, chunk_size, job_title)
        if questions:

            for idx, q in enumerate(questions):
                if not q["id"].startswith(f"chunk_{chunk_index}_"):
                    q["id"] = f"chunk_{chunk_index}_q{idx + 1}"
                q["source"] = "ai-chunk"
            logger.info(f"Generated chunk {chunk_index} ({len(questions)} questions) via Gemini for {job_title}.")
            return questions
    raise RuntimeError(
        f"AI aptitude chunk generation failed via Gemini for chunk {chunk_index} of '{job_title}'."
    )



