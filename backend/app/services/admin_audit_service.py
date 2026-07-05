from __future__ import annotations

import json
from collections.abc import Mapping

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.admin_audit import AdminActionLog
from app.models.user import User
from app.schemas.admin import AdminAuditLogResponse


def record_admin_action(
    db: Session,
    *,
    admin: User | None,
    entity_type: str,
    entity_id: int,
    action: str,
    entity_label: str | None = None,
    note: str | None = None,
    details: Mapping[str, object] | None = None,
) -> AdminActionLog:
    log = AdminActionLog(
        actor_user_id=admin.id if admin else None,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        entity_label=entity_label,
        note=note,
        details_json=json.dumps(details, ensure_ascii=False) if details is not None else None,
    )
    db.add(log)
    return log


def _parse_details(details_json: str | None) -> dict:
    if not details_json:
        return {}
    try:
        parsed = json.loads(details_json)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def to_response(log: AdminActionLog) -> AdminAuditLogResponse:
    actor_name = None
    if log.actor is not None:
        actor_name = log.actor.full_name
    return AdminAuditLogResponse(
        id=log.id,
        entity_type=log.entity_type,
        entity_id=log.entity_id,
        action=log.action,
        entity_label=log.entity_label,
        note=log.note,
        details=_parse_details(log.details_json),
        actor_user_id=log.actor_user_id,
        actor_name=actor_name,
        created_at=log.created_at,
    )


def list_entity_logs(db: Session, *, entity_type: str, entity_id: int) -> list[AdminAuditLogResponse]:
    logs = list(
        db.scalars(
            select(AdminActionLog)
            .options(selectinload(AdminActionLog.actor))
            .where(
                AdminActionLog.entity_type == entity_type,
                AdminActionLog.entity_id == entity_id,
            )
            .order_by(AdminActionLog.created_at.desc())
        ).all()
    )
    return [to_response(log) for log in logs]
