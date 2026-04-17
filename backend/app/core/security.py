from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import os

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, AccountType


load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme — Swagger UI uses this to show a "login" button.
# The tokenUrl points to the login endpoint that will be created in api/v1/auth.py.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ── Password hashing ─────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT ──────────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ── FastAPI dependencies ─────────────────────────────────────────────────────

# Returns the currently authenticated user. Raises 401 if the token is missing/invalid.
def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_error
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_error

    # Lazy import to avoid circular dependency (crud.user imports verify_password from here)
    from app.crud.user import get_user_by_id
    user = get_user_by_id(db, user_id)
    if user is None:
        raise credentials_error
    return user


# Like get_current_user, but also rejects deactivated accounts.
def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated",
        )
    return current_user


# Allows only yacht owners. Raises 403 for crew members.
def require_owner(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.account_type != AccountType.owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner account required",
        )
    return current_user


# Allows only crew members. Raises 403 for owners.
def require_crew_member(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.account_type != AccountType.crew:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Crew account required",
        )
    return current_user


# Allows only admins.
def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
