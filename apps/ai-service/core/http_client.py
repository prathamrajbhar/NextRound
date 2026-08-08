import httpx
from core.config import settings

class ExpressCallbackClient:
    def __init__(self):
        self.base_url = settings.express_api_base_url
        self.headers = {
            "X-Internal-Service-Secret": settings.internal_service_secret,
            "Content-Type": "application/json",
        }

    async def post_callback(self, endpoint: str, payload: dict) -> dict:
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()

callback_client = ExpressCallbackClient()
