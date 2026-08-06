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
