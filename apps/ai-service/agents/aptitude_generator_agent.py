import json
import re
import logging
from typing import List, Dict, Any
from core.config import settings

logger = logging.getLogger("aptitude_generator_agent")

genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize Google GenAI Client in aptitude_generator_agent: {e}")


def _fallback_questions(job_title: str, count: int = 5) -> List[Dict[str, Any]]:
    """Safe fallback question generator tailored to job title if LLM call is unavailable."""
    title_lower = job_title.lower() if job_title else "general"
    
    questions = [
        {
            "id": "apt_q1",
            "category": "Quantitative Reasoning",
            "difficulty": "medium",
            "question": f"For a {job_title or 'Engineering'} project, reducing workload by 20% while increasing team productivity by 25% results in what net capacity change?",
            "options": ["No change (0%)", "5% increase", "10% increase", "5% decrease"],
            "correctIndex": 0,
        },
        {
            "id": "apt_q2",
            "category": "Logical Deduction",
            "difficulty": "medium",
            "question": "All algorithms with O(N log N) runtime outperform O(N^2) algorithms for sufficiently large datasets. Algorithm A runs in O(N log N). Which statement must be true?",
            "options": [
                "Algorithm A is faster for any dataset size.",
                "For sufficiently large inputs, Algorithm A will outperform O(N^2) algorithms.",
                "Algorithm A uses O(N) memory space.",
                "Algorithm A is optimal for sorting."
            ],
            "correctIndex": 1,
        },
        {
            "id": "apt_q3",
            "category": "Pattern Recognition",
            "difficulty": "easy",
            "question": "What is the next number in the growth sequence: 2, 6, 12, 20, 30, ?",
            "options": ["40", "42", "44", "48"],
            "correctIndex": 1,
        },
        {
            "id": "apt_q4",
            "category": "Data Interpretation",
            "difficulty": "medium",
            "question": "A data system handles 10,000 throughput operations/sec with 50ms latency. If throughput doubles and latency scales linearly with load, what is the expected latency?",
            "options": ["50ms", "75ms", "100ms", "200ms"],
            "correctIndex": 2,
        },
        {
            "id": "apt_q5",
            "category": "Problem Solving",
            "difficulty": "hard",
            "question": "Three microservices A, B, and C have individual reliability SLAs of 99.9%, 99.5%, and 99.0%. What is the combined sequential system reliability?",
            "options": ["98.4%", "99.0%", "99.5%", "99.9%"],
            "correctIndex": 0,
        },
    ]
    return questions[:count]


async def generate_aptitude_questions(
    job_title: str = "Software Engineer",
    job_description: str = "",
    count: int = 5
) -> List[Dict[str, Any]]:
    """
    Dynamically generate N role-customized aptitude questions using Google GenAI (gemini-2.5-flash).
    Does NOT include explanations in output as per user specifications.
    """
    if not genai_client:
        logger.info(f"GenAI client not initialized. Using role-tailored fallback generator for {job_title}.")
        return _fallback_questions(job_title, count)

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

    try:
        res = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        if res and res.text:
            cleaned = res.text.strip()
            # Extract JSON array using regex if surrounded by markdown code blocks
            match = re.search(r"\[.*\]", cleaned, re.DOTALL)
            if match:
                raw_json = match.group(0)
                parsed = json.loads(raw_json)
                if isinstance(parsed, list) and len(parsed) > 0:
                    validated_questions = []
                    for idx, q in enumerate(parsed):
                        q_id = str(q.get("id") or f"gen_q{idx+1}")
                        cat = str(q.get("category") or "Logical Deduction")
                        diff = str(q.get("difficulty") or "medium")
                        stem = str(q.get("question") or "")
                        opts = q.get("options")
                        if not isinstance(opts, list) or len(opts) < 2:
                            continue
                        opts = [str(o) for o in opts]
                        correct_idx = q.get("correctIndex")
                        if not isinstance(correct_idx, int) or correct_idx < 0 or correct_idx >= len(opts):
                            correct_idx = 0
                        
                        validated_questions.append({
                            "id": q_id,
                            "category": cat,
                            "difficulty": diff,
                            "question": stem,
                            "options": opts,
                            "correctIndex": correct_idx,
                        })

                    if len(validated_questions) > 0:
                        logger.info(f"Successfully generated {len(validated_questions)} dynamic LLM aptitude questions for {job_title}.")
                        return validated_questions[:count]

    except Exception as e:
        logger.error(f"GenAI dynamic aptitude generation failed for {job_title}: {e}")

    logger.warning("Falling back to structured question pool due to GenAI parse error.")
    return _fallback_questions(job_title, count)
