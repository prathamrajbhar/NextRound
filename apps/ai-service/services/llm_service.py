"""Shared LLM plumbing for all agents and workers.

Every agent and worker previously re-initialized its own Google GenAI client,
hardcoded the model string, and duplicated the regex-JSON-extraction code. This
module centralizes the client, the model choice (from settings), and JSON
parsing so that switching models or providers touches exactly one file.

All functions return None when no API key is configured or a model call fails.
Callers treat a None result as a missing AI output: they fail with an explicit
error rather than substituting canned or fabricated content.
"""

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
    """Return a lazily-initialized Google GenAI client, or None if unavailable."""
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
    """Return a lazily-initialized Groq client, or None if unavailable."""
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
    """Generate text using Ollama's configured instance as a fallback."""
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
        return None


def _generate_text_groq(prompt: str) -> Optional[str]:
    """Generate text using Groq API."""
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
        return None


def generate_text(prompt: str, force_provider: Optional[str] = None) -> Optional[str]:
    """Generate a text completion from the configured provider/model.

    Honors settings.llm_provider ("gemini", "groq", or "ollama").
    If the preferred provider fails or is not configured, it propagates the failure
    without any fallback or static retry logic.
    """
    if not prompt:
        return None

    provider = (force_provider or settings.llm_provider).lower()
    
    if provider == "groq":
        return _generate_text_groq(prompt)
        
    elif provider == "gemini":
        client = get_client()
        if not client:
            logger.error("Gemini API key is not configured.")
            return None
        try:
            response = client.models.generate_content(model=settings.gemini_model, contents=prompt)
            text = getattr(response, "text", None)
            return text.strip() if text else None
        except Exception as e:
            logger.error(f"Gemini generate_content failed: {e}")
            raise

    elif provider == "ollama":
        return _generate_text_ollama(prompt)

    return None


def extract_json_object(text: str) -> Optional[dict]:
    """Extract the first JSON object ({...}) from an LLM response using bracket matching.
    
    More efficient than greedy regex for large responses. Matches opening {
    and counts brackets until balance is reached.
    """
    if not text:
        return None
    
    start = text.find('{')
    if start == -1:
        return None
    
    depth = 0
    for i, char in enumerate(text[start:], start):
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                try:
                    data = json.loads(text[start:i+1])
                    return data if isinstance(data, dict) else None
                except (ValueError, TypeError):
                    return None
    return None


def extract_json_array(text: str) -> Optional[List[Any]]:
    """Extract the first JSON array ([...]) from an LLM response using bracket matching.
    
    More efficient than greedy regex for large responses. Matches opening [
    and counts brackets until balance is reached.
    """
    if not text:
        return None
    
    start = text.find('[')
    if start == -1:
        return None
    
    depth = 0
    for i, char in enumerate(text[start:], start):
        if char == '[':
            depth += 1
        elif char == ']':
            depth -= 1
            if depth == 0:
                try:
                    data = json.loads(text[start:i+1])
                    return data if isinstance(data, list) else None
                except (ValueError, TypeError):
                    return None
    return None
