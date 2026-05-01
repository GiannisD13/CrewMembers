from sqlalchemy.orm import Session

from app.models.user import User, YachtOwner, CrewMember
from app.schemas.user import UserCreate, UserUpdate, YachtOwnerUpdate, CrewMemberCreate, CrewMemberUpdate
from app.core.security import verify_password


# ── User ─────────────────────────────────────────────────────────────────────

def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.strip().lower()).first()


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def delete_user(db: Session, user_id: str) -> bool:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True


def set_admin(db: Session, user_id: str, is_admin: bool) -> User | None:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    db_user.is_admin = is_admin
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: str, data: UserUpdate) -> User | None:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None

    update_data = data.model_dump(exclude_unset=True)

    # Only check uniqueness when a non-null phone is actually being set.
    # Comparing `phone == None` would match all phone-less users → spurious 409.
    if update_data.get("phone") is not None:
        existing = db.query(User).filter(User.phone == update_data["phone"]).first()
        if existing and existing.id != user_id:
            raise ValueError(f"Phone '{update_data['phone']}' already in use")

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user


# ── YachtOwner ────────────────────────────────────────────────────────────────

def create_owner(db: Session, user_data: UserCreate, hashed_password: str) -> YachtOwner:
    db_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        account_type=user_data.account_type,
    )
    db.add(db_user)
    db.flush()  # gets the generated id without committing

    db_owner = YachtOwner(user_id=db_user.id)
    db.add(db_owner)
    db.commit()
    db.refresh(db_owner)
    return db_owner


def get_owner(db: Session, user_id: str) -> YachtOwner | None:
    return db.query(YachtOwner).filter(YachtOwner.user_id == user_id).first()


def update_owner(db: Session, user_id: str, data: YachtOwnerUpdate) -> YachtOwner | None:
    db_owner = get_owner(db, user_id)
    if not db_owner:
        return None

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_owner, key, value)

    db.commit()
    db.refresh(db_owner)
    return db_owner


# ── CrewMember ────────────────────────────────────────────────────────────────

def create_crew_member(db: Session, user_data: UserCreate, crew_data: CrewMemberCreate, hashed_password: str) -> CrewMember:
    db_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        account_type=user_data.account_type,
    )
    db.add(db_user)
    db.flush()

    db_crew = CrewMember(
        user_id=db_user.id,
        roles=[r.value for r in crew_data.roles],
        experience_years=crew_data.experience_years,
        location=crew_data.location,
        nationality=crew_data.nationality,
        bio=crew_data.bio,
        looking_for_job=crew_data.looking_for_job,
    )
    db.add(db_crew)
    db.commit()
    db.refresh(db_crew)
    return db_crew


def get_crew_member(db: Session, user_id: str) -> CrewMember | None:
    return db.query(CrewMember).filter(CrewMember.user_id == user_id).first()


def update_crew_member(db: Session, user_id: str, data: CrewMemberUpdate) -> CrewMember | None:
    db_crew = get_crew_member(db, user_id)
    if not db_crew:
        return None

    update_data = data.model_dump(exclude_unset=True)

    if "roles" in update_data:
        if update_data["roles"] is None:
            del update_data["roles"]  # roles is NOT NULL, skip
        else:
            update_data["roles"] = [r.value for r in data.roles]

    for key, value in update_data.items():
        setattr(db_crew, key, value)

    db.commit()
    db.refresh(db_crew)
    return db_crew
