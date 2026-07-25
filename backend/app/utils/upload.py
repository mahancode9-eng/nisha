from __future__ import annotations

import io
import uuid
from dataclasses import dataclass

from fastapi import UploadFile
from PIL import Image, ImageOps

from app.core.config import settings
from app.core.storage import get_storage
from app.services.exceptions import ServiceError

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm"}
ALLOWED_VIDEO_CONTENT_TYPES = {"video/mp4", "video/webm"}


@dataclass(slots=True)
class UploadedMedia:
    url: str
    thumbnail_url: str | None
    mime_type: str | None
    width: int | None
    height: int | None
    filename: str | None


def _detect_extension_from_magic(header: bytes) -> str | None:
    if header.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if header.startswith(b"GIF87a") or header.startswith(b"GIF89a"):
        return ".gif"
    if len(header) >= 12 and header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        return ".webp"
    return None


def _detect_video_extension_from_magic(header: bytes) -> str | None:
    if len(header) >= 12 and header[4:8] == b"ftyp":
        return ".mp4"
    if header.startswith(b"\x1a\x45\xdf\xa3"):
        return ".webm"
    return None


def _extension_from_filename(filename: str | None) -> str | None:
    if not filename or "." not in filename:
        return None
    ext = "." + filename.rsplit(".", 1)[-1].lower()
    if ext == ".jpeg":
        ext = ".jpg"
    return ext if ext in ALLOWED_IMAGE_EXTENSIONS else None


def _video_extension_from_filename(filename: str | None) -> str | None:
    if not filename or "." not in filename:
        return None
    ext = "." + filename.rsplit(".", 1)[-1].lower()
    return ext if ext in ALLOWED_VIDEO_EXTENSIONS else None


def _extensions_compatible(declared: str, detected: str) -> bool:
    normalize = {".jpg", ".jpeg"}
    if declared in normalize and detected in normalize:
        return True
    return declared == detected


async def _read_upload_bytes(file: UploadFile) -> bytes:
    content = await file.read()
    if not content:
        raise ServiceError("Empty file", status_code=422)
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise ServiceError("File too large", status_code=422)
    return content


def _store_media(
    subdir: str,
    filename: str,
    content: bytes,
    content_type: str | None,
    *,
    private: bool = False,
) -> str:
    key = f"{subdir}/{filename}"
    if private:
        from app.services.private_media_service import save_private_bytes

        return save_private_bytes(key, content)
    return get_storage().save(key, content, content_type=content_type)


def _save_image_thumbnail(
    content: bytes,
    *,
    subdir: str,
    stem: str,
    size: tuple[int, int] = (640, 640),
    private: bool = False,
) -> tuple[str, int | None, int | None]:
    with Image.open(io.BytesIO(content)) as image:
        image = ImageOps.exif_transpose(image)
        width, height = image.size
        thumb = image.copy()
        thumb.thumbnail(size)
        buffer = io.BytesIO()
        thumb.save(buffer, format="WEBP", quality=82, method=6)
    thumb_name = f"{stem}_thumb.webp"
    thumbnail_url = _store_media(
        subdir, thumb_name, buffer.getvalue(), "image/webp", private=private
    )
    return thumbnail_url, width, height


async def save_uploaded_media(
    file: UploadFile,
    *,
    subdir: str,
    image_only: bool = False,
    thumbnail_size: tuple[int, int] = (640, 640),
    private: bool = False,
) -> UploadedMedia:
    if not file.filename:
        raise ServiceError("File is required", status_code=422)

    content = await _read_upload_bytes(file)
    content_type = (file.content_type or "").lower()
    declared_ext = _extension_from_filename(file.filename)
    magic_ext = _detect_extension_from_magic(content[:12])
    is_image = content_type in ALLOWED_IMAGE_CONTENT_TYPES or magic_ext is not None

    if image_only and not is_image:
        raise ServiceError("Only image files are allowed", status_code=422)

    if is_image:
        if content_type and content_type not in ALLOWED_IMAGE_CONTENT_TYPES and magic_ext is None:
            raise ServiceError("Only image files are allowed", status_code=422)

        if declared_ext is None:
            declared_ext = magic_ext or ".jpg"
        elif magic_ext is not None and not _extensions_compatible(declared_ext, magic_ext):
            raise ServiceError("Invalid image file content", status_code=422)

        stored_name = f"{uuid.uuid4().hex}{declared_ext}"
        stem = stored_name.rsplit(".", 1)[0]
        public_url = _store_media(
            subdir,
            stored_name,
            content,
            content_type or file.content_type,
            private=private,
        )

        try:
            thumbnail_url, width, height = _save_image_thumbnail(
                content,
                subdir=subdir,
                stem=stem,
                size=thumbnail_size,
                private=private,
            )
        except Exception as exc:
            if not private:
                get_storage().delete(f"{subdir}/{stored_name}")
            raise ServiceError("Invalid image file content", status_code=422) from exc
        return UploadedMedia(
            url=public_url,
            thumbnail_url=thumbnail_url,
            mime_type=content_type or file.content_type,
            width=width,
            height=height,
            filename=file.filename,
        )

    suffix = declared_ext or ".bin"
    stored_name = f"{uuid.uuid4().hex}{suffix}"
    public_url = _store_media(
        subdir,
        stored_name,
        content,
        content_type or file.content_type,
        private=private,
    )
    return UploadedMedia(
        url=public_url,
        thumbnail_url=None,
        mime_type=content_type or file.content_type,
        width=None,
        height=None,
        filename=file.filename,
    )


async def save_uploaded_video(file: UploadFile, *, subdir: str) -> UploadedMedia:
    """Validate and store a product video (MP4/WebM, max MAX_VIDEO_UPLOAD_SIZE_BYTES)."""
    if not file.filename:
        raise ServiceError("File is required", status_code=422)

    content = await file.read()
    if not content:
        raise ServiceError("Empty file", status_code=422)
    if len(content) > settings.MAX_VIDEO_UPLOAD_SIZE_BYTES:
        raise ServiceError("Video file too large", status_code=422)

    content_type = (file.content_type or "").lower()
    magic_ext = _detect_video_extension_from_magic(content[:16])
    declared_ext = _video_extension_from_filename(file.filename)

    if magic_ext is None and content_type not in ALLOWED_VIDEO_CONTENT_TYPES:
        raise ServiceError("Only MP4 or WebM video files are allowed", status_code=422)

    ext = magic_ext or declared_ext or ".mp4"
    if content_type in ALLOWED_VIDEO_CONTENT_TYPES:
        mime = content_type
    elif ext == ".webm":
        mime = "video/webm"
    else:
        mime = "video/mp4"

    stored_name = f"{uuid.uuid4().hex}{ext}"
    public_url = _store_media(subdir, stored_name, content, mime)
    return UploadedMedia(
        url=public_url,
        thumbnail_url=None,
        mime_type=mime,
        width=None,
        height=None,
        filename=file.filename,
    )


async def save_payment_proof_image(file: UploadFile, order_id: int) -> str:
    media = await save_uploaded_media(
        file,
        subdir=settings.PAYMENT_PROOF_SUBDIR,
        image_only=True,
        private=True,
    )
    return media.url


async def save_subscription_proof_image(file: UploadFile) -> str:
    media = await save_uploaded_media(
        file,
        subdir=settings.SUBSCRIPTION_PROOF_SUBDIR,
        image_only=True,
        private=True,
    )
    return media.url
