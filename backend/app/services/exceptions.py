from typing import Any

from app.core.messages import translate_backend_message


class ServiceError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        *,
        code: str | None = None,
        meta: dict[str, Any] | None = None,
    ) -> None:
        self.message = translate_backend_message(message)
        self.status_code = status_code
        self.code = code
        self.meta = meta or {}
        super().__init__(self.message)
