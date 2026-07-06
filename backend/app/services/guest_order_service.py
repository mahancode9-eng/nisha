from sqlalchemy.orm import Session

from app.schemas.chat import ConversationDetailResponse, MessageCreate, MessageResponse
from app.schemas.customer_portal import CustomerReviewCreateRequest, CustomerReviewResponse
from app.schemas.public import PublicReviewCreateRequest
from app.models.enums import OrderStatus
from app.models.order import PaymentProof
from app.schemas.guest_order import (
    GuestOrderEdit,
    GuestOrderEditResponse,
    OrderTrackItemResponse,
    OrderTrackResponse,
    PaymentProofResponse,
    PaymentProofUploadResponse,
)
from app.schemas.public import PublicPaymentMethod, PublicStoreProfile
from app.services import chat_service, order_access_service, review_service
from app.services.exceptions import ServiceError
from app.utils.upload import save_payment_proof_image


async def upload_payment_proof(
    db: Session,
    invoice_code: str,
    password: str,
    file,
) -> PaymentProofUploadResponse:
    order = order_access_service.authenticate_order(db, invoice_code, password)
    order_access_service.assert_upload_allowed_status(order)

    try:
        image_url = await save_payment_proof_image(file, order.id)
        proof = PaymentProof(order_id=order.id, image_url=image_url)
        db.add(proof)

        old_status = order.status
        if order.status == OrderStatus.PENDING_PAYMENT:
            order.status = OrderStatus.PAYMENT_UPLOADED
            order_access_service.append_status_history(
                db,
                order=order,
                old_status=old_status,
                new_status=OrderStatus.PAYMENT_UPLOADED,
                note="رسید پرداخت ثبت شد",
            )

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
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=[
            OrderTrackItemResponse(
                product_id=item.product_id,
                product_title=item.product_title_snapshot,
                variant_name=item.variant_name_snapshot,
                quantity=item.quantity,
                unit_price=item.unit_price_snapshot,
                total_price=item.total_price,
            )
            for item in order.items
        ],
        payment_proofs=[PaymentProofResponse.model_validate(p) for p in order.payment_proofs],
        store=PublicStoreProfile.model_validate(order.store),
        payment_method=PublicPaymentMethod.model_validate(order.payment_method),
    )


def edit_order(db: Session, invoice_code: str, data: GuestOrderEdit) -> GuestOrderEditResponse:
    order = order_access_service.authenticate_order(db, invoice_code, data.invoice_edit_password)
    order_access_service.assert_editable_status(order)

    update_data = data.model_dump(exclude_unset=True, exclude={"invoice_edit_password"})
    for field, value in update_data.items():
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
