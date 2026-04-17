from sqlalchemy.orm import Session

from app.models.application import JobApplication, CrewInquiry, ApplicationStatus
from app.models.listing import JobPosting, CrewListing
from app.schemas.application import (
    JobApplicationCreate, JobApplicationUpdate,
    CrewInquiryCreate, CrewInquiryUpdate,
)


# ── JobApplication ───────────────────────────────────────────────────────────

# Creates a new job application from a crew member to a job posting.
# Raises ValueError if the crew member has already applied to this posting.
def create_job_application(db: Session, data: JobApplicationCreate, crewmember_id: str) -> JobApplication:
    existing = (
        db.query(JobApplication)
        .filter(
            JobApplication.crewmember_id == crewmember_id,
            JobApplication.jobposting_id == data.jobposting_id,
        )
        .first()
    )
    if existing:
        raise ValueError("You have already applied to this job posting")

    db_application = JobApplication(
        crewmember_id=crewmember_id,
        jobposting_id=data.jobposting_id,
        message=data.message,
        cv_url=data.cv_url,
    )
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application


# Returns the job application with the given id, or None if it does not exist.
def get_job_application(db: Session, application_id: int) -> JobApplication | None:
    return db.query(JobApplication).filter(JobApplication.id == application_id).first()


# Returns all applications submitted by a specific crew member, optionally filtered by status.
def list_applications_by_crew_member(
    db: Session,
    crewmember_id: str,
    status: ApplicationStatus | None = None,
) -> list[JobApplication]:
    query = db.query(JobApplication).filter(JobApplication.crewmember_id == crewmember_id)
    if status is not None:
        query = query.filter(JobApplication.status == status)
    return query.order_by(JobApplication.created_at.desc()).all()


# Returns all applications submitted for a specific job posting (used by the owner who owns that posting).
def list_applications_for_job_posting(
    db: Session,
    jobposting_id: int,
    status: ApplicationStatus | None = None,
) -> list[JobApplication]:
    query = db.query(JobApplication).filter(JobApplication.jobposting_id == jobposting_id)
    if status is not None:
        query = query.filter(JobApplication.status == status)
    return query.order_by(JobApplication.created_at.desc()).all()


# Returns every application across ALL job postings owned by the given owner.
# Useful for the owner's "Applications" inbox.
def list_applications_for_owner(
    db: Session,
    owner_id: str,
    status: ApplicationStatus | None = None,
) -> list[JobApplication]:
    query = (
        db.query(JobApplication)
        .join(JobPosting, JobApplication.jobposting_id == JobPosting.id)
        .filter(JobPosting.owner_id == owner_id)
    )
    if status is not None:
        query = query.filter(JobApplication.status == status)
    return query.order_by(JobApplication.created_at.desc()).all()


# Updates the status of a job application (owner accepts or rejects). Returns None if not found.
def update_application_status(
    db: Session,
    application_id: int,
    data: JobApplicationUpdate,
) -> JobApplication | None:
    db_application = get_job_application(db, application_id)
    if not db_application:
        return None
    db_application.status = data.status
    db.commit()
    db.refresh(db_application)
    return db_application


# Deletes a job application (used when the crew member withdraws). Returns True if deleted.
def delete_job_application(db: Session, application_id: int) -> bool:
    db_application = get_job_application(db, application_id)
    if not db_application:
        return False
    db.delete(db_application)
    db.commit()
    return True


# ── CrewInquiry ──────────────────────────────────────────────────────────────

# Creates a new inquiry from an owner to a crew listing.
# Raises ValueError if the owner has already sent an inquiry for this listing.
def create_crew_inquiry(db: Session, data: CrewInquiryCreate, owner_id: str) -> CrewInquiry:
    existing = (
        db.query(CrewInquiry)
        .filter(
            CrewInquiry.owner_id == owner_id,
            CrewInquiry.crew_listing_id == data.crew_listing_id,
        )
        .first()
    )
    if existing:
        raise ValueError("You have already inquired about this crew listing")

    db_inquiry = CrewInquiry(
        owner_id=owner_id,
        crew_listing_id=data.crew_listing_id,
        message=data.message,
    )
    db.add(db_inquiry)
    db.commit()
    db.refresh(db_inquiry)
    return db_inquiry


# Returns the crew inquiry with the given id, or None if it does not exist.
def get_crew_inquiry(db: Session, inquiry_id: int) -> CrewInquiry | None:
    return db.query(CrewInquiry).filter(CrewInquiry.id == inquiry_id).first()


# Returns all inquiries sent by a specific owner, optionally filtered by status.
def list_inquiries_by_owner(
    db: Session,
    owner_id: str,
    status: ApplicationStatus | None = None,
) -> list[CrewInquiry]:
    query = db.query(CrewInquiry).filter(CrewInquiry.owner_id == owner_id)
    if status is not None:
        query = query.filter(CrewInquiry.status == status)
    return query.order_by(CrewInquiry.created_at.desc()).all()


# Returns all inquiries sent for a specific crew listing (used by the crew member who owns that listing).
def list_inquiries_for_crew_listing(
    db: Session,
    crew_listing_id: int,
    status: ApplicationStatus | None = None,
) -> list[CrewInquiry]:
    query = db.query(CrewInquiry).filter(CrewInquiry.crew_listing_id == crew_listing_id)
    if status is not None:
        query = query.filter(CrewInquiry.status == status)
    return query.order_by(CrewInquiry.created_at.desc()).all()


# Returns every inquiry across ALL crew listings owned by the given crew member.
# Useful for the crew member's "Inquiries" inbox.
def list_inquiries_for_crew_member(
    db: Session,
    crew_member_id: str,
    status: ApplicationStatus | None = None,
) -> list[CrewInquiry]:
    query = (
        db.query(CrewInquiry)
        .join(CrewListing, CrewInquiry.crew_listing_id == CrewListing.id)
        .filter(CrewListing.crew_member_id == crew_member_id)
    )
    if status is not None:
        query = query.filter(CrewInquiry.status == status)
    return query.order_by(CrewInquiry.created_at.desc()).all()


# Updates the status of a crew inquiry (crew member accepts or rejects). Returns None if not found.
def update_inquiry_status(
    db: Session,
    inquiry_id: int,
    data: CrewInquiryUpdate,
) -> CrewInquiry | None:
    db_inquiry = get_crew_inquiry(db, inquiry_id)
    if not db_inquiry:
        return None
    db_inquiry.status = data.status
    db.commit()
    db.refresh(db_inquiry)
    return db_inquiry


# Deletes a crew inquiry (used when the owner withdraws it). Returns True if deleted.
def delete_crew_inquiry(db: Session, inquiry_id: int) -> bool:
    db_inquiry = get_crew_inquiry(db, inquiry_id)
    if not db_inquiry:
        return False
    db.delete(db_inquiry)
    db.commit()
    return True
