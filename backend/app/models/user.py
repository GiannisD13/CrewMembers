import datetime
import enum
import uuid

from sqlalchemy import Column, DateTime, Integer, String, Float, Boolean, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base


class AccountType(str, enum.Enum):
    owner = "owner"
    crew = "crew"


class CrewRole(str, enum.Enum):
    captain = "captain"
    first_mate = "first_mate"
    chef = "chef"
    engineer = "engineer"
    sailor = "sailor"
    steward = "steward"
    deckhand = "deckhand"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    account_type = Column(Enum(AccountType), nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # RELATIONSHIPS
    yacht_owner = relationship("YachtOwner", back_populates="user", uselist=False)
    crew_member = relationship("CrewMember", back_populates="user", uselist=False)
    sent_messages = relationship("Message", back_populates="sender")


class YachtOwner(Base):
    __tablename__ = "yacht_owners"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    company_name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    rating = Column(Float, nullable=True)

    # RELATIONSHIPS
    user = relationship("User", back_populates="yacht_owner")
    job_postings = relationship("JobPosting", back_populates="owner")
    crew_inquiries = relationship("CrewInquiry", back_populates="owner")
    conversations = relationship("Conversation", back_populates="owner")


class CrewMember(Base):
    __tablename__ = "crew_members"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    roles = Column(ARRAY(String), nullable=False)
    experience_years = Column(Integer, nullable=True)
    location = Column(String, nullable=True)
    nationality = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    looking_for_job = Column(Boolean, default=True)
    rating = Column(Float, nullable=True)

    # RELATIONSHIPS
    user = relationship("User", back_populates="crew_member")
    certifications = relationship("Certification", back_populates="crew_member")
    crew_listings = relationship("CrewListing", back_populates="crew_member")
    job_applications = relationship("JobApplication", back_populates="crew_member")
    conversations = relationship("Conversation", back_populates="crew_member")
