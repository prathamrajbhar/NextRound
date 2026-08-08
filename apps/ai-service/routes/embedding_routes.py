import time
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.embedding_service import embed_text, embed_resume, cosine_similarity, onnx_embedding_model

logger = logging.getLogger("embedding_routes")

embedding_router = APIRouter(prefix="/api/v1/embeddings", tags=["embeddings"])


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
        vec = embed_resume(req.text)
    else:
        vec = embed_text(req.text)
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    model_name = "BAAI/bge-base-en-v1.5 (ONNX)" if onnx_embedding_model else "Gemini/Fallback-768"

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
    vec_a = embed_text(req.text_a)
    vec_b = embed_text(req.text_b)
    score = cosine_similarity(vec_a, vec_b)
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return {
        "success": True,
        "data": {
            "similarity_score": round(score, 4),
            "model": "BAAI/bge-base-en-v1.5 (ONNX)" if onnx_embedding_model else "Gemini/Fallback-768",
            "latency_ms": elapsed_ms,
        },
    }
