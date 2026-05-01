from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status

from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter()

_UPLOAD_ROOT = Path(__file__).resolve().parents[3] / "uploads"

_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
_DOC_TYPES = {"application/pdf"}
_MAX_IMAGE = 5 * 1024 * 1024   # 5 MB
_MAX_DOC = 10 * 1024 * 1024    # 10 MB

_FALLBACK_EXT: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}


def _save(file: UploadFile, kind: str, allowed: set[str], max_bytes: int) -> str:
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: {sorted(allowed)}",
        )
    data = file.file.read()
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {max_bytes // (1024 * 1024)} MB limit",
        )
    ext = Path(file.filename or "").suffix.lower() or _FALLBACK_EXT.get(file.content_type, ".bin")
    filename = f"{uuid.uuid4()}{ext}"
    dest = _UPLOAD_ROOT / kind / filename
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return filename


def _url(request: Request, kind: str, filename: str) -> str:
    return str(request.base_url).rstrip("/") + f"/uploads/{kind}/{filename}"


@router.post("/photo", status_code=status.HTTP_201_CREATED)
def upload_photo(
    request: Request,
    file: UploadFile = File(...),
    _: User = Depends(get_current_active_user),
):
    filename = _save(file, "photo", _IMAGE_TYPES, _MAX_IMAGE)
    return {"url": _url(request, "photo", filename)}


@router.post("/cv", status_code=status.HTTP_201_CREATED)
def upload_cv(
    request: Request,
    file: UploadFile = File(...),
    _: User = Depends(get_current_active_user),
):
    filename = _save(file, "cv", _DOC_TYPES, _MAX_DOC)
    return {"url": _url(request, "cv", filename)}


@router.post("/certification-doc", status_code=status.HTTP_201_CREATED)
def upload_certification_doc(
    request: Request,
    file: UploadFile = File(...),
    _: User = Depends(get_current_active_user),
):
    filename = _save(file, "certification-doc", _DOC_TYPES, _MAX_DOC)
    return {"url": _url(request, "certification-doc", filename)}


@router.post("/posting-media", status_code=status.HTTP_201_CREATED)
def upload_posting_media(
    request: Request,
    file: UploadFile = File(...),
    _: User = Depends(get_current_active_user),
):
    filename = _save(file, "posting-media", _IMAGE_TYPES, _MAX_IMAGE)
    return {"url": _url(request, "posting-media", filename)}
