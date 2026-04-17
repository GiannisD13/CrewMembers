from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.application import ApplicationStatus
from app.schemas.messaging import ConversationResponse


# ── JobApplication ───────────────────────────────────────────────────────────

class JobApplicationCreate(BaseModel):
    jobposting_id: int
    message: Optional[str] = None
    cv_url: Optional[str] = None


# Body used when the owner accepts an application. The optional message is sent
# as the first message of the newly created conversation.
class JobApplicationAccept(BaseModel):
    message: Optional[str] = None


class JobApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    crewmember_id: str
    jobposting_id: int
    message: Optional[str]
    cv_url: Optional[str]
    status: ApplicationStatus
    created_at: datetime


# Response after a successful accept — includes both the updated application and the new conversation.
class JobApplicationAcceptResponse(BaseModel):
    application: JobApplicationResponse
    conversation: ConversationResponse


# ── CrewInquiry ──────────────────────────────────────────────────────────────

class CrewInquiryCreate(BaseModel):
    crew_listing_id: int
    message: Optional[str] = None


# Body used when the crew member accepts an inquiry. The optional message is sent
# as the first message of the newly created conversation.
class CrewInquiryAccept(BaseModel):
    message: Optional[str] = None


class CrewInquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: str
    crew_listing_id: int
    message: Optional[str]
    status: ApplicationStatus
    created_at: datetime


# Response after a successful accept — includes both the updated inquiry and the new conversation.
class CrewInquiryAcceptResponse(BaseModel):
    inquiry: CrewInquiryResponse
    conversation: ConversationResponse
