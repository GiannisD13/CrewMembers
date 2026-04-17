from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.application import ApplicationStatus


# ── JobApplication ───────────────────────────────────────────────────────────

class JobApplicationCreate(BaseModel):
    jobposting_id: int
    message: Optional[str] = None
    cv_url: Optional[str] = None


class JobApplicationUpdate(BaseModel):
    status: ApplicationStatus


class JobApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    crewmember_id: str
    jobposting_id: int
    message: Optional[str]
    cv_url: Optional[str]
    status: ApplicationStatus
    created_at: datetime


# ── CrewInquiry ──────────────────────────────────────────────────────────────

class CrewInquiryCreate(BaseModel):
    crew_listing_id: int
    message: Optional[str] = None


class CrewInquiryUpdate(BaseModel):
    status: ApplicationStatus


class CrewInquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: str
    crew_listing_id: int
    message: Optional[str]
    status: ApplicationStatus
    created_at: datetime
