from __future__ import annotations

import json

from sqlalchemy.orm import Session

from app.models.platform_setting import PlatformSetting
from app.models.store import Store

GUEST_CHECKOUT_PLATFORM_KEY = "guest_checkout_enabled"


def get_bool(db: Session, key: str, *, default: bool = False) -> bool:
    row = db.get(PlatformSetting, key)
    if row is None:
        return default
    try:
        value = json.loads(row.value_json)
    except json.JSONDecodeError:
        return default
    return bool(value)


def set_bool(db: Session, key: str, value: bool) -> bool:
    row = db.get(PlatformSetting, key)
    payload = json.dumps(value)
    if row is None:
        db.add(PlatformSetting(key=key, value_json=payload))
    else:
        row.value_json = payload
    db.commit()
    return value


def is_platform_guest_checkout_enabled(db: Session) -> bool:
    return get_bool(db, GUEST_CHECKOUT_PLATFORM_KEY, default=True)


def is_guest_checkout_enabled(db: Session, store: Store) -> bool:
    return is_platform_guest_checkout_enabled(db) and store.guest_checkout_enabled
