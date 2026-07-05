import json
import logging
import sys
import time
import uuid
from collections.abc import Callable
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings

logger = logging.getLogger("nisha")

REQUEST_ID_HEADER = "X-Request-ID"

request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)


class JsonFormatter(logging.Formatter):
    """Formats log records as single-line JSON objects for log aggregation."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        request_id = request_id_var.get()
        if request_id:
            payload["request_id"] = request_id
        for key in ("method", "path", "status_code", "duration_ms"):
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


class RequestIdFilter(logging.Filter):
    """Injects the current request id into plain-text log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get() or "-"
        return True


def setup_logging() -> None:
    level_name = getattr(settings, "LOG_LEVEL", "INFO")
    level = getattr(logging, level_name.upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    if settings.LOG_JSON:
        handler.setFormatter(JsonFormatter())
    else:
        handler.addFilter(RequestIdFilter())
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s [%(name)s] [%(request_id)s] %(message)s")
        )

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Assigns a request id to every request and logs method/path/status/duration.

    - Honours an incoming X-Request-ID header (e.g. from a reverse proxy),
      otherwise generates a short unique id.
    - Echoes the id back in the response so clients can report it.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        incoming = request.headers.get(REQUEST_ID_HEADER)
        request_id = (incoming or uuid.uuid4().hex[:16])[:64]
        token = request_id_var.set(request_id)
        try:
            if request.url.path == "/api/v1/health":
                response = await call_next(request)
                response.headers.setdefault(REQUEST_ID_HEADER, request_id)
                return response

            start = time.perf_counter()
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start) * 1000, 1)
            logger.info(
                "%s %s %s %.1fms",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            )
            response.headers.setdefault(REQUEST_ID_HEADER, request_id)
            return response
        finally:
            request_id_var.reset(token)
