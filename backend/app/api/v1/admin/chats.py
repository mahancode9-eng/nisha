from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import ConversationDetailResponse, ConversationListItem
from app.services import chat_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/chats", tags=["admin-chats"])


@router.get("", response_model=list[ConversationListItem])
def list_chats(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[ConversationListItem]:
    return chat_service.list_admin_conversations(db)


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
def get_chat(
    conversation_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ConversationDetailResponse:
    try:
        return chat_service.get_admin_conversation_detail(db, conversation_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
