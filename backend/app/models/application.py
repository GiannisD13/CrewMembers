import datetime
import enum

from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Text, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class JobApplication(Base):
    __tablename__ = "job_applications"
    __table_args__ = (
        UniqueConstraint("crewmember_id", "jobposting_id", name="uq_job_applications_crew_posting"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    crewmember_id = Column(String, ForeignKey("crew_members.user_id", ondelete="CASCADE"), nullable=False)
    jobposting_id = Column(Integer, ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=True)
    cv_url = Column(String, nullable=True)
    status = Column(Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.pending)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # RELATIONSHIPS
    crew_member = relationship("CrewMember", back_populates="job_applications")
    job_posting = relationship("JobPosting", back_populates="applications")


class CrewInquiry(Base):
    __tablename__ = "crew_inquiries"
    __table_args__ = (
        UniqueConstraint("owner_id", "crew_listing_id", name="uq_crew_inquiries_owner_listing"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(String, ForeignKey("yacht_owners.user_id", ondelete="CASCADE"), nullable=False)
    crew_listing_id = Column(Integer, ForeignKey("crew_listings.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.pending)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # RELATIONSHIPS
    owner = relationship("YachtOwner", back_populates="crew_inquiries")
    crew_listing = relationship("CrewListing", back_populates="inquiries")
