import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.config import API_KEY


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.anyio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_crawl_rejects_missing_api_key(client: AsyncClient):
    response = await client.post("/crawl", json={"sources": ["grant_connect"]})
    assert response.status_code == 422  # Missing required header


@pytest.mark.anyio
async def test_crawl_rejects_invalid_api_key(client: AsyncClient):
    response = await client.post(
        "/crawl",
        json={"sources": ["grant_connect"]},
        headers={"x-api-key": "wrong-key"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_crawl_rejects_unknown_source(client: AsyncClient):
    response = await client.post(
        "/crawl",
        json={"sources": ["nonexistent_source"]},
        headers={"x-api-key": API_KEY},
    )
    data = response.json()
    assert response.status_code == 200
    assert len(data["errors"]) == 1
    assert "nonexistent_source" in data["errors"][0]
