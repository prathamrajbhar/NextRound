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

SOURCE_MODEL_LABELS = {
    "onnx": "BAAI/bge-base-en-v1.5 (ONNX)",
    "empty": "Empty input (zero vector)",
}

class EmbeddingRequest(BaseModel):
    text: str = Field(..., description="Text string to generate 768-dimensional vector embedding for")
    type: Optional[str] = Field("text", description="Embedding type: 'text' or 'resume'")

class SimilarityRequest(BaseModel):
    text_a: str = Field(..., description="First text string")
    text_b: str = Field(..., description="Second text string")

@embedding_router.post("/generate")
async def generate_embedding(req: EmbeddingRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text field cannot be empty")

    start_time = time.perf_counter()
    if req.type == "resume":
        vec, source = embed_resume_with_source(req.text)
    else:
        vec, source = embed_text_with_source(req.text)
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    model_name = SOURCE_MODEL_LABELS.get(source, "Unknown")

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
    start_time = time.perf_counter()
    vec_a, src_a = embed_text_with_source(req.text_a)
    vec_b, src_b = embed_text_with_source(req.text_b)
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    semantic = {"onnx"}
    if src_a in semantic and src_b in semantic:
        score = cosine_similarity(vec_a, vec_b)
        model_name = SOURCE_MODEL_LABELS.get("onnx")
    else:
        score = None
        model_name = None

    return {
        "success": True,
        "data": {
            "similarity_score": round(score, 4) if score is not None else None,
            "model": model_name,
            "latency_ms": elapsed_ms,
        },
    }
