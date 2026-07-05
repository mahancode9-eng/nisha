from collections.abc import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds standard security headers to every API response.

    HSTS is only sent in production (it is meaningless and potentially
    harmful on plain-HTTP local development).
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
            "Cross-Origin-Opener-Policy": "same-origin",
        }
        if settings.ENVIRONMENT == "production":
            headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        for key, value in headers.items():
            response.headers.setdefault(key, value)
        return response
