import time
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.embedding_service import (
    embed_text_with_source,
    embed_resume_with_source,
    cosine_similarity,
)

logger = logging.getLogger("embedding_routes")

embedding_router = APIRouter(prefix="/api/v1/embeddings", tags=["embeddings"])

# Exact engine label per source so callers can detect hash fallbacks and never
# treat them as a real semantic embedding.
SOURCE_MODEL_LABELS = {
    "onnx": "BAAI/bge-base-en-v1.5 (ONNX)",
    "gemini": "Gemini text-embedding-004",
    "hash-fallback": "Fallback-768 hash",
    "empty": "Fallback-768 hash",
}


class EmbeddingRequest(BaseModel):
    text: str = Field(..., description="Text string to generate 768-dimensional vector embedding for")
    type: Optional[str] = Field("text", description="Embedding type: 'text' or 'resume'")


class SimilarityRequest(BaseModel):
    text_a: str = Field(..., description="First text string")
    text_b: str = Field(..., description="Second text string")


@embedding_router.post("/generate")
async def generate_embedding(req: EmbeddingRequest):
    """
    Generate 768-dimensional vector embedding for input text using self-hosted ONNX model.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text field cannot be empty")

    start_time = time.perf_counter()
    if req.type == "resume":
        vec, source = embed_resume_with_source(req.text)
    else:
        vec, source = embed_text_with_source(req.text)
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    model_name = SOURCE_MODEL_LABELS.get(source, "Fallback-768 hash")

    return {
        "success": True,
        "data": {
            "embedding": vec,
            "dimension": len(vec),
            "model": model_name,
            "latency_ms": elapsed_ms,
        },
    }


@embedding_router.post("/similarity")
async def compute_similarity(req: SimilarityRequest):
    """
    Compute cosine similarity score (0.0 to 1.0) between two text strings using 768-dim embeddings.
    """
    start_time = time.perf_counter()
    vec_a, src_a = embed_text_with_source(req.text_a)
    vec_b, src_b = embed_text_with_source(req.text_b)
    score = cosine_similarity(vec_a, vec_b)
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # The score is only semantically meaningful if neither side is a fallback.
    sources = {src_a, src_b}
    source = "hash-fallback" if ("hash-fallback" in sources or "empty" in sources) else (
        "onnx" if "onnx" in sources else "gemini"
    )
    model_name = SOURCE_MODEL_LABELS.get(source, "Fallback-768 hash")

    return {
        "success": True,
        "data": {
            "similarity_score": round(score, 4),
            "model": model_name,
            "latency_ms": elapsed_ms,
        },
    }
