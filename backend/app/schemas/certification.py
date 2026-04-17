from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CertificationCreate(BaseModel):
    name: str
    issuing_authority: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    document_url: Optional[str] = None


class CertificationUpdate(BaseModel):
    name: Optional[str] = None
    issuing_authority: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    document_url: Optional[str] = None


class CertificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    crew_member_id: str
    name: str
    issuing_authority: Optional[str]
    issue_date: Optional[date]
    expiry_date: Optional[date]
    document_url: Optional[str]
    created_at: datetime
