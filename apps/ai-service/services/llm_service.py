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
import re
from typing import Any, List, Optional

from core.config import settings

logger = logging.getLogger("llm_service")

_client: Optional[Any] = None
_client_initialized = False


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


def generate_text(prompt: str) -> Optional[str]:
    """Generate a text completion from the configured model.

    First tries Gemini. If Gemini is not configured or fails, immediately
    switches to Ollama without retries or static fallback logic.
    """
    if not prompt:
        return None

    client = get_client()
    if client:
        try:
            response = client.models.generate_content(model=settings.gemini_model, contents=prompt)
            text = getattr(response, "text", None)
            if text and text.strip():
                return text.strip()
        except Exception as e:
            logger.error(f"Gemini generate_content failed: {e}")

    # Fallback directly to Ollama
    return _generate_text_ollama(prompt)


def extract_json_object(text: str) -> Optional[dict]:
    """Extract the first JSON object ({...}) from an LLM response, or None."""
    if not text:
        return None
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
        return data if isinstance(data, dict) else None
    except (ValueError, TypeError):
        return None


def extract_json_array(text: str) -> Optional[List[Any]]:
    """Extract the first JSON array ([...]) from an LLM response, or None."""
    if not text:
        return None
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
        return data if isinstance(data, list) else None
    except (ValueError, TypeError):
        return None
