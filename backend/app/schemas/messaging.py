from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ── Conversation ─────────────────────────────────────────────────────────────

class ConversationCreate(BaseModel):
    crew_member_id: str


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: str
    crew_member_id: str
    created_at: datetime


# ── Message ──────────────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    conversation_id: int
    content: str


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_id: str
    content: str
    created_at: datetime
