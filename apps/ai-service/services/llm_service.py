"""Shared LLM plumbing for all agents and workers.

Every agent and worker previously re-initialized its own Google GenAI client,
hardcoded the model string, and duplicated the regex-JSON-extraction code. This
module centralizes the client, the model choice (from settings), and JSON
parsing so that switching models or providers touches exactly one file.

All functions degrade gracefully: when no API key is configured or a model call
fails they return None instead of raising, so downstream agents can keep their
deterministic fallbacks.
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


def generate_text(prompt: str) -> Optional[str]:
    """Generate a text completion from the configured model.

    Returns the trimmed response text, or None when the client is unavailable,
    the call fails, or the response is empty. Never raises.
    """
    client = get_client()
    if not client or not prompt:
        return None
    try:
        response = client.models.generate_content(model=settings.gemini_model, contents=prompt)
        text = getattr(response, "text", None)
        return text.strip() if text else None
    except Exception as e:
        logger.error(f"Gemini generate_content failed: {e}")
        return None


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
