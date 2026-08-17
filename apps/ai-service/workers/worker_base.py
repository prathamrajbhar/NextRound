

import logging
from typing import Awaitable, Callable, Dict, Optional

from core.http_client import callback_client

logger = logging.getLogger("worker_base")

WorkFn = Callable[[], Awaitable[Dict]]

class AgentJobSkip(Exception):
    """Raised by a work function to abort a job without recording a failure.

    Use for expected, non-fatal outcomes (e.g. an agent produced no scorecard)
    that currently exit the worker without posting a ``failed`` audit record.
    """

async def fetch_internal(endpoint: str) -> dict:
    """GET a payload from the Express internal API, unwrapping the data envelope.

    Raises on non-2xx so failures are handled by the caller's audit try/except.
    """
    response = await callback_client.get(endpoint)
    payload = response.json()
    return payload.get("data", {}) if isinstance(payload, dict) else {}

async def run_agent_job(
    agent_name: str,
    action: str,
    job_input: dict,
    work: WorkFn,
    *,
    log_extra: Optional[dict] = None,
) -> bool:
    """Run an agent job and record a completed/failed audit record.

    ``work`` performs the actual agent execution and internal result callback and
    returns the audit ``output``. ``log_extra`` carries optional job/org ids for
    the completed record; workers whose ids are only known after a fetch pass a
    dict that ``work`` populates before returning (it is merged after ``work``
    awaits, so the closure always populates it in time).

    Returns True on success and False on failure. A ``failed`` audit record is
    posted best-effort and never re-raises; ``AgentJobSkip`` aborts without one.
    """
    try:
        output = await work()
        audit_payload = {
            "agent_name": agent_name,
            "action": action,
            "input": job_input,
            "output": output,
            "status": "completed",
            **(log_extra or {}),
        }
        await callback_client.post_callback("internal/agent-logs", audit_payload)
        logger.info(f"{agent_name} completed {action}")
        return True
    except AgentJobSkip:
        return False
    except Exception as e:
        logger.error(f"{agent_name} failed {action}: {e}")
        try:
            await callback_client.post_callback(
                "internal/agent-logs",
                {
                    "agent_name": agent_name,
                    "action": action,
                    "status": "failed",
                    "error": str(e),
                },
            )
        except Exception:
            pass
        return False

async def post_internal(method: str, endpoint: str, payload: dict, *, context: str) -> bool:
    """POST/PATCH a payload to the internal API; return True on any 2xx.

    ``method`` must be ``"POST"`` or ``"PATCH"``. Used by workers that post a
    result without an agent audit trail (mock, prep-content, resume-builder).
    """
    try:
        response = await (
            callback_client.post(endpoint, json=payload)
            if method == "POST"
            else callback_client.patch(endpoint, json=payload)
        )
        if response.status_code in (200, 201):
            logger.info(f"Successfully posted {context}")
            return True
        logger.error(f"Failed to post {context}: status {response.status_code}")
        return False
    except Exception as e:
        logger.error(f"Callback error posting {context}: {e}")
        return False
