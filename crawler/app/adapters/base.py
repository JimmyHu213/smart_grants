from abc import ABC, abstractmethod

from app.models import CrawledGrant


class BaseAdapter(ABC):
    """Abstract base class for grant source adapters."""

    name: str = "base"

    @abstractmethod
    async def crawl(self) -> list[CrawledGrant]:
        """Crawl the source and return normalised grant data."""
        ...
