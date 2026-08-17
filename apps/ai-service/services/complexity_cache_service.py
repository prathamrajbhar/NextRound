
import hashlib
import logging
import time
from typing import Dict, Optional, Tuple

logger = logging.getLogger("complexity_cache_service")

_COMPLEXITY_CACHE: Dict[str, Tuple[Optional[str], Optional[str], float]] = {}
CACHE_TTL_SECONDS = 86400

def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()[:16]

def get_cached_complexity(code: str) -> Optional[Tuple[Optional[str], Optional[str]]]:
    code_hash = _hash_code(code)

    if code_hash not in _COMPLEXITY_CACHE:
        return None

    complexity, source, cached_at = _COMPLEXITY_CACHE[code_hash]

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
    code_hash = _hash_code(code)
    _COMPLEXITY_CACHE[code_hash] = (complexity, source, time.time())
    logger.debug(f"Cached complexity for {code_hash} ({complexity}, {source})")

def clear_all_cache() -> None:
    global _COMPLEXITY_CACHE
    count = len(_COMPLEXITY_CACHE)
    _COMPLEXITY_CACHE.clear()
    logger.info(f"Cleared complexity cache ({count} entries)")

def get_cache_stats() -> Dict[str, int]:
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
