from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import LLMExtractionStrategy

from app.adapters.base import BaseAdapter
from app.models import CrawledGrant
from app.config import REQUEST_DELAY

import asyncio
import json

GRANT_CONNECT_URL = "https://www.grants.gov.au/search"

EXTRACTION_PROMPT = """Extract all grant programs from this page. For each grant, extract:
- name: The official grant program name
- jurisdiction: One of FEDERAL, WA, NT, QLD, NSW, VIC, SA, TAS, ACT (use FEDERAL if it's a Commonwealth/national program)
- administeringBody: The government department or agency administering the grant
- amount: The funding amount (e.g. "Up to $50,000", "$10,000 - $100,000")
- status: OPEN if accepting applications, CLOSED if deadline passed, MONITORING if future round expected
- deadline: The application deadline as text (e.g. "30 June 2026", "Ongoing", "TBA")
- externalLink: Direct URL to the grant details page
- sourceUrl: The URL this grant was found on
- description: A 2-4 sentence summary of the grant purpose and what it funds
- eligibilityCriteria: Who is eligible to apply (keep concise)
- checklistItems: Array of required documents, each with label and sortOrder (1-indexed)
- processSteps: Array of application steps, each with label and sortOrder (1-indexed)

Return a JSON array of grant objects. If a field is not available, use an empty string for text fields and empty arrays for lists."""


class GrantConnectAdapter(BaseAdapter):
    name = "grant_connect"

    async def crawl(self) -> list[CrawledGrant]:
        config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            extraction_strategy=LLMExtractionStrategy(
                provider="openai/gpt-4o-mini",
                instruction=EXTRACTION_PROMPT,
            ),
        )

        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(url=GRANT_CONNECT_URL, config=config)

            if not result.success or not result.extracted_content:
                return []

            try:
                raw_grants = json.loads(result.extracted_content)
            except json.JSONDecodeError:
                return []

            grants: list[CrawledGrant] = []
            for raw in raw_grants:
                try:
                    grant = CrawledGrant.model_validate(raw)
                    grants.append(grant)
                except Exception:
                    continue  # Skip grants that don't validate

            await asyncio.sleep(REQUEST_DELAY)
            return grants


adapter = GrantConnectAdapter()
