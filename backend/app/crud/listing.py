from decimal import Decimal

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.availability import AvailabilitySchedule, AvailabilityType
from app.models.listing import JobPosting, JobPostingMedia, CrewListing
from app.models.user import CrewRole
from app.schemas.listing import (
    JobPostingCreate, JobPostingUpdate,
    JobPostingMediaCreate,
    CrewListingCreate, CrewListingUpdate,
)


# ── Helper: schedule overlap ─────────────────────────────────────────────────

# Builds a SQL filter that tests whether AvailabilitySchedule (the joined table)
# overlaps with the given concrete schedule instance. Two schedules "overlap" if:
#   - either side is permanent, OR
#   - their date ranges overlap (seasonal/temporary), OR
#   - their recurring_days share at least one day, OR
#   - their one_off_dates share at least one date.
def _overlap_filter(input_schedule: AvailabilitySchedule):
    # If the input is permanent, every posting matches.
    if input_schedule.availability_type == AvailabilityType.permanent:
        return AvailabilitySchedule.id.isnot(None)

    conds = [
        # Other side is permanent → always available
        AvailabilitySchedule.availability_type == AvailabilityType.permanent,
    ]
    # Date range overlap (seasonal / temporary)
    if input_schedule.start_date is not None and input_schedule.end_date is not None:
        conds.append(and_(
            AvailabilitySchedule.start_date.isnot(None),
            AvailabilitySchedule.end_date.isnot(None),
            AvailabilitySchedule.start_date <= input_schedule.end_date,
            AvailabilitySchedule.end_date >= input_schedule.start_date,
        ))
    # Recurring days overlap (custom, e.g. both available on weekends)
    if input_schedule.recurring_days:
        conds.append(and_(
            AvailabilitySchedule.recurring_days.isnot(None),
            AvailabilitySchedule.recurring_days.overlap(input_schedule.recurring_days),
        ))
    # One-off dates overlap (custom, specific dates)
    if input_schedule.one_off_dates:
        conds.append(and_(
            AvailabilitySchedule.one_off_dates.isnot(None),
            AvailabilitySchedule.one_off_dates.overlap(input_schedule.one_off_dates),
        ))
    return or_(*conds)


# ── JobPosting ───────────────────────────────────────────────────────────────

# Creates a new job posting for the given owner. The owner_id comes from the JWT.
def create_job_posting(db: Session, data: JobPostingCreate, owner_id: str) -> JobPosting:
    db_posting = JobPosting(
        owner_id=owner_id,
        schedule_id=data.schedule_id,
        title=data.title,
        role=data.role,
        description=data.description,
        location=data.location,
        salary=data.salary,
    )
    db.add(db_posting)
    db.commit()
    db.refresh(db_posting)
    return db_posting


# Returns the job posting with the given id, or None if it does not exist.
def get_job_posting(db: Session, posting_id: int) -> JobPosting | None:
    return db.query(JobPosting).filter(JobPosting.id == posting_id).first()


# Returns a filtered list of job postings for the browse page.
# Supports any combination of: role, location, min_salary, owner_id, schedule overlap.
def list_job_postings(
    db: Session,
    role: CrewRole | None = None,
    location: str | None = None,
    min_salary: Decimal | None = None,
    owner_id: str | None = None,
    schedule_id: int | None = None,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 50,
) -> list[JobPosting]:
    query = db.query(JobPosting)

    if active_only:
        query = query.filter(JobPosting.is_active.is_(True))
    if role is not None:
        query = query.filter(JobPosting.role == role)
    if location:
        query = query.filter(JobPosting.location.ilike(f"%{location}%"))
    if min_salary is not None:
        query = query.filter(JobPosting.salary >= min_salary)
    if owner_id:
        query = query.filter(JobPosting.owner_id == owner_id)
    if schedule_id is not None:
        input_schedule = db.query(AvailabilitySchedule).filter(AvailabilitySchedule.id == schedule_id).first()
        if input_schedule is None:
            return []
        query = query.join(AvailabilitySchedule, JobPosting.schedule_id == AvailabilitySchedule.id)
        query = query.filter(_overlap_filter(input_schedule))

    return query.order_by(JobPosting.created_at.desc()).offset(skip).limit(limit).all()


# Returns all job postings of a specific owner (including inactive ones — used on the owner's own dashboard).
def list_job_postings_by_owner(db: Session, owner_id: str) -> list[JobPosting]:
    return (
        db.query(JobPosting)
        .filter(JobPosting.owner_id == owner_id)
        .order_by(JobPosting.created_at.desc())
        .all()
    )


# Match feature: given a crew_listing, returns job postings with the same role and an overlapping availability schedule.
# This is the "match for this listing" button for the crew member.
def match_job_postings_for_crew_listing(
    db: Session,
    crew_listing_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[JobPosting]:
    crew_listing = db.query(CrewListing).filter(CrewListing.id == crew_listing_id).first()
    if crew_listing is None:
        return []
    return list_job_postings(
        db,
        role=crew_listing.role,
        schedule_id=crew_listing.schedule_id,
        active_only=True,
        skip=skip,
        limit=limit,
    )


# Updates the job posting fields that were set in `data`. Returns None if not found.
def update_job_posting(db: Session, posting_id: int, data: JobPostingUpdate) -> JobPosting | None:
    db_posting = get_job_posting(db, posting_id)
    if not db_posting:
        return None

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_posting, key, value)

    db.commit()
    db.refresh(db_posting)
    return db_posting


# Deletes the job posting with the given id. Returns True if deleted, False if not found.
def delete_job_posting(db: Session, posting_id: int) -> bool:
    db_posting = get_job_posting(db, posting_id)
    if not db_posting:
        return False
    db.delete(db_posting)
    db.commit()
    return True


# ── JobPostingMedia ──────────────────────────────────────────────────────────

# Adds a media item (image/video url) to an existing job posting.
def create_media(db: Session, posting_id: int, data: JobPostingMediaCreate) -> JobPostingMedia:
    db_media = JobPostingMedia(
        jobposting_id=posting_id,
        url=data.url,
        order=data.order,
    )
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    return db_media


# Returns all media items of a job posting, sorted by `order`.
def list_media(db: Session, posting_id: int) -> list[JobPostingMedia]:
    return (
        db.query(JobPostingMedia)
        .filter(JobPostingMedia.jobposting_id == posting_id)
        .order_by(JobPostingMedia.order)
        .all()
    )


# Deletes a media item by id. Returns True if deleted, False if not found.
def delete_media(db: Session, media_id: int) -> bool:
    db_media = db.query(JobPostingMedia).filter(JobPostingMedia.id == media_id).first()
    if not db_media:
        return False
    db.delete(db_media)
    db.commit()
    return True


# ── CrewListing ──────────────────────────────────────────────────────────────

# Creates a new crew listing for the given crew member. The crew_member_id comes from the JWT.
def create_crew_listing(db: Session, data: CrewListingCreate, crew_member_id: str) -> CrewListing:
    db_listing = CrewListing(
        crew_member_id=crew_member_id,
        schedule_id=data.schedule_id,
        title=data.title,
        role=data.role,
        description=data.description,
        location=data.location,
    )
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)
    return db_listing


# Returns the crew listing with the given id, or None if it does not exist.
def get_crew_listing(db: Session, listing_id: int) -> CrewListing | None:
    return db.query(CrewListing).filter(CrewListing.id == listing_id).first()


# Returns a filtered list of crew listings for the browse page.
# Supports any combination of: role, location, crew_member_id, schedule overlap.
def list_crew_listings(
    db: Session,
    role: CrewRole | None = None,
    location: str | None = None,
    crew_member_id: str | None = None,
    schedule_id: int | None = None,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 50,
) -> list[CrewListing]:
    query = db.query(CrewListing)

    if active_only:
        query = query.filter(CrewListing.is_active.is_(True))
    if role is not None:
        query = query.filter(CrewListing.role == role)
    if location:
        query = query.filter(CrewListing.location.ilike(f"%{location}%"))
    if crew_member_id:
        query = query.filter(CrewListing.crew_member_id == crew_member_id)
    if schedule_id is not None:
        input_schedule = db.query(AvailabilitySchedule).filter(AvailabilitySchedule.id == schedule_id).first()
        if input_schedule is None:
            return []
        query = query.join(AvailabilitySchedule, CrewListing.schedule_id == AvailabilitySchedule.id)
        query = query.filter(_overlap_filter(input_schedule))

    return query.order_by(CrewListing.created_at.desc()).offset(skip).limit(limit).all()


# Returns all crew listings of a specific crew member (including inactive ones — used on the crew member's own dashboard).
def list_crew_listings_by_member(db: Session, crew_member_id: str) -> list[CrewListing]:
    return (
        db.query(CrewListing)
        .filter(CrewListing.crew_member_id == crew_member_id)
        .order_by(CrewListing.created_at.desc())
        .all()
    )


# Match feature: given a job_posting, returns crew listings with the same role and an overlapping availability schedule.
# This is the "match for this posting" button for the yacht owner.
def match_crew_listings_for_job_posting(
    db: Session,
    job_posting_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[CrewListing]:
    job_posting = db.query(JobPosting).filter(JobPosting.id == job_posting_id).first()
    if job_posting is None:
        return []
    return list_crew_listings(
        db,
        role=job_posting.role,
        schedule_id=job_posting.schedule_id,
        active_only=True,
        skip=skip,
        limit=limit,
    )


# Updates the crew listing fields that were set in `data`. Returns None if not found.
def update_crew_listing(db: Session, listing_id: int, data: CrewListingUpdate) -> CrewListing | None:
    db_listing = get_crew_listing(db, listing_id)
    if not db_listing:
        return None

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_listing, key, value)

    db.commit()
    db.refresh(db_listing)
    return db_listing


# Deletes the crew listing with the given id. Returns True if deleted, False if not found.
def delete_crew_listing(db: Session, listing_id: int) -> bool:
    db_listing = get_crew_listing(db, listing_id)
    if not db_listing:
        return False
    db.delete(db_listing)
    db.commit()
    return True
