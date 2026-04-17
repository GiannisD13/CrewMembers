from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import AccountType, CrewRole


# ── User ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    account_type: AccountType


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    photo_url: Optional[str]
    account_type: AccountType
    is_active: bool
    is_admin: bool
    created_at: datetime


# ── YachtOwner ───────────────────────────────────────────────────────────────

class YachtOwnerCreate(BaseModel):
    company_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None


class YachtOwnerUpdate(BaseModel):
    company_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None


class YachtOwnerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    company_name: Optional[str]
    description: Optional[str]
    location: Optional[str]
    rating: Optional[float]


# ── CrewMember ───────────────────────────────────────────────────────────────

class CrewMemberCreate(BaseModel):
    roles: list[CrewRole]
    experience_years: Optional[int] = None
    location: Optional[str] = None
    nationality: Optional[str] = None
    bio: Optional[str] = None
    looking_for_job: bool = True


class CrewMemberUpdate(BaseModel):
    roles: Optional[list[CrewRole]] = None
    experience_years: Optional[int] = None
    location: Optional[str] = None
    nationality: Optional[str] = None
    bio: Optional[str] = None
    looking_for_job: Optional[bool] = None


class CrewMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    roles: list[CrewRole]
    experience_years: Optional[int]
    location: Optional[str]
    nationality: Optional[str]
    bio: Optional[str]
    looking_for_job: bool
    rating: Optional[float]
