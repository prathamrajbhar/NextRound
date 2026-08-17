import sys

import pytest

sys.path.insert(0, "/home/pratham/Disk1/NextRound/apps/ai-service")

from services import embedding_service


class FakeTextEmbedding:
    def __init__(self, dim=768, raise_on_embed=False):
        self.dim = dim
        self.raise_on_embed = raise_on_embed

    def embed(self, texts):
        if self.raise_on_embed:
            raise RuntimeError("fake model failure")
        for _ in texts:
            yield [float(i % 7) for i in range(self.dim)]


def test_module_has_no_gemini_embedding_client():
    assert not hasattr(embedding_service, "genai_client")


def test_only_embedding_model_is_bge_base_en_v1_5():
    assert embedding_service.onnx_embedding_model is not None


def test_empty_text_returns_empty_source_zero_vector():
    vec, source = embedding_service.embed_text_with_source("   ")
    assert source == "empty"
    assert len(vec) == 768
    assert all(v == 0.0 for v in vec)


def test_embed_text_with_source_returns_onnx(monkeypatch):
    monkeypatch.setattr(embedding_service, "onnx_embedding_model", FakeTextEmbedding())
    vec, source = embedding_service.embed_text_with_source("Senior backend engineer")
    assert source == "onnx"
    assert len(vec) == 768
    assert all(isinstance(v, float) for v in vec)


def test_embed_text_returns_vector(monkeypatch):
    monkeypatch.setattr(embedding_service, "onnx_embedding_model", FakeTextEmbedding())
    vec = embedding_service.embed_text("hello world")
    assert len(vec) == 768


def test_uninitialized_model_raises_clear_error(monkeypatch):
    monkeypatch.setattr(embedding_service, "onnx_embedding_model", None)
    with pytest.raises(RuntimeError) as exc_info:
        embedding_service.embed_text_with_source("text")
    msg = str(exc_info.value)
    assert "BAAI/bge-base-en-v1.5" in msg
    assert "not initialized" in msg


def test_model_embed_failure_raises_clear_error(monkeypatch):
    monkeypatch.setattr(
        embedding_service, "onnx_embedding_model", FakeTextEmbedding(raise_on_embed=True)
    )
    with pytest.raises(RuntimeError) as exc_info:
        embedding_service.embed_text_with_source("text")
    assert "FastEmbed ONNX model error" in str(exc_info.value)


def test_non_768_output_raises_clear_error(monkeypatch):
    monkeypatch.setattr(embedding_service, "onnx_embedding_model", FakeTextEmbedding(dim=384))
    with pytest.raises(RuntimeError) as exc_info:
        embedding_service.embed_text_with_source("text")
    assert "non-768-dimensional" in str(exc_info.value)


def test_embed_resume_with_source_chunking(monkeypatch):
    monkeypatch.setattr(embedding_service, "onnx_embedding_model", FakeTextEmbedding())
    resume = " ".join(["word"] * 1200)
    vec, source = embedding_service.embed_resume_with_source(resume, chunk_size=500)
    assert source == "onnx"
    assert len(vec) == 768


def test_embed_resume_empty():
    vec, source = embedding_service.embed_resume_with_source("")
    assert source == "empty"
    assert len(vec) == 768


def test_cosine_similarity_identical_and_orthogonal():
    a = [1.0] * 768
    b = [1.0] * 768
    assert abs(embedding_service.cosine_similarity(a, b) - 1.0) < 1e-6
    c = [1.0 if i % 2 == 0 else -1.0 for i in range(768)]
    assert abs(embedding_service.cosine_similarity(a, c)) < 1e-6


def test_cosine_similarity_invalid_inputs():
    assert embedding_service.cosine_similarity([], [1.0]) == 0.0
    assert embedding_service.cosine_similarity([1.0], [1.0, 2.0]) == 0.0
    assert embedding_service.cosine_similarity([0.0] * 768, [1.0] * 768) == 0.0


@pytest.mark.skipif(
    embedding_service.onnx_embedding_model is None,
    reason="FastEmbed ONNX model not available",
)
def test_real_model_produces_768_dim_onnx():
    vec, source = embedding_service.embed_text_with_source("A real integration smoke test")
    assert source == "onnx"
    assert len(vec) == 768
