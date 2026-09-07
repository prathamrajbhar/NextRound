import math
import logging
import os

logger = logging.getLogger("embedding_service")

onnx_embedding_model = None
try:
    from fastembed import TextEmbedding

    local_models_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "local_models")
    )
    onnx_embedding_model = TextEmbedding(
        model_name="BAAI/bge-base-en-v1.5",
        cache_dir=local_models_path
    )
    logger.info(f"Successfully initialized ONNX Vector Embedding Engine (BAAI/bge-base-en-v1.5) from {local_models_path}")
except Exception as e:
    logger.warning(f"Failed to initialize FastEmbed ONNX model: {e}")

def embed_text_with_source(text: str) -> tuple[list[float], str]:
    if not text or not text.strip():
        return [0.0] * 768, "empty"

    if not onnx_embedding_model:
        raise RuntimeError(
            "Embedding generation failed: FastEmbed ONNX model "
            "(BAAI/bge-base-en-v1.5) is not initialized."
        )

    try:
        embeddings = list(onnx_embedding_model.embed([text]))
        if embeddings and len(embeddings) > 0:
            vec = [float(x) for x in embeddings[0]]
            if len(vec) == 768:
                return vec, "onnx"
    except Exception as e:
        logger.error(f"FastEmbed ONNX embedding generation failed: {e}")
        raise RuntimeError(f"Embedding generation failed: FastEmbed ONNX model error: {e}")

    raise RuntimeError(
        "Embedding generation failed: FastEmbed ONNX model returned an invalid "
        "or non-768-dimensional embedding vector."
    )

def embed_text(text: str) -> list[float]:
    vec, _ = embed_text_with_source(text)
    return vec

def embed_resume_with_source(resume_text: str, chunk_size: int = 500) -> tuple[list[float], str]:
    if not resume_text or not resume_text.strip():
        return [0.0] * 768, "empty"

    words = resume_text.split()
    if len(words) <= chunk_size:
        return embed_text_with_source(resume_text)

    chunks = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]

    chunk_embeddings = []
    for chunk in chunks:
        if chunk.strip():
            chunk_vec, _ = embed_text_with_source(chunk)
            chunk_embeddings.append(chunk_vec)
    if not chunk_embeddings:
        return [0.0] * 768, "empty"

    avg_vec = [0.0] * 768
    for vec in chunk_embeddings:
        for idx in range(768):
            avg_vec[idx] += vec[idx]

    num_chunks = len(chunk_embeddings)
    avg_vec = [x / num_chunks for x in avg_vec]

    norm = math.sqrt(sum(x * x for x in avg_vec))
    if norm > 0:
        avg_vec = [x / norm for x in avg_vec]

    return avg_vec, "onnx"

def embed_resume(resume_text: str, chunk_size: int = 500) -> list[float]:
    vec, _ = embed_resume_with_source(resume_text, chunk_size)
    return vec

def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0

    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    sim = dot_product / (norm_a * norm_b)

    return max(0.0, min(1.0, (sim + 1.0) / 2.0 if sim < 0 else sim))
