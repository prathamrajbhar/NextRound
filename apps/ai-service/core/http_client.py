import httpx
from core.config import settings

class ExpressCallbackClient:
    def __init__(self):
        self.base_url = settings.api_base_url
        self.headers = {
            "X-Internal-Service-Secret": settings.internal_service_secret,
            "Content-Type": "application/json",
        }

    async def _request(self, method: str, endpoint: str, **kwargs) -> httpx.Response:
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
            response = await client.request(method, url, headers=self.headers, **kwargs)
            response.raise_for_status()
            return response

    async def get(self, endpoint: str, **kwargs) -> httpx.Response:
        return await self._request("GET", endpoint, **kwargs)

    async def post_callback(self, endpoint: str, payload: dict) -> dict:
        response = await self._request("POST", endpoint, json=payload)
        return response.json()

    async def post(self, endpoint: str, json: dict) -> httpx.Response:
        return await self._request("POST", endpoint, json=json)

    async def patch(self, endpoint: str, json: dict) -> httpx.Response:
        return await self._request("PATCH", endpoint, json=json)

callback_client = ExpressCallbackClient()
