from sqlalchemy.orm import Session

from app.models.messaging import Conversation, Message


# ── Conversation ─────────────────────────────────────────────────────────────

# Returns the conversation between a specific owner and crew member, or None if it does not exist.
def get_conversation_between(db: Session, owner_id: str, crew_member_id: str) -> Conversation | None:
    return (
        db.query(Conversation)
        .filter(
            Conversation.owner_id == owner_id,
            Conversation.crew_member_id == crew_member_id,
        )
        .first()
    )


# Creates a new conversation between an owner and a crew member.
# Raises ValueError if a conversation already exists between these two users.
def create_conversation(db: Session, owner_id: str, crew_member_id: str) -> Conversation:
    existing = get_conversation_between(db, owner_id, crew_member_id)
    if existing:
        raise ValueError("Conversation between these users already exists")

    db_conversation = Conversation(
        owner_id=owner_id,
        crew_member_id=crew_member_id,
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation


# Returns an existing conversation between the two users, or creates a new one if none exists.
# Useful when a user clicks "Message" on a profile — always ends up in a single thread.
def get_or_create_conversation(db: Session, owner_id: str, crew_member_id: str) -> Conversation:
    existing = get_conversation_between(db, owner_id, crew_member_id)
    if existing:
        return existing
    return create_conversation(db, owner_id, crew_member_id)


# Returns the conversation with the given id, or None if it does not exist.
def get_conversation(db: Session, conversation_id: int) -> Conversation | None:
    return db.query(Conversation).filter(Conversation.id == conversation_id).first()


# Returns all conversations that an owner participates in, most recent first.
def list_conversations_by_owner(db: Session, owner_id: str) -> list[Conversation]:
    return (
        db.query(Conversation)
        .filter(Conversation.owner_id == owner_id)
        .order_by(Conversation.created_at.desc())
        .all()
    )


# Returns all conversations that a crew member participates in, most recent first.
def list_conversations_by_crew_member(db: Session, crew_member_id: str) -> list[Conversation]:
    return (
        db.query(Conversation)
        .filter(Conversation.crew_member_id == crew_member_id)
        .order_by(Conversation.created_at.desc())
        .all()
    )


# Deletes a conversation along with all of its messages. Returns True if deleted.
def delete_conversation(db: Session, conversation_id: int) -> bool:
    db_conversation = get_conversation(db, conversation_id)
    if not db_conversation:
        return False
    # Delete messages first (no cascade on the FK)
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.delete(db_conversation)
    db.commit()
    return True


# ── Message ──────────────────────────────────────────────────────────────────

# Creates a new message in a conversation. The sender_id comes from the JWT.
def create_message(db: Session, conversation_id: int, sender_id: str, content: str) -> Message:
    db_message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


# Returns the message with the given id, or None if it does not exist.
def get_message(db: Session, message_id: int) -> Message | None:
    return db.query(Message).filter(Message.id == message_id).first()


# Returns the messages of a conversation, oldest first, with pagination support.
def list_messages_in_conversation(
    db: Session,
    conversation_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[Message]:
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# Returns the most recent message of a conversation (used for conversation previews in inbox UI).
def get_latest_message(db: Session, conversation_id: int) -> Message | None:
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .first()
    )


# Deletes a message by id. Returns True if deleted, False if not found.
def delete_message(db: Session, message_id: int) -> bool:
    db_message = get_message(db, message_id)
    if not db_message:
        return False
    db.delete(db_message)
    db.commit()
    return True
