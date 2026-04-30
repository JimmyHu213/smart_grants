import pytest
from app.models import CrawledGrant, CrawlRequest, CrawlResponse


def test_crawled_grant_valid():
    grant = CrawledGrant(
        name="Test Grant",
        jurisdiction="FEDERAL",
        administeringBody="Test Body",
        amount="Up to $50,000",
        sourceUrl="https://example.gov.au/grant",
        description="A test grant.",
    )
    assert grant.name == "Test Grant"
    assert grant.source_url == "https://example.gov.au/grant"


def test_crawled_grant_with_items():
    grant = CrawledGrant(
        name="Test Grant",
        jurisdiction="QLD",
        administeringBody="Dept",
        amount="$10,000",
        sourceUrl="https://example.com",
        description="Desc",
        checklistItems=[{"label": "Plan", "sortOrder": 1}],
        processSteps=[{"label": "Apply", "sortOrder": 1}],
    )
    assert len(grant.checklist_items) == 1
    assert grant.checklist_items[0].label == "Plan"
    assert len(grant.process_steps) == 1


def test_crawled_grant_rejects_empty_name():
    with pytest.raises(Exception):
        CrawledGrant(
            name="",
            jurisdiction="FEDERAL",
            administeringBody="Body",
            amount="$5,000",
            sourceUrl="https://example.com",
            description="Desc",
        )


def test_crawl_request_requires_sources():
    with pytest.raises(Exception):
        CrawlRequest(sources=[])


def test_crawl_response_serialises():
    response = CrawlResponse(
        grants=[
            CrawledGrant(
                name="Grant A",
                jurisdiction="WA",
                administeringBody="Dept A",
                amount="$20,000",
                sourceUrl="https://example.com/a",
                description="Description A",
            )
        ],
        errors=["nt_gov: timeout"],
    )
    data = response.model_dump(by_alias=True)
    assert len(data["grants"]) == 1
    assert data["grants"][0]["administeringBody"] == "Dept A"
    assert data["grants"][0]["sourceUrl"] == "https://example.com/a"
    assert data["errors"] == ["nt_gov: timeout"]
