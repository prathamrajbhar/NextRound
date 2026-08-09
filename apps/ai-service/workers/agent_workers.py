import asyncio
import json
import logging
from typing import Awaitable, Callable, Dict, Optional

from core.redis_client import get_redis_client
from workers.jd_parser_worker import process_jd_parser_job
from workers.sourcing_worker import process_sourcing_job
from workers.screening_worker import process_screening_job
from workers.scheduling_worker import process_scheduling_job
from workers.aptitude_worker import process_aptitude_job
from workers.coding_worker import process_coding_job
from workers.video_screening_worker import process_video_screening_job
from workers.interview_worker import process_interview_job
from workers.evaluator_worker import process_evaluator_job
from workers.decision_worker import process_decision_job
from workers.mock_worker import process_mock_job
from workers.resume_builder_worker import process_resume_builder_job
from workers.prep_content_worker import process_prep_job
from workers.analytics_worker import process_analytics_job

logger = logging.getLogger("ai_service_workers")

# A job handler receives the raw BullMQ payload and returns True/False.
JobHandler = Callable[[dict], Awaitable[bool]]

# Queue name -> job handler (listed in hiring-pipeline order). Every queue in
# AGENT_QUEUES must be present here (except "sourcing", which multiplexes several
# actions; see SOURCING_ACTIONS).
QUEUE_HANDLERS: Dict[str, JobHandler] = {
    "screening": process_screening_job,
    "interview": process_interview_job,
    "evaluator": process_evaluator_job,
    "decision": process_decision_job,
    "scheduling": process_scheduling_job,
    "assessment": process_aptitude_job,
    "coding": process_coding_job,
    "video-screening": process_video_screening_job,
    "mock": process_mock_job,
    "prep": process_prep_job,
    "resume-builder": process_resume_builder_job,
    "analytics": process_analytics_job,
}

# The sourcing queue carries three different job types distinguished by the
# payload's "action" field.
SOURCING_ACTIONS: Dict[str, JobHandler] = {
    "ai-jd-assist": process_jd_parser_job,
    "sourcing_index": process_sourcing_job,
    # The Express prep route enqueues prep generation here with action
    # "prep-generate" (not on the "prep" queue). NOTE: that payload carries
    # jobTitle/jobDescription instead of companyName/roleArchetype, so generated
    # content is generic until the two sides are aligned.
    "prep-generate": process_prep_job,
}

# Queues the worker manager polls. The Express API defines two additional queues
# without an AI worker — "offer" (offer letters are drafted by the decision
# agent) and "bias-audit" (bias auditing runs inside the evaluator/decision
# agents) — so they are intentionally excluded here.
AGENT_QUEUES = list(QUEUE_HANDLERS) + ["sourcing"]


def _dispatch(queue_name: str, payload: dict) -> Optional[JobHandler]:
    """Resolve the handler for a dequeued job, or None if none is registered."""
    if queue_name == "sourcing":
        return SOURCING_ACTIONS.get(payload.get("action"), process_sourcing_job)
    return QUEUE_HANDLERS.get(queue_name)


class AgentWorkerManager:
    def __init__(self):
        self.running = False
        self.tasks = []

    async def start_workers(self):
        self.running = True
        logger.info("Initializing background AI agent queue workers...")
        for queue_name in AGENT_QUEUES:
            task = asyncio.create_task(self.poll_queue(queue_name))
            self.tasks.append(task)

    async def poll_queue(self, queue_name: str):
        logger.info(f"Worker listening on BullMQ queue: {queue_name}")
        while self.running:
            try:
                redis = await get_redis_client()
                if not redis:
                    await asyncio.sleep(3)
                    continue

                # Poll BullMQ wait list or custom job queue
                # BullMQ queue list key: bull:<queue_name>:wait
                job_id = await redis.rpop(f"bull:{queue_name}:wait")

                if not job_id:
                    # BullMQ stores priority jobs in a ZSET (bull:<queue>:prioritized)
                    # instead of the wait list. Dequeue them too so priority enqueues
                    # (evaluator, decision) are never silently stalled.
                    prioritized = await redis.zpopmin(f"bull:{queue_name}:prioritized")
                    if prioritized:
                        job_id = prioritized[0][0]

                if job_id:
                    # Fetch BullMQ job hash data
                    job_key = f"bull:{queue_name}:{job_id}"
                    job_data_raw = await redis.hget(job_key, "data")

                    if job_data_raw:
                        payload = json.loads(job_data_raw)
                        logger.info(f"Dequeued job {job_id} from {queue_name} with action: {payload.get('action')}")

                        handler = _dispatch(queue_name, payload)
                        if handler is None:
                            logger.warning(f"No handler registered for queue '{queue_name}'; skipping job {job_id}.")
                        else:
                            await handler(payload)
                else:
                    await asyncio.sleep(2)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in BullMQ worker loop for queue {queue_name}: {e}")
                await asyncio.sleep(3)

    async def stop_workers(self):
        self.running = False
        for task in self.tasks:
            task.cancel()
        await asyncio.gather(*self.tasks, return_exceptions=True)
        logger.info("Background AI agent queue workers stopped.")


worker_manager = AgentWorkerManager()
