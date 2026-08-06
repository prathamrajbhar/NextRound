import pytest
from core.config import settings
from core.http_client import ExpressCallbackClient, callback_client

def test_settings_loaded_with_defaults():
    assert settings.port == 8000
    assert settings.express_api_base_url is not None
    assert settings.internal_service_secret is not None

def test_express_http_client_injection_headers():
    client = callback_client
    assert "X-Internal-Service-Secret" in client.headers
    assert client.headers["X-Internal-Service-Secret"] == settings.internal_service_secret
