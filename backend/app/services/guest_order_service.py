from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.chat import ConversationDetailResponse, MessageCreate, MessageResponse
from app.schemas.customer_portal import CustomerReviewCreateRequest, CustomerReviewResponse
from app.schemas.public import PublicReviewCreateRequest
from app.models.enums import OrderStatus
from app.models.order import Order, PaymentProof
from app.schemas.guest_order import (
    GuestOrderEdit,
    GuestOrderEditResponse,
    OrderInvoicePreviewResponse,
    OrderTrackItemResponse,
    OrderTrackResponse,
    PaymentProofResponse,
    PaymentProofUploadResponse,
)
from app.schemas.public import PublicPaymentMethod, public_store_profile_from_store
from app.services import chat_service, order_access_service, payment_proof_ocr_service, review_service
from app.services.entitlement_service import get_seller_entitlements
from app.services.exceptions import ServiceError
from app.services.order_item_serializers import track_order_item_response
from app.utils.upload import save_payment_proof_image


def _normalize_last4(value: str | None) -> str | None:
    if value is None:
        return None
    digits = "".join(ch for ch in value if ch.isdigit())
    if not digits:
        return None
    if len(digits) != 4:
        raise ServiceError("چهار رقم آخر کارت باید ۴ رقم باشه", status_code=422)
    return digits


def _find_duplicate_invoice_codes(
    db: Session,
    *,
    store_id: int,
    content_hash: str,
    exclude_order_id: int,
) -> list[str]:
    rows = db.scalars(
        select(Order.invoice_code)
        .join(PaymentProof, PaymentProof.order_id == Order.id)
        .where(
            Order.store_id == store_id,
            PaymentProof.content_hash == content_hash,
            Order.id != exclude_order_id,
        )
        .limit(5)
    ).all()
    return list(rows)


async def upload_payment_proof(
    db: Session,
    invoice_code: str,
    password: str,
    file,
    *,
    payer_card_last4: str | None = None,
    transfer_tracking: str | None = None,
) -> PaymentProofUploadResponse:
    order = order_access_service.authenticate_order(db, invoice_code, password)
    order_access_service.assert_upload_allowed_status(order)

    max_proofs = max(1, int(settings.PAYMENT_PROOF_MAX_PER_ORDER))
    existing_count = len(order.payment_proofs or [])
    if existing_count >= max_proofs:
        raise ServiceError(
            f"بیشتر از {max_proofs} رسید برای این سفارش نمی‌شه آپلود کرد.",
            status_code=422,
        )

    last4 = _normalize_last4(payer_card_last4)
    tracking = (transfer_tracking or "").strip()[:100] or None

    try:
        saved = await save_payment_proof_image(file, order.id)
        proof = PaymentProof(
            order_id=order.id,
            image_url=saved.url,
            content_hash=saved.content_hash,
            payer_card_last4=last4,
            transfer_tracking=tracking,
        )
        ocr_result = payment_proof_ocr_service.analyze_payment_proof(
            order,
            saved.content,
            payer_card_last4=last4,
            transfer_tracking=tracking,
        )
        payment_proof_ocr_service.apply_ocr_result(proof, ocr_result)
        db.add(proof)

        old_status = order.status
        if order.status == OrderStatus.PENDING_PAYMENT:
            order.status = OrderStatus.PAYMENT_UPLOADED
            # Keep a finite hold so abandoned proofs cannot freeze inventory forever.
            order.reservation_expires_at = datetime.now(timezone.utc) + timedelta(
                minutes=settings.PAYMENT_REVIEW_HOLD_MINUTES
            )
            order_access_service.append_status_history(
                db,
                order=order,
                old_status=old_status,
                new_status=OrderStatus.PAYMENT_UPLOADED,
                note="رسید پرداخت ثبت شد",
            )

        duplicate_warning = False
        duplicate_codes: list[str] = []
        entitlements = get_seller_entitlements(db, order.store.owner_id)
        if entitlements.get("duplicate_receipt_warn") and saved.content_hash:
            duplicate_codes = _find_duplicate_invoice_codes(
                db,
                store_id=order.store_id,
                content_hash=saved.content_hash,
                exclude_order_id=order.id,
            )
            duplicate_warning = bool(duplicate_codes)

        db.commit()
        db.refresh(proof)
    except ServiceError:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    return PaymentProofUploadResponse(
        message="رسید پرداخت ثبت شد",
        order_status=order.status,
        proof=PaymentProofResponse.model_validate(proof),
        duplicate_warning=duplicate_warning,
        duplicate_invoice_codes=duplicate_codes,
    )


def preview_invoice(db: Session, invoice_code: str) -> OrderInvoicePreviewResponse:
    """Password-free OG/share preview — no buyer PII beyond store + total."""
    order = order_access_service.get_order_by_invoice_code(db, invoice_code)
    store = order.store
    return OrderInvoicePreviewResponse(
        invoice_code=order.invoice_code,
        status=order.status,
        store_name=store.name if store is not None else "",
        total_amount=order.total_amount,
        store_logo_url=store.logo_url if store is not None else None,
    )


def track_order(db: Session, invoice_code: str, password: str) -> OrderTrackResponse:
    order = order_access_service.authenticate_order(db, invoice_code, password)

    return OrderTrackResponse(
        order_id=order.id,
        invoice_code=order.invoice_code,
        status=order.status,
        buyer_name=order.buyer_name,
        buyer_phone=order.buyer_phone,
        buyer_address=order.buyer_address,
        buyer_note=order.buyer_note,
        subtotal_amount=order.subtotal_amount,
        discount_code=order.discount_code,
        discount_amount=order.discount_amount,
        shipping_amount=order.shipping_amount,
        total_amount=order.total_amount,
        tracking_code=order.tracking_code,
        created_at=order.created_at,
        items=[track_order_item_response(item) for item in order.items],
        payment_proofs=[PaymentProofResponse.model_validate(p) for p in order.payment_proofs],
        store=public_store_profile_from_store(order.store),
        payment_method=PublicPaymentMethod.model_validate(order.payment_method),
    )


_ALLOWED_EDIT_FIELDS = {"buyer_name", "buyer_phone", "buyer_address", "buyer_note"}


def edit_order(db: Session, invoice_code: str, data: GuestOrderEdit) -> GuestOrderEditResponse:
    order = order_access_service.authenticate_order(db, invoice_code, data.invoice_edit_password)
    order_access_service.assert_editable_status(order)

    update_data = data.model_dump(exclude_unset=True, exclude={"invoice_edit_password"})
    for field, value in update_data.items():
        if field not in _ALLOWED_EDIT_FIELDS:
            continue
        setattr(order, field, value.strip() if isinstance(value, str) else value)

    db.commit()
    db.refresh(order)

    return GuestOrderEditResponse(
        message="سفارش به‌روزرسانی شد",
        order_id=order.id,
        status=order.status,
        buyer_name=order.buyer_name,
        buyer_phone=order.buyer_phone,
        buyer_address=order.buyer_address,
        buyer_note=order.buyer_note,
    )


def get_order_chat(
    db: Session,
    invoice_code: str,
    password: str,
) -> ConversationDetailResponse:
    order = order_access_service.authenticate_order(db, invoice_code, password)
    conversation = chat_service.get_or_create_conversation(
        db,
        order_id=order.id,
        customer_id=order.customer_id,
        store_id=order.store_id,
    )
    return chat_service.get_admin_conversation_detail(db, conversation.id)


def send_order_chat_message(
    db: Session,
    invoice_code: str,
    password: str,
    payload: MessageCreate,
) -> MessageResponse:
    order = order_access_service.authenticate_order(db, invoice_code, password)
    return chat_service.send_public_order_message(db, order.id, payload)


def create_order_review(
    db: Session,
    invoice_code: str,
    password: str,
    payload: PublicReviewCreateRequest,
) -> CustomerReviewResponse:
    order = order_access_service.authenticate_order(db, invoice_code, password)
    if payload.order_id != order.id:
        raise ServiceError("سفارش پیدا نشد", status_code=404)
    review_payload = CustomerReviewCreateRequest.model_validate(
        {
            "order_id": order.id,
            "rating": payload.rating,
            "title": payload.title,
            "comment": payload.comment,
            "is_public": payload.is_public,
            "image_urls": payload.image_urls,
        }
    )
    return review_service.create_or_update_review(
        db,
        order=order,
        customer_id=order.customer_id,
        payload=review_payload,
    )
