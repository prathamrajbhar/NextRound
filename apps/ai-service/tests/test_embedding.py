"""
Unit tests for Embedding Service (Gemini text-embedding-004 & 768-dim Fallback)
"""
import pytest
from services.embedding_service import embed_text, embed_resume, cosine_similarity, _fallback_768_embedding


def test_embed_text_dimensions():
    """Verify embed_text produces a 768-dimensional float vector."""
    vec = embed_text("Senior Fullstack Engineer with React and Python experience")
    assert isinstance(vec, list)
    assert len(vec) == 768
    assert all(isinstance(val, float) for val in vec)


def test_embed_text_empty():
    """Verify empty or whitespace string returns a zero vector of 768 dimensions."""
    vec = embed_text("")
    assert len(vec) == 768
    assert all(val == 0.0 for val in vec)


def test_fallback_768_embedding_normalized():
    """Verify fallback embedding vector is normalized to unit length or zero vector."""
    vec = _fallback_768_embedding("Machine Learning Engineer PyTorch TensorFlow")
    assert len(vec) == 768
    import math
    norm = math.sqrt(sum(x * x for x in vec))
    assert norm == pytest.approx(1.0, abs=1e-3)


def test_embed_resume_chunking():
    """Verify resume text with > 500 words is chunked and pooled into a single 768-dim vector."""
    long_resume = "word " * 1200
    vec = embed_resume(long_resume)
    assert len(vec) == 768
    assert isinstance(vec, list)


def test_cosine_similarity():
    """Verify cosine similarity computes scores in [0.0, 1.0] range."""
    vec_a = embed_text("Python Backend Engineer PostgreSQL Docker")
    vec_b = embed_text("Python Backend Software Developer Postgres Containers")
    vec_c = embed_text("Pastry Chef Fine Dining Baking")

    sim_ab = cosine_similarity(vec_a, vec_b)
    sim_ac = cosine_similarity(vec_a, vec_c)

    assert 0.0 <= sim_ab <= 1.0
    assert 0.0 <= sim_ac <= 1.0
    assert sim_ab >= sim_ac


def test_onnx_embedding_model_active():
    """Verify ONNX FastEmbed model is loaded and produces non-zero 768-dim embeddings."""
    from services.embedding_service import onnx_embedding_model
    assert onnx_embedding_model is not None, "ONNX FastEmbed model should be initialized"

    vec = embed_text("Deep Learning Engineer PyTorch Computer Vision")
    assert len(vec) == 768
    import math
    norm = math.sqrt(sum(x * x for x in vec))
    assert norm == pytest.approx(1.0, abs=1e-2)


def test_embedding_generate_endpoint():
    """Test POST /api/v1/embeddings/generate returns 768-dim float vector."""
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    res = client.post("/api/v1/embeddings/generate", json={"text": "DevOps Engineer Kubernetes Terraform AWS"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["dimension"] == 768
    assert len(data["data"]["embedding"]) == 768
    assert "latency_ms" in data["data"]


def test_embedding_similarity_endpoint():
    """Test POST /api/v1/embeddings/similarity returns valid similarity score."""
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    res = client.post(
        "/api/v1/embeddings/similarity",
        json={
            "text_a": "React Frontend Developer TypeScript Tailwind",
            "text_b": "Frontend UI Developer Next.js JavaScript",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert 0.0 <= data["data"]["similarity_score"] <= 1.0

