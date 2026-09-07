import json
import logging
from typing import Any, List, Optional

from core.config import settings

logger = logging.getLogger("llm_service")

_client: Optional[Any] = None
_client_initialized = False

_groq_client: Optional[Any] = None
_groq_client_initialized = False

def get_client() -> Optional[Any]:
    global _client, _client_initialized
    if _client_initialized:
        return _client
    _client_initialized = True
    if not settings.gemini_api_key:
        return None
    try:
        from google import genai
        _client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI client: {e}")
        _client = None
    return _client

def get_groq_client() -> Optional[Any]:
    global _groq_client, _groq_client_initialized
    if _groq_client_initialized:
        return _groq_client
    _groq_client_initialized = True
    if not settings.groq_api_key:
        return None
    try:
        from groq import Groq
        _groq_client = Groq(api_key=settings.groq_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize Groq client: {e}")
        _groq_client = None
    return _groq_client

def _generate_text_ollama(prompt: str) -> Optional[str]:
    if not settings.ollama_base_url or not prompt:
        return None
    try:
        import httpx
        url = f"{settings.ollama_base_url.rstrip('/')}/api/generate"
        payload = {
            "model": settings.ollama_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2
            }
        }
        logger.info(f"Attempting Ollama generation using model {settings.ollama_model} at {url}...")
        response = httpx.post(url, json=payload, timeout=60.0)
        response.raise_for_status()
        data = response.json()
        text = data.get("response")
        return text.strip() if text else None
    except Exception as e:
        logger.error(f"Ollama generate_content failed: {e}")
        raise

def _generate_text_groq(prompt: str) -> Optional[str]:
    client = get_groq_client()
    if not client or not prompt:
        return None
    try:
        logger.info(f"Attempting Groq generation using model {settings.groq_model}...")
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=settings.groq_model,
            temperature=0.2,
        )
        text = completion.choices[0].message.content
        return text.strip() if text else None
    except Exception as e:
        logger.error(f"Groq generate_content failed: {e}")
        raise

import time

def generate_text(prompt: str, force_provider: Optional[str] = None) -> Optional[str]:
    if not prompt:
        return None

    provider = (force_provider or settings.llm_provider).lower()
    max_retries = 3
    delay = 2.0

    for attempt in range(max_retries):
        try:
            if provider == "groq":
                return _generate_text_groq(prompt)

            elif provider == "gemini":
                client = get_client()
                if not client:
                    logger.error("Gemini API key is not configured.")
                    return None
                response = client.models.generate_content(model=settings.gemini_model, contents=prompt)
                text = getattr(response, "text", None)
                return text.strip() if text else None

            elif provider == "ollama":
                return _generate_text_ollama(prompt)

        except Exception as e:
            is_rate_limit = False
            err_str = str(e).lower()
            if "429" in err_str or "resource_exhausted" in err_str or "too many requests" in err_str:
                is_rate_limit = True

            if is_rate_limit and attempt < max_retries - 1:
                logger.warning(
                    f"LLM generation rate limited (429). Retrying in {delay}s... (Attempt {attempt + 1}/{max_retries})"
                )
                time.sleep(delay)
                delay *= 2
                continue

            logger.error(f"LLM generation failed: {e}")
            raise e

    return None

def extract_json_object(text: str) -> Optional[dict]:
    if not text:
        return None

    start = text.find('{')
    if start == -1:
        return None

    return _extract_balanced(text, start, '{', '}', dict)

def extract_json_array(text: str) -> Optional[List[Any]]:
    if not text:
        return None

    start = text.find('[')
    if start == -1:
        return None

    return _extract_balanced(text, start, '[', ']', list)

def _extract_balanced(text: str, start: int, open_ch: str, close_ch: str, target_type) -> Optional[Any]:
    depth = 0
    in_string = False
    escaped = False
    for i in range(start, len(text)):
        char = text[i]
        if in_string:
            if escaped:
                escaped = False
            elif char == '\\':
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == open_ch:
            depth += 1
        elif char == close_ch:
            depth -= 1
            if depth == 0:
                try:
                    data = json.loads(text[start:i + 1])
                    return data if isinstance(data, target_type) else None
                except (ValueError, TypeError):
                    return None
    return None
