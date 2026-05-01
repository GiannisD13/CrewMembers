from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, hash_password
from app.crud.user import (
    authenticate_user,
    create_owner,
    create_crew_member,
    get_user_by_email,
)
from app.models.user import AccountType, User
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate, CrewMemberCreate


def _phone_taken(db: Session, phone: str | None) -> bool:
    if phone is None:
        return False
    return db.query(User).filter(User.phone == phone).first() is not None

router = APIRouter()


# Login with email + password (form-data). Returns a JWT on success.
@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(data={"sub": user.id})
    return TokenResponse(access_token=token)


# Registers a new yacht owner. Creates both `users` and `yacht_owners` rows.
# Returns a JWT so the user is logged in immediately.
@router.post("/register/owner", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_owner(
    data: UserCreate,
    db: Session = Depends(get_db),
):
    if data.account_type != AccountType.owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="account_type must be 'owner' for this endpoint",
        )
    if get_user_by_email(db, data.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    if _phone_taken(db, data.phone):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phone already registered",
        )

    owner = create_owner(db, data, hash_password(data.password))
    token = create_access_token(data={"sub": owner.user_id})
    return TokenResponse(access_token=token)


# Registers a new crew member. Creates both `users` and `crew_members` rows.
# Body expects two objects: `user_data` (base user fields) and `crew_data` (crew-specific fields).
# Returns a JWT so the user is logged in immediately.
@router.post("/register/crew", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_crew(
    user_data: UserCreate,
    crew_data: CrewMemberCreate,
    db: Session = Depends(get_db),
):
    if user_data.account_type != AccountType.crew:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="account_type must be 'crew' for this endpoint",
        )
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    if _phone_taken(db, user_data.phone):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phone already registered",
        )

    crew = create_crew_member(db, user_data, crew_data, hash_password(user_data.password))
    token = create_access_token(data={"sub": crew.user_id})
    return TokenResponse(access_token=token)
