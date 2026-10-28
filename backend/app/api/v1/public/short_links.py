from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.limiter import limiter
from app.db.session import get_db
from app.services import short_link_service
from app.services.exceptions import ServiceError

router = APIRouter(tags=["public-short-links"])


class ShortLinkResponse(BaseModel):
    code: str
    path: str
    url: str
    qr_url: str


def _absolute_short_url(code: str) -> str:
    base = (settings.FRONTEND_BASE_URL or "").rstrip("/")
    return f"{base}/l/{code}" if base else f"/l/{code}"


@router.post("/short-links/product", response_model=ShortLinkResponse)
@limiter.limit("30/minute")
def create_product_short_link(
    request: Request,
    slug: str = Query(...),
    product_id: int = Query(..., ge=1),
    db: Session = Depends(get_db),
) -> ShortLinkResponse:
    try:
        row = short_link_service.get_or_create_product_link(
            db, slug=slug, product_id=product_id
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    url = _absolute_short_url(row.code)
    return ShortLinkResponse(
        code=row.code,
        path=row.target_path,
        url=url,
        qr_url=f"/api/v1/public/qr.png?data={url}",
    )


@router.post("/short-links/store", response_model=ShortLinkResponse)
@limiter.limit("30/minute")
def create_store_short_link(
    request: Request,
    slug: str = Query(...),
    db: Session = Depends(get_db),
) -> ShortLinkResponse:
    try:
        row = short_link_service.get_or_create_store_link(db, slug=slug)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    url = _absolute_short_url(row.code)
    return ShortLinkResponse(
        code=row.code,
        path=row.target_path,
        url=url,
        qr_url=f"/api/v1/public/qr.png?data={url}",
    )


@router.get("/qr.png")
@limiter.limit("60/minute")
def qr_png(request: Request, data: str = Query(..., min_length=1, max_length=500)) -> Response:
    if not (data.startswith("http://") or data.startswith("https://") or data.startswith("/")):
        raise HTTPException(status_code=422, detail="آدرس QR نامعتبره")
    png = short_link_service.build_qr_png(data)
    return Response(content=png, media_type="image/png")
