"""Monthly SMS quota per store (plan entitlement)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.store import Store
from app.services.entitlement_service import get_seller_entitlements, get_sms_monthly_quota

logger = logging.getLogger(__name__)


def _current_month_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _reset_if_new_month(store: Store) -> None:
    month = _current_month_key()
    if store.sms_quota_month != month:
        store.sms_quota_month = month
        store.sms_sent_count = 0


def can_send_store_sms(db: Session, store: Store) -> bool:
    """True when the store still has SMS capacity this month."""
    entitlements = get_seller_entitlements(db, store.owner_id)
    quota = get_sms_monthly_quota(entitlements)
    if quota == 0:
        return False
    if quota is None:
        return True
    _reset_if_new_month(store)
    return int(store.sms_sent_count or 0) < quota


def consume_store_sms(db: Session, store: Store) -> bool:
    """Reserve one SMS against the store monthly quota. Returns False if blocked."""
    entitlements = get_seller_entitlements(db, store.owner_id)
    quota = get_sms_monthly_quota(entitlements)
    if quota == 0:
        logger.info("SMS skipped for store %s: free plan quota is 0", store.id)
        return False
    if quota is None:
        _reset_if_new_month(store)
        store.sms_sent_count = int(store.sms_sent_count or 0) + 1
        return True
    _reset_if_new_month(store)
    if int(store.sms_sent_count or 0) >= quota:
        logger.info(
            "SMS skipped for store %s: monthly quota %s exhausted",
            store.id,
            quota,
        )
        return False
    store.sms_sent_count = int(store.sms_sent_count or 0) + 1
    return True
