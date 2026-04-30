from pydantic import BaseModel, Field


class ChecklistItem(BaseModel):
    label: str = Field(min_length=1)
    sort_order: int = Field(ge=0, alias="sortOrder")

    model_config = {"populate_by_name": True}


class ProcessStep(BaseModel):
    label: str = Field(min_length=1)
    sort_order: int = Field(ge=0, alias="sortOrder")

    model_config = {"populate_by_name": True}


JURISDICTIONS = {"FEDERAL", "WA", "NT", "QLD", "NSW", "VIC", "SA", "TAS", "ACT"}
GRANT_STATUSES = {"OPEN", "CLOSED", "MONITORING"}


class CrawledGrant(BaseModel):
    name: str = Field(min_length=1, max_length=500)
    jurisdiction: str
    administering_body: str = Field(
        min_length=1, max_length=500, alias="administeringBody"
    )
    amount: str = Field(min_length=1, max_length=200)
    status: str = "OPEN"
    deadline: str = ""
    external_link: str = Field(default="", alias="externalLink")
    source_url: str = Field(min_length=1, max_length=2000, alias="sourceUrl")
    description: str = Field(min_length=1)
    eligibility_criteria: str = Field(default="", alias="eligibilityCriteria")
    checklist_items: list[ChecklistItem] = Field(
        default_factory=list, alias="checklistItems"
    )
    process_steps: list[ProcessStep] = Field(
        default_factory=list, alias="processSteps"
    )

    model_config = {"populate_by_name": True}


class CrawlRequest(BaseModel):
    sources: list[str] = Field(min_length=1)


class CrawlResponse(BaseModel):
    grants: list[CrawledGrant]
    errors: list[str]
