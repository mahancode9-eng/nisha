"""Preserve structured ServiceError fields when converting to HTTPException."""

from __future__ import annotations

from typing import NoReturn

from fastapi import HTTPException

from app.services.exceptions import ServiceError


def raise_service_error(exc: ServiceError) -> NoReturn:
    if exc.code or exc.meta:
        raise HTTPException(
            status_code=exc.status_code,
            detail={
                "message": exc.message,
                "code": exc.code,
                "meta": exc.meta or {},
            },
        ) from exc
    raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
