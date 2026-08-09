"""
Unit tests for Prep Content Worker honesty.

Batch 7b contract:
- The worker reads the job context from the payload's extraData and resolves the
  REAL job title + organization name from internal/jobs/:id/raw.
- It never falls back to fabricated "Tech Corp"/"Software Engineer".
- When the org name or job title is genuinely unavailable the job is skipped.
"""
import pytest
from workers.prep_content_worker import process_prep_job

_LLM_JSON = (
    '{"questions": [{"dimension": "System Architecture", "question": "Q", '
    '"suggestedAnswerKey": "A"}], "cultureNotes": "notes", "skillChecklist": ["git"]}'
)


def _fake_job(title="Backend Engineer", company="Acme Corp", org_id="org-1"):
    return {
        "id": "job-1",
        "title": title,
        "description": "Build reliable APIs.",
        "org_id": org_id,
        "organization": {"name": company},
    }


@pytest.mark.asyncio
async def test_prep_worker_uses_real_job_title_and_org(monkeypatch):
    posted = {}

    async def fake_fetch_internal(endpoint):
        assert endpoint == "internal/jobs/job-1/raw"
        return _fake_job()

    async def fake_post_internal(method, endpoint, payload, *, context):
        posted["payload"] = payload
        return True

    monkeypatch.setattr("workers.prep_content_worker.fetch_internal", fake_fetch_internal)
    monkeypatch.setattr("workers.prep_content_worker.generate_text", lambda prompt: _LLM_JSON)
    monkeypatch.setattr("workers.prep_content_worker.post_internal", fake_post_internal)

    result = await process_prep_job(
        {
            "jobId": "job-1",
            "action": "prep-generate",
            "extraData": {"orgId": "org-1", "jobTitle": "Backend Engineer", "jobDescription": "desc"},
        }
    )
    assert result is True
    # Real values from the job record — never "Tech Corp"/"Software Engineer".
    assert posted["payload"]["companyName"] == "Acme Corp"
    assert posted["payload"]["roleArchetype"] == "Backend Engineer"
    assert posted["payload"]["jobId"] == "job-1"
    assert posted["payload"]["orgId"] == "org-1"


@pytest.mark.asyncio
async def test_prep_worker_resolves_org_from_job_fetch_not_payload(monkeypatch):
    """The job fetch is authoritative: the org name is taken from the real
    organization even when the payload only carries the jobId."""
    posted = {}

    async def fake_fetch_internal(endpoint):
        return _fake_job(company="Globex Ltd")

    async def fake_post_internal(method, endpoint, payload, *, context):
        posted["payload"] = payload
        return True

    monkeypatch.setattr("workers.prep_content_worker.fetch_internal", fake_fetch_internal)
    monkeypatch.setattr("workers.prep_content_worker.generate_text", lambda prompt: _LLM_JSON)
    monkeypatch.setattr("workers.prep_content_worker.post_internal", fake_post_internal)

    result = await process_prep_job({"jobId": "job-1", "extraData": {"orgId": "org-1"}})
    assert result is True
    assert posted["payload"]["companyName"] == "Globex Ltd"
    assert posted["payload"]["roleArchetype"] == "Backend Engineer"


@pytest.mark.asyncio
async def test_prep_worker_skips_when_org_name_unavailable(monkeypatch):
    posted = {}

    async def fake_fetch_internal(endpoint):
        return {"id": "job-1", "title": "Backend Engineer", "org_id": "org-1", "organization": None}

    async def fake_post_internal(method, endpoint, payload, *, context):
        posted["payload"] = payload
        return True

    monkeypatch.setattr("workers.prep_content_worker.fetch_internal", fake_fetch_internal)
    monkeypatch.setattr("workers.prep_content_worker.generate_text", lambda prompt: _LLM_JSON)
    monkeypatch.setattr("workers.prep_content_worker.post_internal", fake_post_internal)

    result = await process_prep_job({"jobId": "job-1", "extraData": {"orgId": "org-1"}})
    assert result is False
    assert posted == {}


@pytest.mark.asyncio
async def test_prep_worker_skips_when_job_fetch_fails(monkeypatch):
    posted = {}

    async def fake_fetch_internal(endpoint):
        raise RuntimeError("job not found")

    async def fake_post_internal(method, endpoint, payload, *, context):
        posted["payload"] = payload
        return True

    monkeypatch.setattr("workers.prep_content_worker.fetch_internal", fake_fetch_internal)
    monkeypatch.setattr("workers.prep_content_worker.generate_text", lambda prompt: _LLM_JSON)
    monkeypatch.setattr("workers.prep_content_worker.post_internal", fake_post_internal)

    result = await process_prep_job({"jobId": "job-1", "extraData": {"orgId": "org-1"}})
    assert result is False
    assert posted == {}


@pytest.mark.asyncio
async def test_prep_worker_requires_job_id(monkeypatch):
    monkeypatch.setattr("workers.prep_content_worker.fetch_internal", lambda e: {})
    result = await process_prep_job({"action": "prep-generate", "extraData": {}})
    assert result is False


@pytest.mark.asyncio
async def test_prep_worker_accepts_flat_legacy_payload_when_fetch_fails(monkeypatch):
    """The legacy flat prep-queue shape (top-level companyName/roleArchetype)
    still works using the real caller-supplied values when the job fetch is
    unavailable — no fabricated defaults are introduced."""
    posted = {}

    async def fake_fetch_internal(endpoint):
        raise RuntimeError("internal endpoint unavailable")

    async def fake_post_internal(method, endpoint, payload, *, context):
        posted["payload"] = payload
        return True

    monkeypatch.setattr("workers.prep_content_worker.fetch_internal", fake_fetch_internal)
    monkeypatch.setattr("workers.prep_content_worker.generate_text", lambda prompt: _LLM_JSON)
    monkeypatch.setattr("workers.prep_content_worker.post_internal", fake_post_internal)

    result = await process_prep_job(
        {
            "companyName": "Initech",
            "roleArchetype": "Senior QA Engineer",
            "jobId": "job-1",
            "orgId": "org-1",
        }
    )
    assert result is True
    assert posted["payload"]["companyName"] == "Initech"
    assert posted["payload"]["roleArchetype"] == "Senior QA Engineer"
    assert posted["payload"]["orgId"] == "org-1"
