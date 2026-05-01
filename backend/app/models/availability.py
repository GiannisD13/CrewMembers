import enum

from sqlalchemy import Column, Date, ForeignKey, Integer, Enum, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base


class AvailabilityType(str, enum.Enum):
    permanent = "permanent"
    seasonal = "seasonal"
    temporary = "temporary"
    custom = "custom"


class AvailabilitySchedule(Base):
    __tablename__ = "availability_schedules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    availability_type = Column(Enum(AvailabilityType), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    recurring_days = Column(ARRAY(Integer), nullable=True)  # 0=Mon … 6=Sun
    one_off_dates = Column(ARRAY(Date), nullable=True)

    # RELATIONSHIPS
    owner = relationship("User")
    job_postings = relationship("JobPosting", back_populates="schedule")
    crew_listings = relationship("CrewListing", back_populates="schedule")
