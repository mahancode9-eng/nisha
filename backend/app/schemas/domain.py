from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class DomainConnect(BaseModel):
    hostname: str = Field(min_length=3, max_length=300)


class DnsRecord(BaseModel):
    type: Literal["TXT", "CNAME", "A"]
    name: str
    value: str


class DomainResponse(BaseModel):
    plan_enabled: bool
    hostname: str | None = None
    # pending: waiting for the TXT record; verified: owned, not pointing at Nisha yet; active: live.
    status: Literal["none", "pending", "verified", "active"] = "none"
    records: list[DnsRecord] = Field(default_factory=list)
    dns_pointing: bool = False
    verified_at: datetime | None = None
    last_checked_at: datetime | None = None
    last_error: str | None = None
    url: str | None = None


class DomainResolveResponse(BaseModel):
    slug: str
    store_id: int
