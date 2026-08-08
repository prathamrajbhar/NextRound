import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from core.config import settings
from core.redis_client import get_redis_client, close_redis_client
from workers.agent_workers import worker_manager
from routes.voice_routes import voice_router, mock_voice_router
from routes.prep_routes import prep_router
from routes.analytics_routes import analytics_router
from routes.embedding_routes import embedding_router
from routes.coding_routes import coding_router
from routes.sourcing_routes import sourcing_router
from routes.video_routes import video_analysis_router
from routes.assessment_routes import assessment_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nextround-ai-service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting NextRound AI Service on port {settings.port}...")
    await get_redis_client()
    await worker_manager.start_workers()
    yield
    logger.info("Shutting down NextRound AI Service...")
    await worker_manager.stop_workers()
    await close_redis_client()

app = FastAPI(
    title="NextRound AI Service",
    description="FastAPI & LangGraph AI Service for NextRound / HireOS",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(voice_router)
app.include_router(mock_voice_router)
app.include_router(prep_router)
app.include_router(analytics_router)
app.include_router(embedding_router)
app.include_router(coding_router)
app.include_router(sourcing_router)
app.include_router(video_analysis_router)
app.include_router(assessment_router)





@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "@nextround/ai-service",
        "environment": settings.environment,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
