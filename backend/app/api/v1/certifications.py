from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user, require_crew_member
from app.crud.certification import (
    create_certification,
    delete_certification,
    get_certification,
    list_certifications_by_crew_member,
    update_certification,
)
from app.models.user import User
from app.schemas.certification import (
    CertificationCreate,
    CertificationResponse,
    CertificationUpdate,
)

router = APIRouter()


# Creates a new certification for the current crew member. crew_member_id comes from the JWT.
@router.post("/", response_model=CertificationResponse, status_code=status.HTTP_201_CREATED)
def post_certification(
    data: CertificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    return create_certification(db, data, crew_member_id=current_user.id)


# Returns all certifications of the current crew member (their dashboard).
@router.get("/mine", response_model=list[CertificationResponse])
def list_my_certifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    return list_certifications_by_crew_member(db, current_user.id)


# Returns all certifications of a specific crew member (public read for any authenticated user).
@router.get("/crew/{crew_member_id}", response_model=list[CertificationResponse])
def list_certifications_for_crew_member(
    crew_member_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return list_certifications_by_crew_member(db, crew_member_id)


# Returns a specific certification by id.
@router.get("/{certification_id}", response_model=CertificationResponse)
def read_certification(
    certification_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    cert = get_certification(db, certification_id)
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found")
    return cert


# Updates a certification. Only the crew member who owns it can modify it.
@router.patch("/{certification_id}", response_model=CertificationResponse)
def patch_certification(
    certification_id: int,
    data: CertificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    cert = get_certification(db, certification_id)
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found")
    if cert.crew_member_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your certification")
    return update_certification(db, certification_id, data)


# Deletes a certification. Only the crew member who owns it can delete it.
@router.delete("/{certification_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_certification(
    certification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    cert = get_certification(db, certification_id)
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found")
    if cert.crew_member_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your certification")
    delete_certification(db, certification_id)
    return None
