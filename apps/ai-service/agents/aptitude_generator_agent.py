import json
import logging
import os
import httpx
from typing import List, Dict, Any
from core.config import settings
from services.llm_service import generate_text, extract_json_array

logger = logging.getLogger("aptitude_generator_agent")

# Canonical aptitude question bank — single source of truth shared with the
# Express API and the web fallback. See packages/shared/data/aptitude-questions.json.
_FALLBACK_PATH = os.path.join(settings.shared_data_dir, "aptitude-questions.json")


def _load_canonical_questions() -> List[Dict[str, Any]]:
    """Load the canonical aptitude question bank from packages/shared/data."""
    if not os.path.exists(_FALLBACK_PATH):
        raise RuntimeError(
            f"Canonical aptitude question bank not found at {_FALLBACK_PATH}. "
            "Expected packages/shared/data/aptitude-questions.json to exist."
        )
    with open(_FALLBACK_PATH, "r", encoding="utf-8") as f:
        return json.load(f)



def _parse_llm_json_response(raw_text: str, count: int, job_title: str) -> List[Dict[str, Any]]:
    """Clean and validate raw LLM text payload into a valid question array."""
    parsed = extract_json_array(raw_text)
    if not parsed:
        return []

    try:
        validated = []
        for idx, q in enumerate(parsed):
            q_id = str(q.get("id") or f"gen_q{idx+1}")
            cat = str(q.get("category") or "Logical Deduction")
            diff = str(q.get("difficulty") or "medium")
            stem = str(q.get("question") or q.get("text") or "")
            opts = q.get("options")
            if not stem or not isinstance(opts, list) or len(opts) < 2:
                continue
            opts = [str(o) for o in opts]
            correct_idx = q.get("correctIndex")
            if not isinstance(correct_idx, int) or correct_idx < 0 or correct_idx >= len(opts):
                correct_idx = 0
            
            validated.append({
                "id": q_id,
                "category": cat,
                "difficulty": diff,
                "question": stem,
                "text": stem,
                "options": opts,
                "correctIndex": correct_idx,
                # Mark LLM-generated questions so callers can distinguish them
                # from static-bank fallback questions.
                "source": "ai-generated",
            })
        
        return validated[:count]
    except Exception as parse_err:
        logger.warning(f"JSON parse error in LLM payload for {job_title}: {parse_err}")
        return []


def _fallback_questions(job_title: str, count: int = 5) -> List[Dict[str, Any]]:
    """Fallback question generator pulling from canonical bank with role interpolation."""
    role = job_title.strip() if job_title and job_title.strip() else "Software Engineer"
    canonical = _load_canonical_questions()
    selected = canonical[:min(count, len(canonical))]

    out = []
    for q in selected:
        item = dict(q)
        stem = str(item.get("question") or "").replace("{role}", role)
        item["question"] = stem
        item["text"] = stem
        item["source"] = "fallback"
        out.append(item)
    return out



async def _generate_with_ollama(prompt: str, count: int, job_title: str) -> List[Dict[str, Any]]:
    """Failover generator using local Ollama instance (OLLAMA_BASE_URL & OLLAMA_MODEL)."""
    ollama_url = f"{settings.ollama_base_url.rstrip('/')}/api/generate"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                ollama_url,
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                raw_response = data.get("response", "")
                questions = _parse_llm_json_response(raw_response, count, job_title)
                if questions:
                    logger.info(f"Successfully generated {len(questions)} aptitude questions using Ollama ({settings.ollama_model}).")
                    return questions
    except Exception as err:
        logger.warning(f"Ollama failover question generation unavailable at {ollama_url}: {err}")
    return []


async def generate_aptitude_questions(
    job_title: str = "Software Engineer",
    job_description: str = "",
    count: int = 5
) -> List[Dict[str, Any]]:
    """
    Dynamically generate N role-customized aptitude questions using Gemini + Ollama LLM chain:
    1. Gemini (primary model: GEMINI_MODEL in .env, default gemini-2.5-flash)
    2. Ollama (failover model: OLLAMA_MODEL at OLLAMA_BASE_URL in .env, default llama3.2)
    3. Dynamic role-customized fallback
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

    # 1. Primary Provider: Gemini GenAI
    gemini_text = generate_text(prompt)
    if gemini_text:
        questions = _parse_llm_json_response(gemini_text, count, job_title)
        if questions:
            logger.info(f"Successfully generated {len(questions)} dynamic aptitude questions via Gemini ({settings.gemini_model}) for {job_title}.")
            return questions
    logger.warning(f"Gemini aptitude question generation failed for {job_title}. Trying Ollama failover.")

    # 2. Failover Provider: Ollama
    ollama_questions = await _generate_with_ollama(prompt, count, job_title)
    if ollama_questions:
        return ollama_questions

    # 3. Final Fallback
    logger.info(f"Using role-tailored fallback question generator for {job_title}.")
    return _fallback_questions(job_title, count)


