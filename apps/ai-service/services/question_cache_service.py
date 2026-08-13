








import logging
import time
from typing import Dict, List, Optional, Any, Tuple

logger = logging.getLogger("question_cache_service")


_ASSESSMENT_CACHE: Dict[str, Tuple[List[dict], Optional[float], float]] = {}
CACHE_TTL_SECONDS = 3600


def get_cached_assessment_data(
    application_id: str
) -> Optional[Tuple[List[dict], Optional[float]]]:
    """
    Retrieve cached assessment questions and threshold for an application.
    Returns (questions, min_score) or None if not cached or expired.
    """
    if application_id not in _ASSESSMENT_CACHE:
        return None
    
    questions, min_score, cached_at = _ASSESSMENT_CACHE[application_id]
    

    if time.time() - cached_at > CACHE_TTL_SECONDS:
        logger.debug(f"Assessment cache for {application_id} expired (TTL {CACHE_TTL_SECONDS}s)")
        del _ASSESSMENT_CACHE[application_id]
        return None
    
    logger.debug(f"Assessment cache hit for {application_id} ({len(questions)} questions)")
    return questions, min_score


def set_cached_assessment_data(
    application_id: str,
    questions: List[dict],
    min_score: Optional[float]
) -> None:
    """Cache assessment questions and threshold for an application."""
    _ASSESSMENT_CACHE[application_id] = (questions, min_score, time.time())
    logger.debug(f"Cached assessment data for {application_id} ({len(questions)} questions)")


def invalidate_cache(application_id: str) -> None:
    """Explicitly invalidate cache for an application (e.g., after assessment update)."""
    if application_id in _ASSESSMENT_CACHE:
        del _ASSESSMENT_CACHE[application_id]
        logger.debug(f"Invalidated assessment cache for {application_id}")


def clear_all_cache() -> None:
    """Clear all cached assessment data (for testing or graceful shutdown)."""
    global _ASSESSMENT_CACHE
    count = len(_ASSESSMENT_CACHE)
    _ASSESSMENT_CACHE.clear()
    logger.info(f"Cleared assessment cache ({count} entries)")


def get_cache_stats() -> Dict[str, Any]:
    """Return cache statistics for monitoring."""
    now = time.time()
    expired_count = 0
    for app_id, (_, _, cached_at) in _ASSESSMENT_CACHE.items():
        if now - cached_at > CACHE_TTL_SECONDS:
            expired_count += 1
    
    return {
        "total_entries": len(_ASSESSMENT_CACHE),
        "expired_entries": expired_count,
        "cache_ttl_seconds": CACHE_TTL_SECONDS,
    }
