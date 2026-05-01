from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator

from app.models.user import AccountType, CrewRole


def _normalize_email(value: str) -> str:
    return value.strip().lower()


def _normalize_phone(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _validate_password_strength(value: str) -> str:
    if not any(ch.isalpha() for ch in value):
        raise ValueError("password must contain at least one letter")
    if not any(ch.isdigit() for ch in value):
        raise ValueError("password must contain at least one digit")
    return value


# ── User ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    first_name: str
    last_name: str
    phone: Optional[str] = None
    account_type: AccountType

    @field_validator("email")
    @classmethod
    def _email_lower(cls, v: str) -> str:
        return _normalize_email(v)

    @field_validator("phone")
    @classmethod
    def _phone_strip(cls, v: Optional[str]) -> Optional[str]:
        return _normalize_phone(v)

    @field_validator("password")
    @classmethod
    def _password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def _phone_strip(cls, v: Optional[str]) -> Optional[str]:
        return _normalize_phone(v)


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
