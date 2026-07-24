from __future__ import annotations

import json

from sqlalchemy.orm import Session

from app.models.platform_setting import PlatformSetting
from app.models.store import Store

GUEST_CHECKOUT_PLATFORM_KEY = "guest_checkout_enabled"
SUBSCRIPTION_CARD_NUMBER_KEY = "subscription_card_number"
SUBSCRIPTION_CARD_OWNER_KEY = "subscription_card_owner"
SUBSCRIPTION_CARD_BANK_KEY = "subscription_card_bank"


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


def get_str(db: Session, key: str, *, default: str = "") -> str:
    row = db.get(PlatformSetting, key)
    if row is None:
        return default
    try:
        value = json.loads(row.value_json)
    except json.JSONDecodeError:
        return default
    if value is None:
        return default
    return str(value)


def set_str(db: Session, key: str, value: str) -> str:
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


def get_subscription_card_settings(db: Session) -> dict[str, str]:
    return {
        "subscription_card_number": get_str(db, SUBSCRIPTION_CARD_NUMBER_KEY, default=""),
        "subscription_card_owner": get_str(db, SUBSCRIPTION_CARD_OWNER_KEY, default=""),
        "subscription_card_bank": get_str(db, SUBSCRIPTION_CARD_BANK_KEY, default=""),
    }


def set_subscription_card_settings(
    db: Session,
    *,
    card_number: str | None = None,
    card_owner: str | None = None,
    card_bank: str | None = None,
) -> dict[str, str]:
    if card_number is not None:
        set_str(db, SUBSCRIPTION_CARD_NUMBER_KEY, card_number)
    if card_owner is not None:
        set_str(db, SUBSCRIPTION_CARD_OWNER_KEY, card_owner)
    if card_bank is not None:
        set_str(db, SUBSCRIPTION_CARD_BANK_KEY, card_bank)
    return get_subscription_card_settings(db)
