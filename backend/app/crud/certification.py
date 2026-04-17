from sqlalchemy.orm import Session

from app.models.certification import Certification
from app.schemas.certification import CertificationCreate, CertificationUpdate


# Creates a new certification for the given crew member. The crew_member_id comes from the JWT.
def create_certification(db: Session, data: CertificationCreate, crew_member_id: str) -> Certification:
    db_cert = Certification(
        crew_member_id=crew_member_id,
        name=data.name,
        issuing_authority=data.issuing_authority,
        issue_date=data.issue_date,
        expiry_date=data.expiry_date,
        document_url=data.document_url,
    )
    db.add(db_cert)
    db.commit()
    db.refresh(db_cert)
    return db_cert


# Returns the certification with the given id, or None if it does not exist.
def get_certification(db: Session, certification_id: int) -> Certification | None:
    return db.query(Certification).filter(Certification.id == certification_id).first()


# Returns all certifications of a specific crew member, most recent first.
def list_certifications_by_crew_member(db: Session, crew_member_id: str) -> list[Certification]:
    return (
        db.query(Certification)
        .filter(Certification.crew_member_id == crew_member_id)
        .order_by(Certification.created_at.desc())
        .all()
    )


# Updates the certification fields that were set in `data`. Returns None if not found.
def update_certification(db: Session, certification_id: int, data: CertificationUpdate) -> Certification | None:
    db_cert = get_certification(db, certification_id)
    if not db_cert:
        return None

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_cert, key, value)

    db.commit()
    db.refresh(db_cert)
    return db_cert


# Deletes a certification by id. Returns True if deleted, False if not found.
def delete_certification(db: Session, certification_id: int) -> bool:
    db_cert = get_certification(db, certification_id)
    if not db_cert:
        return False
    db.delete(db_cert)
    db.commit()
    return True
