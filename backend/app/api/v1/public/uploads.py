from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from app.api.deps import require_any_user
from app.core.limiter import limiter
from app.schemas.public import MediaUploadResponse
from app.services.exceptions import ServiceError
from app.utils.upload import save_uploaded_media, save_uploaded_video

router = APIRouter(prefix="/uploads", tags=["public-uploads"])


@router.post("/files", response_model=MediaUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    _auth=Depends(require_any_user),
) -> MediaUploadResponse:
    try:
        media = await save_uploaded_media(file, subdir="media")
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return MediaUploadResponse.model_validate(media)


@router.post("/images", response_model=MediaUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    _auth=Depends(require_any_user),
) -> MediaUploadResponse:
    try:
        media = await save_uploaded_media(file, subdir="media", image_only=True)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return MediaUploadResponse.model_validate(media)


@router.post("/videos", response_model=MediaUploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    _auth=Depends(require_any_user),
) -> MediaUploadResponse:
    try:
        media = await save_uploaded_video(file, subdir="media")
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return MediaUploadResponse.model_validate(media)


@router.post("/guest/files", response_model=MediaUploadResponse)
@limiter.limit("10/minute")
async def guest_upload_file(
    request: Request,
    file: UploadFile = File(...),
) -> MediaUploadResponse:
    """Unauthenticated file upload for guest checkout (rate-limited)."""
    try:
        media = await save_uploaded_media(file, subdir="media")
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return MediaUploadResponse.model_validate(media)


@router.post("/guest/images", response_model=MediaUploadResponse)
@limiter.limit("10/minute")
async def guest_upload_image(
    request: Request,
    file: UploadFile = File(...),
) -> MediaUploadResponse:
    """Unauthenticated image upload for guest checkout (rate-limited)."""
    try:
        media = await save_uploaded_media(file, subdir="media", image_only=True)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return MediaUploadResponse.model_validate(media)
