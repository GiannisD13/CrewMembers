from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    get_current_active_user,
    require_admin,
    require_owner,
    require_crew_member,
)
from app.crud.user import (
    delete_user,
    get_crew_member,
    get_owner,
    get_user_by_id,
    set_admin,
    update_crew_member,
    update_owner,
    update_user,
)
from app.models.user import User
from app.schemas.user import (
    CrewMemberResponse,
    CrewMemberUpdate,
    UserResponse,
    UserUpdate,
    YachtOwnerResponse,
    YachtOwnerUpdate,
)

router = APIRouter()


# ── Current user ─────────────────────────────────────────────────────────────

# Returns the currently authenticated user (base fields only).
@router.get("/me", response_model=UserResponse)
def read_me(current_user: User = Depends(get_current_active_user)):
    return current_user


# Updates base user fields (first_name, last_name, phone, photo_url) of the current user.
@router.patch("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        user = update_user(db, current_user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return user


# Deletes the current user's account (and its child profile rows).
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    delete_user(db, current_user.id)
    return None


# ── Owner profile ────────────────────────────────────────────────────────────

# Returns the YachtOwner profile of the current owner.
@router.get("/me/owner", response_model=YachtOwnerResponse)
def read_my_owner_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    owner = get_owner(db, current_user.id)
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner profile not found")
    return owner


# Updates the YachtOwner profile (company_name, description, location) of the current owner.
@router.patch("/me/owner", response_model=YachtOwnerResponse)
def update_my_owner_profile(
    data: YachtOwnerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    owner = update_owner(db, current_user.id, data)
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner profile not found")
    return owner


# ── Crew profile ─────────────────────────────────────────────────────────────

# Returns the CrewMember profile of the current crew user.
@router.get("/me/crew", response_model=CrewMemberResponse)
def read_my_crew_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    crew = get_crew_member(db, current_user.id)
    if not crew:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crew profile not found")
    return crew


# Updates the CrewMember profile (roles, experience, location, nationality, bio, looking_for_job).
@router.patch("/me/crew", response_model=CrewMemberResponse)
def update_my_crew_profile(
    data: CrewMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    crew = update_crew_member(db, current_user.id, data)
    if not crew:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crew profile not found")
    return crew


# ── Public read ──────────────────────────────────────────────────────────────

# Returns a user's public info by id (any authenticated user can call this).
@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


# Returns the YachtOwner profile of a specific user by id.
@router.get("/{user_id}/owner", response_model=YachtOwnerResponse)
def read_owner_profile(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    owner = get_owner(db, user_id)
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner profile not found")
    return owner


# Returns the CrewMember profile of a specific user by id.
@router.get("/{user_id}/crew", response_model=CrewMemberResponse)
def read_crew_profile(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    crew = get_crew_member(db, user_id)
    if not crew:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crew profile not found")
    return crew


# ── Admin ────────────────────────────────────────────────────────────────────

# Grants or revokes admin privileges on another user. Admin-only.
@router.patch("/{user_id}/admin", response_model=UserResponse)
def set_user_admin(
    user_id: str,
    is_admin: bool,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = set_admin(db, user_id, is_admin)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


# Deletes any user by id. Admin-only.
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_by_admin(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if not delete_user(db, user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return None
