from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.availability import AvailabilityType


class AvailabilityScheduleCreate(BaseModel):
    availability_type: AvailabilityType
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    recurring_days: Optional[list[int]] = None   # 0=Mon … 6=Sun
    one_off_dates: Optional[list[date]] = None


class AvailabilityScheduleUpdate(BaseModel):
    availability_type: Optional[AvailabilityType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    recurring_days: Optional[list[int]] = None
    one_off_dates: Optional[list[date]] = None


class AvailabilityScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_user_id: str
    availability_type: AvailabilityType
    start_date: Optional[date]
    end_date: Optional[date]
    recurring_days: Optional[list[int]]
    one_off_dates: Optional[list[date]]
