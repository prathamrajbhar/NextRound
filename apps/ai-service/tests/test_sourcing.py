import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from services.sourcing_service import (
    fetch_github_profile,
    fetch_linkedin_profile,
    aggregate_external_profile
)


@pytest.mark.asyncio
async def test_fetch_github_profile_success():
    """Verify GitHub profile fetching and repository skill extraction."""
    mock_payload = {
        "profile": {
            "name": "Linus Torvalds",
            "username": "torvalds",
            "bio": "Linux Kernel Maintainer",
            "location": "Portland, OR",
            "followers": "315k",
        },
        "recent_repositories": [
            {"name": "linux", "language": "C", "summary": "Linux Kernel Tree"}
        ],
        "pinned_repositories": []
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload
    mock_resp.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp

        res = await fetch_github_profile("torvalds")
        assert res["success"] is True
        assert res["username"] == "torvalds"
        assert res["name"] == "Linus Torvalds"
        assert "C" in res["extracted_skills"]


@pytest.mark.asyncio
async def test_fetch_linkedin_profile_success():
    """Verify LinkedIn profile fetching and skill extraction."""
    mock_payload = {
        "profile": {
            "name": "Satya Nadella",
            "headline": "Chairman and CEO at Microsoft",
            "about": "Empowering every person and organization",
            "skills": ["Executive Leadership", "Cloud Computing", "AI"]
        },
        "posts": []
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload
    mock_resp.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp

        res = await fetch_linkedin_profile("satyanadella")
        assert res["success"] is True
        assert res["name"] == "Satya Nadella"
        assert "Cloud Computing" in res["extracted_skills"]


@pytest.mark.asyncio
async def test_aggregate_external_profile():
    """Verify profile aggregation and 768-dim vector embedding generation."""
    with patch("services.sourcing_service.fetch_github_profile", new_callable=AsyncMock) as mock_gh, \
         patch("services.sourcing_service.fetch_linkedin_profile", new_callable=AsyncMock) as mock_li, \
         patch("services.sourcing_service.embed_text_with_source", return_value=([0.1] * 768, "onnx")) as mock_embed:

        mock_gh.return_value = {
            "success": True,
            "name": "Linus Torvalds",
            "bio": "Linux Kernel",
            "extracted_skills": ["C", "Assembly"],
            "repositories": [{"name": "linux", "summary": "OS Kernel"}]
        }
        mock_li.return_value = {
            "success": True,
            "name": "Linus Torvalds",
            "headline": "Linux Creator",
            "about": "Open Source Leader",
            "extracted_skills": ["Systems Architecture"]
        }

        agg = await aggregate_external_profile("torvalds", "torvalds", target_role="Systems Engineer")
        assert agg["success"] is True
        c = agg["candidate"]
        assert c["name"] == "Linus Torvalds"
        assert c["embedding_dimensions"] == 768
        assert "C" in c["extracted_skills"]
        assert "Systems Architecture" in c["extracted_skills"]
        # Both embeddings came from a real engine, so a real score is reported
        # (profile + job vectors embedded = 2 calls).
        assert mock_embed.call_count == 2
        assert c["similarity_score"] is not None
        assert 0.0 <= c["similarity_score"] <= 100.0


@pytest.mark.asyncio
async def test_aggregate_external_profile_reports_real_cosine():
    """Verify similarity_score is the REAL cosine percent — the 50 floor is gone."""
    orth_a = [1.0] + [0.0] * 767
    orth_b = [0.0] * 767 + [1.0]
    with patch("services.sourcing_service.fetch_github_profile", new_callable=AsyncMock) as mock_gh, \
         patch("services.sourcing_service.fetch_linkedin_profile", new_callable=AsyncMock) as mock_li, \
         patch(
             "services.sourcing_service.embed_text_with_source",
             side_effect=[(orth_a, "onnx"), (orth_b, "onnx")],
         ):

        mock_gh.return_value = {"success": True, "name": "Linus Torvalds", "bio": "Linux Kernel", "extracted_skills": ["C"]}
        mock_li.return_value = {"success": True, "name": "Linus Torvalds", "headline": "Linux Creator", "extracted_skills": ["Systems Architecture"]}

        agg = await aggregate_external_profile("torvalds", "torvalds", target_role="Systems Engineer")
        # Orthogonal vectors -> cosine 0.0, no artificial floor inflated it.
        assert agg["candidate"]["similarity_score"] == 0.0


@pytest.mark.asyncio
async def test_aggregate_external_profile_hash_fallback_is_none():
    """Verify similarity_score is None when embeddings come from the hash fallback."""
    with patch("services.sourcing_service.fetch_github_profile", new_callable=AsyncMock) as mock_gh, \
         patch("services.sourcing_service.fetch_linkedin_profile", new_callable=AsyncMock) as mock_li, \
         patch(
             "services.sourcing_service.embed_text_with_source",
             return_value=([0.0] * 768, "hash-fallback"),
         ):

        mock_gh.return_value = {"success": True, "name": "Linus Torvalds", "bio": "Linux Kernel", "extracted_skills": ["C"]}
        mock_li.return_value = {"success": True, "name": "Linus Torvalds", "headline": "Linux Creator", "extracted_skills": ["Systems Architecture"]}

        agg = await aggregate_external_profile("torvalds", "torvalds", target_role="Systems Engineer")
        assert agg["candidate"]["similarity_score"] is None


@pytest.mark.asyncio
async def test_aggregate_external_profile_no_job_text_similarity_none():
    """Verify similarity_score is None (no 85 baseline) when no job/target text is given."""
    with patch("services.sourcing_service.fetch_github_profile", new_callable=AsyncMock) as mock_gh, \
         patch("services.sourcing_service.fetch_linkedin_profile", new_callable=AsyncMock) as mock_li, \
         patch("services.sourcing_service.embed_text_with_source", return_value=([0.1] * 768, "onnx")) as mock_embed:

        mock_gh.return_value = {"success": True, "name": "Linus Torvalds", "bio": "Linux Kernel", "extracted_skills": ["C"]}
        mock_li.return_value = {"success": True, "name": "Linus Torvalds", "headline": "Linux Creator", "extracted_skills": ["Systems Architecture"]}

        agg = await aggregate_external_profile("torvalds", "torvalds")
        assert agg["candidate"]["similarity_score"] is None
        # Only the profile vector is embedded; no job vector is produced.
        assert mock_embed.call_count == 1


def test_sourcing_endpoints():
    """Test REST API endpoints for GitHub, LinkedIn, and aggregated profile sourcing."""
    from main import app
    client = TestClient(app)

    with patch("routes.sourcing_routes.fetch_github_profile", new_callable=AsyncMock) as mock_gh, \
         patch("routes.sourcing_routes.fetch_linkedin_profile", new_callable=AsyncMock) as mock_li, \
         patch("routes.sourcing_routes.aggregate_external_profile", new_callable=AsyncMock) as mock_agg:

        mock_gh.return_value = {
            "success": True,
            "username": "torvalds",
            "name": "Linus Torvalds",
            "extracted_skills": ["C"]
        }
        mock_li.return_value = {
            "success": True,
            "username": "satyanadella",
            "name": "Satya Nadella",
            "extracted_skills": ["Leadership"]
        }
        mock_agg.return_value = {
            "success": True,
            "candidate": {
                "name": "Linus Torvalds",
                "extracted_skills": ["C"],
                "similarity_score": 92.5
            }
        }

        # 1. GET GitHub
        gh_resp = client.get("/api/v1/ai/sourcing/github/torvalds")
        assert gh_resp.status_code == 200
        assert gh_resp.json()["name"] == "Linus Torvalds"

        # 2. GET LinkedIn
        li_resp = client.get("/api/v1/ai/sourcing/linkedin/satyanadella")
        assert li_resp.status_code == 200
        assert li_resp.json()["name"] == "Satya Nadella"

        # 3. POST Profile
        prof_resp = client.post(
            "/api/v1/ai/sourcing/profile",
            json={
                "github_id": "torvalds",
                "linkedin_id": "satyanadella",
                "target_role": "Principal Software Engineer"
            }
        )
        assert prof_resp.status_code == 200
        assert prof_resp.json()["success"] is True

