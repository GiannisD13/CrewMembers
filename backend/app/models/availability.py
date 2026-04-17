import datetime
import enum

from sqlalchemy import Column, DateTime, Integer, String, Numeric, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class AvailabilityType(str, enum.Enum):
    permanent = "permanent"
    seasonal = "seasonal"
    temporary = "temporary"