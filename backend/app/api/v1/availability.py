from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.crud.availability import (
    create_schedule,
    get_schedule,
    update_schedule,
    delete_schedule,
)
from app.models.user import User
from app.schemas.availability import (
    AvailabilityScheduleCreate,
    AvailabilityScheduleUpdate,
    AvailabilityScheduleResponse,
)

router = APIRouter()


# Creates a new availability schedule. The returned id is used when creating a job posting or crew listing.
@router.post("/", response_model=AvailabilityScheduleResponse, status_code=status.HTTP_201_CREATED)
def post_schedule(
    data: AvailabilityScheduleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return create_schedule(db, data)


# Returns the schedule with the given id.
@router.get("/{schedule_id}", response_model=AvailabilityScheduleResponse)
def read_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    schedule = get_schedule(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return schedule


# Updates the fields of an existing schedule.
@router.patch("/{schedule_id}", response_model=AvailabilityScheduleResponse)
def patch_schedule(
    schedule_id: int,
    data: AvailabilityScheduleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    schedule = update_schedule(db, schedule_id, data)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return schedule


# Deletes a schedule by id.
@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    if not delete_schedule(db, schedule_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return None
