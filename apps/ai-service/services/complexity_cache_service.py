"""Code complexity analysis caching service.

Caches complexity analysis results by code hash to avoid redundant LLM calls
when the same algorithm or solution pattern appears multiple times.

This can reduce LLM calls by 10-100x when there are duplicate submissions
or similar solutions.
"""

import hashlib
import logging
import time
from typing import Dict, Optional, Tuple

logger = logging.getLogger("complexity_cache_service")

# Format: { code_hash: (complexity, source, cached_timestamp) }
_COMPLEXITY_CACHE: Dict[str, Tuple[Optional[str], Optional[str], float]] = {}
CACHE_TTL_SECONDS = 86400  # 24 hours


def _hash_code(code: str) -> str:
    """Generate a SHA256 hash of the code string (first 16 chars)."""
    return hashlib.sha256(code.encode()).hexdigest()[:16]


def get_cached_complexity(code: str) -> Optional[Tuple[Optional[str], Optional[str]]]:
    """
    Retrieve cached complexity analysis for code.
    Returns (complexity, source) or None if not cached or expired.
    source is "llm", "heuristic", or None.
    """
    code_hash = _hash_code(code)
    
    if code_hash not in _COMPLEXITY_CACHE:
        return None
    
    complexity, source, cached_at = _COMPLEXITY_CACHE[code_hash]
    
    # Check if cache entry has expired
    if time.time() - cached_at > CACHE_TTL_SECONDS:
        logger.debug(f"Complexity cache for {code_hash} expired (TTL {CACHE_TTL_SECONDS}s)")
        del _COMPLEXITY_CACHE[code_hash]
        return None
    
    logger.debug(f"Complexity cache hit for {code_hash} ({complexity})")
    return complexity, source


def set_cached_complexity(
    code: str,
    complexity: Optional[str],
    source: Optional[str]
) -> None:
    """
    Cache complexity analysis result for a code snippet.
    source should be "llm", "heuristic", or None.
    """
    code_hash = _hash_code(code)
    _COMPLEXITY_CACHE[code_hash] = (complexity, source, time.time())
    logger.debug(f"Cached complexity for {code_hash} ({complexity}, {source})")


def clear_all_cache() -> None:
    """Clear all cached complexity data (for testing or graceful shutdown)."""
    global _COMPLEXITY_CACHE
    count = len(_COMPLEXITY_CACHE)
    _COMPLEXITY_CACHE.clear()
    logger.info(f"Cleared complexity cache ({count} entries)")


def get_cache_stats() -> Dict[str, int]:
    """Return cache statistics for monitoring."""
    now = time.time()
    expired_count = 0
    for code_hash, (_, _, cached_at) in _COMPLEXITY_CACHE.items():
        if now - cached_at > CACHE_TTL_SECONDS:
            expired_count += 1
    
    return {
        "total_entries": len(_COMPLEXITY_CACHE),
        "expired_entries": expired_count,
        "cache_ttl_seconds": CACHE_TTL_SECONDS,
    }
