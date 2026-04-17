from sqlalchemy.orm import Session

from app.models.availability import AvailabilitySchedule
from app.schemas.availability import AvailabilityScheduleCreate, AvailabilityScheduleUpdate


# Creates a new availability schedule and returns it.
def create_schedule(db: Session, data: AvailabilityScheduleCreate) -> AvailabilitySchedule:
    db_schedule = AvailabilitySchedule(
        availability_type=data.availability_type,
        start_date=data.start_date,
        end_date=data.end_date,
        recurring_days=data.recurring_days,
        one_off_dates=data.one_off_dates,
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


# Returns the schedule with the given id, or None if it does not exist.
def get_schedule(db: Session, schedule_id: int) -> AvailabilitySchedule | None:
    return db.query(AvailabilitySchedule).filter(AvailabilitySchedule.id == schedule_id).first()


# Updates the schedule fields that were set in `data`. Returns None if not found.
def update_schedule(db: Session, schedule_id: int, data: AvailabilityScheduleUpdate) -> AvailabilitySchedule | None:
    db_schedule = get_schedule(db, schedule_id)
    if not db_schedule:
        return None

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_schedule, key, value)

    db.commit()
    db.refresh(db_schedule)
    return db_schedule


# Deletes the schedule with the given id. Returns True if deleted, False if not found.
def delete_schedule(db: Session, schedule_id: int) -> bool:
    db_schedule = get_schedule(db, schedule_id)
    if not db_schedule:
        return False
    db.delete(db_schedule)
    db.commit()
    return True
