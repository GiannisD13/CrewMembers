import datetime

from sqlalchemy import Column, DateTime, Integer, String, Numeric, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import CrewRole


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(String, ForeignKey("yacht_owners.user_id"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("availability_schedules.id"), nullable=False)
    title = Column(String, nullable=False, index=True)
    role = Column(Enum(CrewRole), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    salary = Column(Numeric, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # RELATIONSHIPS
    owner = relationship("YachtOwner", back_populates="job_postings")
    schedule = relationship("AvailabilitySchedule", back_populates="job_postings")
    media = relationship("JobPostingMedia", back_populates="job_posting")
    applications = relationship("JobApplication", back_populates="job_posting")


class JobPostingMedia(Base):
    __tablename__ = "job_posting_media"

    id = Column(Integer, primary_key=True, autoincrement=True)
    jobposting_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    url = Column(String, nullable=False)
    order = Column(Integer, nullable=False, default=0)

    # RELATIONSHIPS
    job_posting = relationship("JobPosting", back_populates="media")


class CrewListing(Base):
    __tablename__ = "crew_listings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    crew_member_id = Column(String, ForeignKey("crew_members.user_id"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("availability_schedules.id"), nullable=False)
    title = Column(String, nullable=False, index=True)
    role = Column(Enum(CrewRole), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # RELATIONSHIPS
    crew_member = relationship("CrewMember", back_populates="crew_listings")
    schedule = relationship("AvailabilitySchedule", back_populates="crew_listings")
    inquiries = relationship("CrewInquiry", back_populates="crew_listing")
