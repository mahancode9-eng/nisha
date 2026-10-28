from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import short_link_service
from app.services.exceptions import ServiceError

router = APIRouter(tags=["public-redirects"])


@router.get("/l/{code}")
def redirect_short_link(code: str, db: Session = Depends(get_db)) -> RedirectResponse:
    try:
        row = short_link_service.resolve_and_hit(db, code)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return RedirectResponse(url=row.target_path, status_code=302)
