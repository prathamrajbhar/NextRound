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
from workers.interview_worker import process_interview_job
from workers.evaluator_worker import process_evaluator_job
from workers.decision_worker import process_decision_job
from workers.mock_worker import process_mock_job
from workers.resume_builder_worker import process_resume_builder_job
from workers.prep_content_worker import process_prep_job
from workers.analytics_worker import process_analytics_job

logger = logging.getLogger("ai_service_workers")


JobHandler = Callable[[dict], Awaitable[bool]]




QUEUE_HANDLERS: Dict[str, JobHandler] = {
    "screening": process_screening_job,
    "interview": process_interview_job,
    "evaluator": process_evaluator_job,
    "decision": process_decision_job,
    "scheduling": process_scheduling_job,
    "assessment": process_aptitude_job,
    "coding": process_coding_job,
    "mock": process_mock_job,
    "prep": process_prep_job,
    "resume-builder": process_resume_builder_job,
    "analytics": process_analytics_job,
}



SOURCING_ACTIONS: Dict[str, JobHandler] = {
    "ai-jd-assist": process_jd_parser_job,
    "sourcing_index": process_sourcing_job,





    "prep-generate": process_prep_job,
}


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

    async def _acknowledge_and_clean_job(self, redis, queue_name: str, job_id: str):
        """Acknowledge a dequeued BullMQ job by cleaning up its Redis tracking keys.
        
        Since the Python service consumes queue items directly from Redis lists, we must
        immediately clear the job hash and state structures. This prevents Node.js BullMQ
        stalled-job checkers from thinking the worker died and re-enqueueing the job.
        """
        job_key = f"bull:{queue_name}:{job_id}"
        try:
            await redis.delete(job_key)
            await redis.lrem(f"bull:{queue_name}:active", 0, job_id)
            await redis.zrem(f"bull:{queue_name}:active", job_id)
            await redis.zrem(f"bull:{queue_name}:stalled", job_id)
        except Exception as err:
            logger.warning(f"Failed to clean up BullMQ metadata keys for job {job_id}: {err}")

    async def poll_queue(self, queue_name: str):
        logger.info(f"Worker listening on BullMQ queue: {queue_name}")
        while self.running:
            try:
                redis = await get_redis_client()
                if not redis:
                    await asyncio.sleep(3)
                    continue


                job_id = await redis.rpop(f"bull:{queue_name}:wait")

                if not job_id:

                    prioritized = await redis.zpopmin(f"bull:{queue_name}:prioritized")
                    if prioritized:
                        job_id = prioritized[0][0]

                if job_id:

                    job_key = f"bull:{queue_name}:{job_id}"
                    job_data_raw = await redis.hget(job_key, "data")


                    await self._acknowledge_and_clean_job(redis, queue_name, job_id)

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
