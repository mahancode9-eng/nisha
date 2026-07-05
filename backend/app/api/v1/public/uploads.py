from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.public import MediaUploadResponse
from app.services.exceptions import ServiceError
from app.utils.upload import save_uploaded_media

router = APIRouter(prefix="/uploads", tags=["public-uploads"])


@router.post("/files", response_model=MediaUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> MediaUploadResponse:
    del db
    try:
        media = await save_uploaded_media(file, subdir="media")
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return MediaUploadResponse.model_validate(media)


@router.post("/images", response_model=MediaUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> MediaUploadResponse:
    del db
    try:
        media = await save_uploaded_media(file, subdir="media", image_only=True)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return MediaUploadResponse.model_validate(media)
