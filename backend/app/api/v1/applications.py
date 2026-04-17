from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user, require_crew_member, require_owner
from app.crud.application import (
    create_crew_inquiry,
    create_job_application,
    delete_crew_inquiry,
    delete_job_application,
    get_crew_inquiry,
    get_job_application,
    list_applications_by_crew_member,
    list_applications_for_job_posting,
    list_applications_for_owner,
    list_inquiries_by_owner,
    list_inquiries_for_crew_listing,
    list_inquiries_for_crew_member,
    set_application_status,
    set_inquiry_status,
)
from app.crud.listing import get_crew_listing, get_job_posting
from app.crud.messages import create_message, get_or_create_conversation
from app.models.application import ApplicationStatus
from app.models.user import User
from app.schemas.application import (
    CrewInquiryAccept,
    CrewInquiryAcceptResponse,
    CrewInquiryCreate,
    CrewInquiryResponse,
    JobApplicationAccept,
    JobApplicationAcceptResponse,
    JobApplicationCreate,
    JobApplicationResponse,
)

router = APIRouter()


# ── JobApplications (crew → owner's job posting) ─────────────────────────────

# Crew member applies to a job posting. The crewmember_id comes from the JWT.
# Returns 409 if the crew member has already applied to the same posting.
@router.post("/job-applications", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
def post_job_application(
    data: JobApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    if not get_job_posting(db, data.jobposting_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
    try:
        return create_job_application(db, data, crewmember_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


# Returns all applications submitted by the current crew member (their "sent" inbox).
@router.get("/job-applications/mine", response_model=list[JobApplicationResponse])
def list_my_applications(
    status_filter: ApplicationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    return list_applications_by_crew_member(db, current_user.id, status=status_filter)


# Returns every application across ALL job postings of the current owner (their "received" inbox).
@router.get("/job-applications/received", response_model=list[JobApplicationResponse])
def list_received_applications(
    status_filter: ApplicationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    return list_applications_for_owner(db, current_user.id, status=status_filter)


# Returns applications for a specific job posting. Only the owner of that posting can view them.
@router.get(
    "/job-postings/{posting_id}/applications",
    response_model=list[JobApplicationResponse],
)
def list_applications_for_posting(
    posting_id: int,
    status_filter: ApplicationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    posting = get_job_posting(db, posting_id)
    if not posting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
    if posting.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job posting")
    return list_applications_for_job_posting(db, posting_id, status=status_filter)


# Returns a single application. Accessible to either the crew member who sent it or the owner who received it.
@router.get("/job-applications/{application_id}", response_model=JobApplicationResponse)
def read_job_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    application = get_job_application(db, application_id)
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if application.crewmember_id != current_user.id:
        posting = get_job_posting(db, application.jobposting_id)
        if posting is None or posting.owner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    return application


# Owner accepts a pending application. Sets status to accepted, creates a conversation
# between the owner and the crew member, and (optionally) posts the owner's first message.
# Returns both the updated application and the conversation so the client can navigate to it.
@router.post("/job-applications/{application_id}/accept", response_model=JobApplicationAcceptResponse)
def accept_job_application(
    application_id: int,
    data: JobApplicationAccept,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    application = get_job_application(db, application_id)
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    posting = get_job_posting(db, application.jobposting_id)
    if posting is None or posting.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job posting")
    if application.status != ApplicationStatus.pending:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Application is not pending")

    updated = set_application_status(db, application_id, ApplicationStatus.accepted)
    conversation = get_or_create_conversation(
        db,
        owner_id=current_user.id,
        crew_member_id=application.crewmember_id,
    )
    if data.message and data.message.strip():
        create_message(db, conversation.id, sender_id=current_user.id, content=data.message)
    return JobApplicationAcceptResponse(application=updated, conversation=conversation)


# Owner rejects a pending application. No conversation is created.
@router.post("/job-applications/{application_id}/reject", response_model=JobApplicationResponse)
def reject_job_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    application = get_job_application(db, application_id)
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    posting = get_job_posting(db, application.jobposting_id)
    if posting is None or posting.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job posting")
    if application.status != ApplicationStatus.pending:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Application is not pending")
    return set_application_status(db, application_id, ApplicationStatus.rejected)


# Crew member withdraws (deletes) their own application.
@router.delete("/job-applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_job_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    application = get_job_application(db, application_id)
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if application.crewmember_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your application")
    delete_job_application(db, application_id)
    return None


# ── CrewInquiries (owner → crew listing) ─────────────────────────────────────

# Owner inquires about a crew listing. The owner_id comes from the JWT.
# Returns 409 if the owner has already inquired about the same listing.
@router.post("/crew-inquiries", response_model=CrewInquiryResponse, status_code=status.HTTP_201_CREATED)
def post_crew_inquiry(
    data: CrewInquiryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    if not get_crew_listing(db, data.crew_listing_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crew listing not found")
    try:
        return create_crew_inquiry(db, data, owner_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


# Returns all inquiries sent by the current owner (their "sent" inbox).
@router.get("/crew-inquiries/mine", response_model=list[CrewInquiryResponse])
def list_my_inquiries(
    status_filter: ApplicationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    return list_inquiries_by_owner(db, current_user.id, status=status_filter)


# Returns every inquiry across ALL crew listings of the current crew member (their "received" inbox).
@router.get("/crew-inquiries/received", response_model=list[CrewInquiryResponse])
def list_received_inquiries(
    status_filter: ApplicationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    return list_inquiries_for_crew_member(db, current_user.id, status=status_filter)


# Returns inquiries for a specific crew listing. Only the crew member who owns the listing can view them.
@router.get(
    "/crew-listings/{listing_id}/inquiries",
    response_model=list[CrewInquiryResponse],
)
def list_inquiries_for_listing(
    listing_id: int,
    status_filter: ApplicationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    listing = get_crew_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crew listing not found")
    if listing.crew_member_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your crew listing")
    return list_inquiries_for_crew_listing(db, listing_id, status=status_filter)


# Returns a single inquiry. Accessible to either the owner who sent it or the crew member who received it.
@router.get("/crew-inquiries/{inquiry_id}", response_model=CrewInquiryResponse)
def read_crew_inquiry(
    inquiry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    inquiry = get_crew_inquiry(db, inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    if inquiry.owner_id != current_user.id:
        listing = get_crew_listing(db, inquiry.crew_listing_id)
        if listing is None or listing.crew_member_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    return inquiry


# Crew member accepts a pending inquiry. Sets status to accepted, creates a conversation
# between the inquiring owner and the current crew member, and (optionally) posts the
# crew member's first message. Returns both the updated inquiry and the conversation.
@router.post("/crew-inquiries/{inquiry_id}/accept", response_model=CrewInquiryAcceptResponse)
def accept_crew_inquiry(
    inquiry_id: int,
    data: CrewInquiryAccept,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    inquiry = get_crew_inquiry(db, inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    listing = get_crew_listing(db, inquiry.crew_listing_id)
    if listing is None or listing.crew_member_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your crew listing")
    if inquiry.status != ApplicationStatus.pending:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Inquiry is not pending")

    updated = set_inquiry_status(db, inquiry_id, ApplicationStatus.accepted)
    conversation = get_or_create_conversation(
        db,
        owner_id=inquiry.owner_id,
        crew_member_id=current_user.id,
    )
    if data.message and data.message.strip():
        create_message(db, conversation.id, sender_id=current_user.id, content=data.message)
    return CrewInquiryAcceptResponse(inquiry=updated, conversation=conversation)


# Crew member rejects a pending inquiry. No conversation is created.
@router.post("/crew-inquiries/{inquiry_id}/reject", response_model=CrewInquiryResponse)
def reject_crew_inquiry(
    inquiry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_crew_member),
):
    inquiry = get_crew_inquiry(db, inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    listing = get_crew_listing(db, inquiry.crew_listing_id)
    if listing is None or listing.crew_member_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your crew listing")
    if inquiry.status != ApplicationStatus.pending:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Inquiry is not pending")
    return set_inquiry_status(db, inquiry_id, ApplicationStatus.rejected)


# Owner withdraws (deletes) their own inquiry.
@router.delete("/crew-inquiries/{inquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_crew_inquiry(
    inquiry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    inquiry = get_crew_inquiry(db, inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    if inquiry.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your inquiry")
    delete_crew_inquiry(db, inquiry_id)
    return None
