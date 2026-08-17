
import logging
from typing import Awaitable, Callable, Dict, Optional

from core.http_client import callback_client

logger = logging.getLogger("worker_base")

WorkFn = Callable[[], Awaitable[Dict]]

class AgentJobSkip(Exception):

async def fetch_internal(endpoint: str) -> dict:
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
