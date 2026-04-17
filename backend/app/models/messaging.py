import datetime

from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(String, ForeignKey("yacht_owners.user_id"), nullable=False)
    crew_member_id = Column(String, ForeignKey("crew_members.user_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # RELATIONSHIPS
    owner = relationship("YachtOwner", back_populates="conversations")
    crew_member = relationship("CrewMember", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # RELATIONSHIPS
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")
