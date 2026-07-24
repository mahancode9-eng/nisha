from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.db.session import get_db
from app.models.store import Store
from app.services import seller_export_service

router = APIRouter(prefix="/exports", tags=["seller-exports"])


@router.get("/products.csv")
def export_products(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> Response:
    content = seller_export_service.export_products_csv(db, store)
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="products.csv"'},
    )


@router.get("/orders.csv")
def export_orders(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> Response:
    content = seller_export_service.export_orders_csv(db, store)
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="orders.csv"'},
    )
