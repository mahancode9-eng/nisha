from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.customer_portal import OrderComplaint
from app.models.enums import ComplaintStatus
from app.models.order import Order
from app.models.store import Store
from app.models.user import User
from app.schemas.admin_support import (
    AdminComplaintListItem,
    AdminComplaintUpdateRequest,
)
from app.schemas.pagination import (
    PaginatedResponse,
    build_paginated_response,
    paginate_query,
)
from app.services.admin_audit_service import get_latest_note, record_admin_action

router = APIRouter(prefix="/complaints", tags=["admin-complaints"])


def _to_list_item(
    complaint: OrderComplaint,
    order: Order,
    store: Store,
    *,
    last_admin_note: str | None = None,
) -> AdminComplaintListItem:
    return AdminComplaintListItem(
        id=complaint.id,
        order_id=order.id,
        invoice_code=order.invoice_code,
        buyer_name=order.buyer_name,
        store_id=store.id,
        store_name=store.name,
        store_slug=store.slug,
        reason=complaint.reason,
        message=complaint.message,
        status=complaint.status,
        last_admin_note=last_admin_note,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
    )


@router.get("", response_model=PaginatedResponse[AdminComplaintListItem])
def list_complaints(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: ComplaintStatus | None = Query(default=None, alias="status"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> PaginatedResponse[AdminComplaintListItem]:
    count_stmt = select(func.count(OrderComplaint.id))
    if status_filter is not None:
        count_stmt = count_stmt.where(OrderComplaint.status == status_filter)
    total = int(db.scalar(count_stmt) or 0)

    stmt = (
        select(OrderComplaint, Order, Store)
        .join(Order, Order.id == OrderComplaint.order_id)
        .join(Store, Store.id == Order.store_id)
    )
    if status_filter is not None:
        stmt = stmt.where(OrderComplaint.status == status_filter)

    offset, limit = paginate_query(page, page_size)
    rows = db.execute(
        stmt.order_by(OrderComplaint.created_at.desc()).offset(offset).limit(limit)
    ).all()
    items = [
        _to_list_item(
            complaint,
            order,
            store,
            last_admin_note=get_latest_note(db, entity_type="complaint", entity_id=complaint.id),
        )
        for complaint, order, store in rows
    ]
    return build_paginated_response(items, total, page, page_size)


@router.patch("/{complaint_id}", response_model=AdminComplaintListItem)
def update_complaint(
    complaint_id: int,
    payload: AdminComplaintUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminComplaintListItem:
    row = db.execute(
        select(OrderComplaint, Order, Store)
        .join(Order, Order.id == OrderComplaint.order_id)
        .join(Store, Store.id == Order.store_id)
        .where(OrderComplaint.id == complaint_id)
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="شکایت پیدا نشد")
    complaint, order, store = row

    old_status = complaint.status
    complaint.status = payload.status
    record_admin_action(
        db,
        admin=admin,
        entity_type="complaint",
        entity_id=complaint.id,
        action=f"STATUS_{payload.status.value}",
        entity_label=order.invoice_code,
        note=payload.note,
        details={
            "old_status": old_status.value,
            "new_status": payload.status.value,
        },
    )
    db.commit()
    db.refresh(complaint)
    return _to_list_item(
        complaint,
        order,
        store,
        last_admin_note=payload.note or get_latest_note(db, entity_type="complaint", entity_id=complaint.id),
    )
