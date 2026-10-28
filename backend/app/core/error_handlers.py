import logging
from typing import Any

from fastapi import Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.services.exceptions import ServiceError

try:
    import sentry_sdk
except ImportError:  # pragma: no cover
    sentry_sdk = None

logger = logging.getLogger(__name__)

_VALIDATION_MESSAGE_MAP = {
    "Field required": "این مورد رو پر کن",
    "Input should be a valid string": "ورودی باید متن باشه",
    "Input should be a valid integer": "ورودی باید عدد صحیح باشه",
    "Input should be a valid number": "ورودی باید عدد باشه",
    "Input should be a valid boolean": "ورودی باید درست یا نادرست باشه",
    "Input should be a valid list": "ورودی باید فهرست باشه",
    "Input should be a valid dictionary": "ورودی باید شیء باشه",
    "Input should be a valid email address": "ایمیل درست نیست",
    "String should have at least": "متن کوتاه‌تر از حد لازمه",
    "String should have at most": "متن طولانی‌تر از حده",
    "Value error,": "مقدار ورودی درست نیست:",
}


def _translate_message(message: str) -> str:
    stripped = message.strip()
    for source, target in _VALIDATION_MESSAGE_MAP.items():
        if stripped.startswith(source):
            if source == "Value error,":
                remainder = stripped[len(source) :].strip()
                return f"{target} {remainder}".strip()
            return target
    return message


def _translate_validation_detail(detail: Any) -> Any:
    if isinstance(detail, list):
        return [_translate_validation_detail(item) for item in detail]
    if isinstance(detail, dict):
        translated = dict(detail)
        msg = translated.get("msg")
        if isinstance(msg, str):
            translated["msg"] = _translate_message(msg)
        ctx = translated.get("ctx")
        if ctx is not None:
            translated["ctx"] = _translate_validation_detail(ctx)
        return translated
    return detail


async def service_error_handler(_request: Request, exc: ServiceError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


async def validation_error_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = _translate_validation_detail(jsonable_encoder(exc.errors()))
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": errors},
    )


async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    if sentry_sdk is not None and settings.SENTRY_DSN:
        sentry_sdk.capture_exception(exc)
    if settings.ENVIRONMENT == "development":
        logger.exception("Unhandled error: %s", exc)
    else:
        logger.error("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "مشکلی پیش اومد. چند لحظه بعد دوباره امتحان کن."},
    )
