import json
import logging
from typing import List, Dict, Any
from core.config import settings
from services.llm.llm_service import generate_text, extract_json_array

logger = logging.getLogger("aptitude_generator_agent")

def _parse_llm_json_response(raw_text: str, count: int, job_title: str) -> List[Dict[str, Any]]:
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
]"""

    gemini_text = generate_text(prompt)
    if gemini_text:
        questions = _parse_llm_json_response(gemini_text, count, job_title)
        if questions:
            return questions

    raise RuntimeError(
        f"AI aptitude question generation failed via LLM for '{job_title}'."
    )


