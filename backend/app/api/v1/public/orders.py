from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.chat import ConversationDetailResponse, MessageResponse
from app.schemas.customer_portal import CustomerReviewResponse
from app.schemas.guest_order import (
    GuestOrderEdit,
    GuestOrderEditResponse,
    OrderTrackRequest,
    OrderTrackResponse,
    PaymentProofUploadResponse,
)
from app.schemas.public import (
    OrderChatAuthRequest,
    PublicOrderMessageCreateRequest,
    PublicReviewCreateRequest,
)
from app.services import guest_order_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/orders", tags=["public-orders"])


@router.post("/track", response_model=OrderTrackResponse)
def track_order(payload: OrderTrackRequest, db: Session = Depends(get_db)) -> OrderTrackResponse:
    try:
        return guest_order_service.track_order(
            db,
            payload.invoice_code,
            payload.invoice_edit_password,
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post(
    "/{invoice_code}/upload-payment-proof",
    response_model=PaymentProofUploadResponse,
)
async def upload_payment_proof(
    invoice_code: str,
    invoice_edit_password: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> PaymentProofUploadResponse:
    try:
        return await guest_order_service.upload_payment_proof(
            db,
            invoice_code,
            invoice_edit_password,
            file,
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.patch("/{invoice_code}/edit", response_model=GuestOrderEditResponse)
def edit_order(
    invoice_code: str,
    payload: GuestOrderEdit,
    db: Session = Depends(get_db),
) -> GuestOrderEditResponse:
    try:
        return guest_order_service.edit_order(db, invoice_code, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/{invoice_code}/chat", response_model=ConversationDetailResponse)
def open_chat(
    invoice_code: str,
    payload: OrderChatAuthRequest,
    db: Session = Depends(get_db),
) -> ConversationDetailResponse:
    try:
        return guest_order_service.get_order_chat(db, invoice_code, payload.invoice_edit_password)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/{invoice_code}/chat/messages", response_model=MessageResponse)
def send_chat_message(
    invoice_code: str,
    payload: PublicOrderMessageCreateRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    try:
        return guest_order_service.send_order_chat_message(db, invoice_code, payload.invoice_edit_password, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/{invoice_code}/reviews", response_model=CustomerReviewResponse)
def create_public_review(
    invoice_code: str,
    payload: PublicReviewCreateRequest,
    db: Session = Depends(get_db),
) -> CustomerReviewResponse:
    try:
        return guest_order_service.create_order_review(db, invoice_code, payload.invoice_edit_password, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
