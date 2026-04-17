from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.crud.messages import (
    create_message,
    delete_conversation,
    delete_message,
    get_conversation,
    get_message,
    list_conversations_by_crew_member,
    list_conversations_by_owner,
    list_messages_in_conversation,
)
from app.models.user import AccountType, User
from app.schemas.messaging import (
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)

router = APIRouter()


# ── Helper ───────────────────────────────────────────────────────────────────

# Raises 403 if the user is not a participant in the given conversation.
def _ensure_participant(conversation, user: User) -> None:
    if user.id != conversation.owner_id and user.id != conversation.crew_member_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant in this conversation")


# ── Conversations ────────────────────────────────────────────────────────────
#
# Note: conversations are never created directly. They are created automatically
# when a JobApplication or CrewInquiry is accepted (see api/v1/applications.py).

# Returns every conversation the current user participates in, most recent first.
# Works for both owners (as owner_id) and crew members (as crew_member_id).
@router.get("/conversations", response_model=list[ConversationResponse])
def list_my_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.account_type == AccountType.owner:
        return list_conversations_by_owner(db, current_user.id)
    return list_conversations_by_crew_member(db, current_user.id)


# Returns a specific conversation. Only the two participants can read it.
@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def read_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    conversation = get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    _ensure_participant(conversation, current_user)
    return conversation


# Deletes a conversation (and all its messages). Only the two participants can delete it.
@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    conversation = get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    _ensure_participant(conversation, current_user)
    delete_conversation(db, conversation_id)
    return None


# ── Messages ─────────────────────────────────────────────────────────────────

# Sends a new message in a conversation. The sender_id comes from the JWT.
# Only participants of the conversation can post messages.
@router.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def post_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    conversation = get_conversation(db, data.conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    _ensure_participant(conversation, current_user)
    return create_message(db, data.conversation_id, sender_id=current_user.id, content=data.content)


# Returns the messages of a conversation (oldest first, paginated). Only participants can read.
@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
def read_messages(
    conversation_id: int,
    skip: int = 0,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    conversation = get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    _ensure_participant(conversation, current_user)
    return list_messages_in_conversation(db, conversation_id, skip=skip, limit=limit)


# Deletes a single message. Only the sender of the message can delete it.
@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    message = get_message(db, message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your message")
    delete_message(db, message_id)
    return None
