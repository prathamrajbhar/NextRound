import math
import logging
from core.config import settings

logger = logging.getLogger("embedding_service")

# Try initializing Google GenAI Client
genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize Google GenAI Client: {e}")


def _fallback_768_embedding(text: str) -> list[float]:
    """
    Generate a deterministic, normalized 768-dimensional embedding vector
    for fallback scenarios when Gemini API key is missing or unreachable.
    """
    vec = [0.0] * 768
    if not text:
        return vec

    # Hash tokens into 768 buckets
    words = text.lower().split()
    for idx, word in enumerate(words):
        for char_idx, char in enumerate(word):
            bucket = (ord(char) * 31 + idx * 7 + char_idx * 13) % 768
            vec[bucket] += math.sin(ord(char) + idx)

    # Normalize vector to unit length
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec


# ML_BYPASS: self-hosted embeddings — upgrade to sentence-transformers/all-MiniLM-L6-v2 when API offline required
def embed_text(text: str) -> list[float]:
    """
    Generate 768-dimensional vector embedding for input text using
    Gemini text-embedding-004 model, falling back to deterministic vector if unavailable.
    """
    if not text or not text.strip():
        return [0.0] * 768

    if genai_client:
        try:
            response = genai_client.models.embed_content(
                model="text-embedding-004",
                contents=text,
            )
            if response and hasattr(response, 'embedding') and response.embedding:
                embedding = response.embedding.values
                if len(embedding) == 768:
                    return list(embedding)
        except Exception as e:
            logger.error(f"Gemini embed_content API call failed: {e}. Falling back to deterministic vector.")

    return _fallback_768_embedding(text)


def embed_resume(resume_text: str, chunk_size: int = 500) -> list[float]:
    """
    Chunk resume text into ~500 word segments, embed each segment,
    and average pool into a single 768-dimensional float vector.
    """
    if not resume_text or not resume_text.strip():
        return [0.0] * 768

    words = resume_text.split()
    if len(words) <= chunk_size:
        return embed_text(resume_text)

    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)

    chunk_embeddings = [embed_text(chunk) for chunk in chunks if chunk.strip()]
    if not chunk_embeddings:
        return [0.0] * 768

    # Average pooling across all chunks
    avg_vec = [0.0] * 768
    for vec in chunk_embeddings:
        for idx in range(768):
            avg_vec[idx] += vec[idx]

    num_chunks = len(chunk_embeddings)
    avg_vec = [x / num_chunks for x in avg_vec]

    # Re-normalize
    norm = math.sqrt(sum(x * x for x in avg_vec))
    if norm > 0:
        avg_vec = [x / norm for x in avg_vec]

    return avg_vec


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """
    Compute cosine similarity score (0.0 to 1.0) between two 768-dim float vectors.
    """
    if not a or not b or len(a) != len(b):
        return 0.0

    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    sim = dot_product / (norm_a * norm_b)
    # Clamp to [0, 1]
    return max(0.0, min(1.0, (sim + 1.0) / 2.0 if sim < 0 else sim))
