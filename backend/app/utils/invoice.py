import secrets
import string

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order
from app.services.exceptions import ServiceError

INVOICE_CODE_PREFIX = "NV-"
PASSWORD_ALPHABET = string.ascii_letters + string.digits


def generate_invoice_password(length: int = 12) -> str:
    return "".join(secrets.choice(PASSWORD_ALPHABET) for _ in range(length))


def generate_invoice_code(db: Session, *, max_attempts: int = 10) -> str:
    for _ in range(max_attempts):
        code = f"{INVOICE_CODE_PREFIX}{secrets.token_hex(4).upper()}"
        existing = db.scalar(select(Order.id).where(Order.invoice_code == code))
        if existing is None:
            return code
    raise ServiceError("Could not generate unique invoice code, please retry", status_code=500)
