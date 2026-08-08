import asyncio
import json
import logging
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

AGENT_QUEUES = [
    "sourcing",
    "screening",
    "interview",
    "evaluator",
    "decision",

    "offer",
    "mock",
    "prep",
    "resume-builder",
    "scheduling",
    "assessment",
    "coding",
    "video-screening",
    "analytics",
]


class AgentWorkerManager:
    def __init__(self):
        self.running = False
        self.tasks = []

    async def start_workers(self):
        self.running = True
        logger.info("Initializing background AI agent queue workers...")
        for queue_name in ["sourcing", "screening", "scheduling", "assessment", "coding", "video-screening", "interview", "evaluator", "decision", "mock", "prep", "resume-builder", "analytics"]:
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

                        if queue_name == "sourcing":
                            action = payload.get("action")
                            if action == "ai-jd-assist":
                                await process_jd_parser_job(payload)
                            else:
                                await process_sourcing_job(payload)
                        elif queue_name == "screening":
                            await process_screening_job(payload)
                        elif queue_name == "scheduling":
                            await process_scheduling_job(payload)
                        elif queue_name == "assessment":
                            await process_aptitude_job(payload)
                        elif queue_name == "coding":
                            await process_coding_job(payload)
                        elif queue_name == "video-screening":
                            await process_video_screening_job(payload)
                        elif queue_name == "interview":
                            await process_interview_job(payload)
                        elif queue_name == "evaluator":
                            await process_evaluator_job(payload)
                        elif queue_name == "decision":
                            await process_decision_job(payload)
                        elif queue_name == "mock":
                            await process_mock_job(payload)
                        elif queue_name == "resume-builder":
                            await process_resume_builder_job(payload)
                        elif queue_name == "prep":
                            await process_prep_job(payload)
                        elif queue_name == "analytics":
                            await process_analytics_job(payload)
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
