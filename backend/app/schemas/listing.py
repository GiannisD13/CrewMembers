from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.user import CrewRole


# ── JobPosting ───────────────────────────────────────────────────────────────

class JobPostingCreate(BaseModel):
    schedule_id: int
    title: str
    role: CrewRole
    description: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[Decimal] = None


class JobPostingUpdate(BaseModel):
    title: Optional[str] = None
    role: Optional[CrewRole] = None
    description: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[Decimal] = None
    is_active: Optional[bool] = None


class JobPostingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: str
    schedule_id: int
    title: str
    role: CrewRole
    description: Optional[str]
    location: Optional[str]
    salary: Optional[Decimal]
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ── JobPostingMedia ──────────────────────────────────────────────────────────

class JobPostingMediaCreate(BaseModel):
    url: str
    order: int = 0


class JobPostingMediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    jobposting_id: int
    url: str
    order: int


# ── CrewListing ──────────────────────────────────────────────────────────────

class CrewListingCreate(BaseModel):
    schedule_id: int
    title: str
    role: CrewRole
    description: Optional[str] = None
    location: Optional[str] = None


class CrewListingUpdate(BaseModel):
    title: Optional[str] = None
    role: Optional[CrewRole] = None
    description: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None


class CrewListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    crew_member_id: str
    schedule_id: int
    title: str
    role: CrewRole
    description: Optional[str]
    location: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
