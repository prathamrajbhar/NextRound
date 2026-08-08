import json
import re
import logging
import httpx
from typing import List, Dict, Any
from core.config import settings

logger = logging.getLogger("aptitude_generator_agent")

genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
        logger.info(f"Initialized Google GenAI client with model: {settings.gemini_model}")
    except Exception as e:
        logger.warning(f"Failed to initialize Google GenAI Client in aptitude_generator_agent: {e}")


def _parse_llm_json_response(raw_text: str, count: int, job_title: str) -> List[Dict[str, Any]]:
    """Clean and validate raw LLM text payload into a valid question array."""
    if not raw_text:
        return []
    
    cleaned = raw_text.strip()
    match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if not match:
        return []
    
    try:
        parsed = json.loads(match.group(0))
        if not isinstance(parsed, list) or len(parsed) == 0:
            return []
        
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
            })
        
        return validated[:count]
    except Exception as parse_err:
        logger.warning(f"JSON parse error in LLM payload for {job_title}: {parse_err}")
        return []


def _fallback_questions(job_title: str, count: int = 5) -> List[Dict[str, Any]]:
    """Role-customized fallback questions if Gemini and Ollama services are unreachable."""
    role = job_title or "Software Engineer"
    questions = [
        {
            "id": "apt_q1",
            "category": "Quantitative Reasoning",
            "difficulty": "medium",
            "question": f"For a {role} project, reducing execution overhead by 20% while increasing team throughput by 25% results in what net capacity change?",
            "text": f"For a {role} project, reducing execution overhead by 20% while increasing team throughput by 25% results in what net capacity change?",
            "options": ["No change (0%)", "5% net increase", "10% net increase", "5% net decrease"],
            "correctIndex": 0,
        },
        {
            "id": "apt_q2",
            "category": "Logical Deduction",
            "difficulty": "medium",
            "question": "All sub-routines with O(N log N) runtime scale better than O(N^2) algorithms for large datasets. Module A operates in O(N log N). Which statement must be true?",
            "text": "All sub-routines with O(N log N) runtime scale better than O(N^2) algorithms for large datasets. Module A operates in O(N log N). Which statement must be true?",
            "options": [
                "Module A is faster for any input size.",
                "For sufficiently large inputs, Module A will outperform O(N^2) algorithms.",
                "Module A consumes O(N) memory.",
                "Module A is optimal for sorting."
            ],
            "correctIndex": 1,
        },
        {
            "id": "apt_q3",
            "category": "Pattern Recognition",
            "difficulty": "easy",
            "question": "What is the next value in the scaling sequence: 2, 6, 12, 20, 30, ?",
            "text": "What is the next value in the scaling sequence: 2, 6, 12, 20, 30, ?",
            "options": ["40", "42", "44", "48"],
            "correctIndex": 1,
        },
        {
            "id": "apt_q4",
            "category": "Data Interpretation",
            "difficulty": "medium",
            "question": "A cluster handles 10,000 throughput operations/sec with 50ms average response time. If throughput doubles and latency scales linearly with load, what is the expected latency?",
            "text": "A cluster handles 10,000 throughput operations/sec with 50ms average response time. If throughput doubles and latency scales linearly with load, what is the expected latency?",
            "options": ["50ms", "75ms", "100ms", "200ms"],
            "correctIndex": 2,
        },
        {
            "id": "apt_q5",
            "category": "Problem Solving",
            "difficulty": "hard",
            "question": "Three dependent microservices A, B, and C have individual SLAs of 99.9%, 99.5%, and 99.0%. What is the sequential end-to-end system availability?",
            "text": "Three dependent microservices A, B, and C have individual SLAs of 99.9%, 99.5%, and 99.0%. What is the sequential end-to-end system availability?",
            "options": ["98.4%", "99.0%", "99.5%", "99.9%"],
            "correctIndex": 0,
        },
    ]
    return questions[:count]


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
    if genai_client:
        try:
            res = genai_client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
            )
            if res and res.text:
                questions = _parse_llm_json_response(res.text, count, job_title)
                if questions:
                    logger.info(f"Successfully generated {len(questions)} dynamic aptitude questions via Gemini ({settings.gemini_model}) for {job_title}.")
                    return questions
        except Exception as gemini_err:
            logger.warning(f"Gemini aptitude question generation failed for {job_title}: {gemini_err}. Trying Ollama failover.")

    # 2. Failover Provider: Ollama
    ollama_questions = await _generate_with_ollama(prompt, count, job_title)
    if ollama_questions:
        return ollama_questions

    # 3. Final Fallback
    logger.info(f"Using role-tailored fallback question generator for {job_title}.")
    return _fallback_questions(job_title, count)


