import datetime

from sqlalchemy import Column, Date, DateTime, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    crew_member_id = Column(String, ForeignKey("crew_members.user_id"), nullable=False)
    name = Column(String, nullable=False)
    issuing_authority = Column(String, nullable=True)
    issue_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    document_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # RELATIONSHIPS
    crew_member = relationship("CrewMember", back_populates="certifications")
