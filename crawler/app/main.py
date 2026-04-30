import asyncio
import importlib
import traceback

from fastapi import FastAPI, Header, HTTPException

from app.config import API_KEY, CRAWL_TIMEOUT
from app.models import CrawlRequest, CrawlResponse, CrawledGrant
from app.adapters.base import BaseAdapter

app = FastAPI(title="Smart Grants Crawler")

ADAPTER_REGISTRY: dict[str, str] = {
    "grant_connect": "app.adapters.grant_connect",
    "business_gov": "app.adapters.business_gov",
}


def get_adapter(source: str) -> BaseAdapter:
    module_path = ADAPTER_REGISTRY.get(source)
    if not module_path:
        raise ValueError(f"Unknown source: {source}")
    module = importlib.import_module(module_path)
    return module.adapter


async def crawl_source(
    source: str,
) -> tuple[list[CrawledGrant], str | None]:
    try:
        adapter = get_adapter(source)
        grants = await asyncio.wait_for(adapter.crawl(), timeout=CRAWL_TIMEOUT)
        return grants, None
    except asyncio.TimeoutError:
        return [], f"{source}: timeout after {CRAWL_TIMEOUT}s"
    except Exception as e:
        return [], f"{source}: {traceback.format_exception_only(type(e), e)[-1].strip()}"


@app.post("/crawl", response_model=CrawlResponse)
async def crawl(request: CrawlRequest, x_api_key: str = Header()):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    all_grants: list[CrawledGrant] = []
    all_errors: list[str] = []

    tasks = [crawl_source(source) for source in request.sources]
    results = await asyncio.gather(*tasks)

    for grants, error in results:
        all_grants.extend(grants)
        if error:
            all_errors.append(error)

    return CrawlResponse(grants=all_grants, errors=all_errors)


@app.get("/health")
async def health():
    return {"status": "ok"}
