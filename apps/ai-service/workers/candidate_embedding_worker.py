import logging
from services.embedding_service import embed_text_with_source
from workers.worker_base import fetch_internal, run_agent_job, callback_client

logger = logging.getLogger("candidate_embedding_worker")


async def process_candidate_embedding_job(job_data: dict) -> bool:
    """
    Build and store per-section candidate embeddings (resume, github, linkedin,
    profile) for vector search and AI interviewer context.

    1. Fetch candidate context sections from the Express internal API.
    2. Embed each section (skipping unchanged content hashes).
    3. Callback the new embeddings to the internal API, which upserts rows
       and keeps CandidateProfile.resume_embedding in sync.
    """
    candidate_id = job_data.get("candidateId")
    if not candidate_id:
        logger.error("Missing candidateId in candidate embedding job payload.")
        return False

    logger.info(f"Processing candidate embedding job for candidateId: {candidate_id}")

    async def run() -> dict:
        data = await fetch_internal(f"internal/candidates/{candidate_id}/sections")
        sections = data.get("sections") or []
        existing = data.get("existing") or []

        existing_hashes = {f"{e.get('sourceType')}:{e.get('section')}": e.get("contentHash") for e in existing}

        embeddings = []
        for section in sections:
            source_type = section.get("sourceType")
            name = section.get("section")
            content = section.get("content")
            content_hash = section.get("contentHash")
            if not source_type or not name or not content or not content_hash:
                continue
            if existing_hashes.get(f"{source_type}:{name}") == content_hash:
                logger.info(f"Skipping unchanged section {source_type}/{name}")
                continue

            vector, source = embed_text_with_source(content)
            embeddings.append({
                "sourceType": source_type,
                "section": name,
                "content": content,
                "contentHash": content_hash,
                "embedding": vector,
            })

        if embeddings:
            await callback_client.post_callback(
                f"internal/candidates/{candidate_id}/embeddings",
                {"sections": embeddings},
            )
            logger.info(f"Stored {len(embeddings)} candidate embeddings for {candidate_id}")
        else:
            logger.info(f"No new candidate embeddings to store for {candidate_id}")

        return {
            "candidate_id": candidate_id,
            "sections_seen": len(sections),
            "embeddings_stored": len(embeddings),
        }

    return await run_agent_job(
        agent_name="candidate_embedding_agent",
        action="candidate_embedding_build",
        job_input={"candidate_id": candidate_id},
        work=run,
        log_extra={"org_id": job_data.get("orgId")},
    )