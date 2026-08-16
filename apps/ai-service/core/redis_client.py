import redis.asyncio as redis
from core.config import settings

redis_client: redis.Redis | None = None

async def get_redis_client() -> redis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(
            settings.redis_url,
            protocol=2,
            decode_responses=True,
            socket_timeout=10.0,
            socket_connect_timeout=10.0,
            socket_keepalive=True,
            health_check_interval=15,
            retry_on_timeout=True,
        )
    return redis_client

async def close_redis_client():
    global redis_client
    if redis_client is not None:
        await redis_client.close()
        redis_client = None

