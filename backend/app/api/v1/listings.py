from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    get_current_active_user,
    require_crew_member,
    require_owner,
)
from app.crud.listing import (
    create_crew_listing,
    create_job_posting,
    create_media,
    delete_crew_listing,
    delete_job_posting,
    delete_media,
    get_crew_listing,
    get_job_posting,
    list_crew_listings,
    list_crew_listings_by_member,
    list_job_postings,
    list_job_postings_by_owner,
    list_media,
    match_crew_listings_for_job_posting,
    match_job_postings_for_crew_listing,
    update_crew_listing,
    update_job_posting,
)
from app.models.listing import JobPostingMedia
from app.models.user import CrewRole, User
from app.schemas.listing import (
    CrewListingCreate,
    CrewListingResponse,
    CrewListingUpdate,
    JobPostingCreate,
    JobPostingMediaCreate,
    JobPostingMediaResponse,
    JobPostingResponse,
    JobPostingUpdate,
)

router = APIRouter()


# ── JobPostings ──────────────────────────────────────────────────────────────

# Creates a new job posting. Only yacht owners can post jobs; the owner_id comes from the JWT.
@router.post("/job-postings", response_model=JobPostingResponse, status_code=status.HTTP_201_CREATED)
def post_job_posting(
    data: JobPostingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    return create_job_posting(db, data, owner_id=current_user.id)


# Lists active job postings with optional filters (role, location, min_salary, owner, schedule overlap).
# Used by the crew member's browse/search page.
@router.get("/job-postings", response_model=list[JobPostingResponse])
def browse_job_postings(
    role: CrewRole | None = None,
    location: str | None = None,
    min_salary: Decimal | None = None,
    owner_id: str | None = None,
    schedule_id: int | None = None,
    skip: int = 0,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return list_job_postings(
        db,
        role=role,
        location=location,
        min_salary=min_salary,
        owner_id=owner_id,
        schedule_id=schedule_id,
        active_only=True,
        skip=skip,
        limit=limit,
    )


# Returns every job posting of the current owner, including inactive ones (owner's dashboard).
@router.get("/job-postings/mine", response_model=list[JobPostingResponse])
def list_my_job_postings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    return list_job_postings_by_owner(db, current_user.id)


# Returns a specific job posting by id.
@router.get("/job-postings/{posting_id}", response_model=JobPostingResponse)
def read_job_posting(
    posting_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    posting = get_job_posting(db, posting_id)
    if not posting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
    return posting


# Updates a job posting. Only the owner of the posting can modify it.
@router.patch("/job-postings/{posting_id}", response_model=JobPostingResponse)
def patch_job_posting(
    posting_id: int,
    data: JobPostingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    posting = get_job_posting(db, posting_id)
    if not posting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
    if posting.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job posting")
    return update_job_posting(db, posting_id, data)


# Deletes a job posting. Only the owner of the posting can delete it.
@router.delete("/job-postings/{posting_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_job_posting(
    posting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    posting = get_job_posting(db, posting_id)
    if not posting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
    if posting.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job posting")
    delete_job_posting(db, posting_id)
    return None


# Match feature: returns crew listings with the same role and overlapping availability.
# Only the owner of the job posting can call this.
@router.get("/job-postings/{posting_id}/matches", response_model=list[CrewListingResponse])
def match_crew_for_posting(
    posting_id: int,
    skip: int = 0,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    posting = get_job_posting(db, posting_id)
    if not posting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
    if posting.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job posting")
    return match_crew_listings_for_job_posting(db, posting_id, skip=skip, limit=limit)


# ── JobPostingMedia ──────────────────────────────────────────────────────────

# Adds a media item (url + order) to a job posting. Only the posting owner can add media.
@router.post(
    "/job-postings/{posting_id}/media",
    response_model=JobPostingMediaResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_media(
    posting_id: int,
    data: JobPostingMediaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    posting = get_job_posting(db, posting_id)
    if not posting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
    if posting.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job posting")
    return create_media(db, posting_id, data)


# Returns all media of a job posting, sorted by `order`.
@router.get("/job-postings/{posting_id}/media", response_model=list[JobPostingMediaResponse])
def read_media(
    posting_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return list_media(db, posting_id)


# Deletes a media item by id. Only the owner of the parent job posting can delete.
@router.delete("/job-postings/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    media = db.query(JobPostingMedia).filter(JobPostingMedia.id == media_id).first()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    posting = get_job_posting(db, media.jobposting_id)
    if posting is None or posting.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job posting")
    delete_media(db, media_id)
    return None


# ── CrewListings ─────────────────────────────────────────────────────────────

# Creates a new crew listing. Only crew members can create listings; crew_member_id comes from the JWT.
@router.post("/crew-listings", response_model=CrewListingResponse, status_code=status.HTTP_201_CREATED)
def post_crew_listing(
    data: CrewListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    return create_crew_listing(db, data, crew_member_id=current_user.id)


# Lists active crew listings with optional filters (role, location, crew_member, schedule overlap).
# Used by the yacht owner's browse/search page.
@router.get("/crew-listings", response_model=list[CrewListingResponse])
def browse_crew_listings(
    role: CrewRole | None = None,
    location: str | None = None,
    crew_member_id: str | None = None,
    schedule_id: int | None = None,
    skip: int = 0,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return list_crew_listings(
        db,
        role=role,
        location=location,
        crew_member_id=crew_member_id,
        schedule_id=schedule_id,
        active_only=True,
        skip=skip,
        limit=limit,
    )


# Returns every crew listing of the current crew member, including inactive ones (crew dashboard).
@router.get("/crew-listings/mine", response_model=list[CrewListingResponse])
def list_my_crew_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    return list_crew_listings_by_member(db, current_user.id)


# Returns a specific crew listing by id.
@router.get("/crew-listings/{listing_id}", response_model=CrewListingResponse)
def read_crew_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    listing = get_crew_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crew listing not found")
    return listing


# Updates a crew listing. Only the crew member who owns the listing can modify it.
@router.patch("/crew-listings/{listing_id}", response_model=CrewListingResponse)
def patch_crew_listing(
    listing_id: int,
    data: CrewListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    listing = get_crew_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crew listing not found")
    if listing.crew_member_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your crew listing")
    return update_crew_listing(db, listing_id, data)


# Deletes a crew listing. Only the crew member who owns the listing can delete it.
@router.delete("/crew-listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_crew_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    listing = get_crew_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crew listing not found")
    if listing.crew_member_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your crew listing")
    delete_crew_listing(db, listing_id)
    return None


# Match feature: returns job postings with the same role and overlapping availability.
# Only the crew member who owns the listing can call this.
@router.get("/crew-listings/{listing_id}/matches", response_model=list[JobPostingResponse])
def match_postings_for_listing(
    listing_id: int,
    skip: int = 0,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    listing = get_crew_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crew listing not found")
    if listing.crew_member_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your crew listing")
    return match_job_postings_for_crew_listing(db, listing_id, skip=skip, limit=limit)
