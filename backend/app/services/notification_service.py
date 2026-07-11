"""Multi-channel notification service (SMS + email).

Design:
- `enqueue_sms` / `enqueue_email` write a row to the `notification_outbox`
  table inside the caller's transaction (transactional outbox pattern).
- A background worker (started from the FastAPI lifespan) polls the outbox
  and delivers due notifications with exponential-backoff retries.
- Delivery goes through pluggable providers selected via settings:
  SMS_PROVIDER = console | kavenegar, EMAIL_PROVIDER = console | smtp | resend.
  The `console` providers just log, so development and CI need no credentials.
"""

from __future__ import annotations

import asyncio
import json
import logging
import smtplib
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Optional, Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import NotificationOutbox
from app.services.email_html import (
    password_recovery_html,
    simple_notification_html,
    verification_email_html,
)

logger = logging.getLogger(__name__)

CHANNEL_SMS = "sms"
CHANNEL_EMAIL = "email"

STATUS_PENDING = "pending"
STATUS_SENT = "sent"
STATUS_FAILED = "failed"

RESEND_MAX_SEND_RETRIES = 5
RESEND_INITIAL_BACKOFF_SECONDS = 1
RESEND_PERMANENT_HTTP_CODES = frozenset({400, 401, 403, 409, 422})
RESEND_RETRYABLE_HTTP_CODES = frozenset({429, 500})


class PermanentEmailDeliveryError(RuntimeError):
    """Email delivery failed with an error that must not be retried."""


@dataclass(frozen=True, slots=True)
class PreparedEmail:
    row: NotificationOutbox
    to: str
    subject: str
    body: str
    html: str | None = None

    @property
    def idempotency_key(self) -> str:
        return f"{self.row.template}/{self.row.id}"


@dataclass(frozen=True, slots=True)
class NotificationTemplate:
    sms_text: str
    email_subject: str
    email_body: str
    html_style: str | None = None  # verification | recovery | simple


# Persian templates. Placeholders are filled from the enqueued payload with
# str.format, so a missing key is treated as a delivery error (and retried
# only until max attempts).
TEMPLATES: dict[str, NotificationTemplate] = {
    "order_placed_buyer": NotificationTemplate(
        sms_text=(
            "نیشا: سفارش {invoice_code} ثبت شد و در انتظار تأیید پرداخت است."
        ),
        email_subject="ثبت سفارش {invoice_code}",
        email_body=(
            "سفارش شما با کد {invoice_code} در فروشگاه {store_name} ثبت شد "
            "و پس از تأیید پرداخت پردازش می‌شود."
        ),
        html_style="simple",
    ),
    "order_placed_seller": NotificationTemplate(
        sms_text=(
            "نیشا: سفارش جدید {invoice_code} در فروشگاه {store_name} ثبت شد."
        ),
        email_subject="سفارش جدید {invoice_code}",
        email_body=(
            "سفارش جدیدی با کد {invoice_code} در فروشگاه {store_name} ثبت شد. "
            "برای بررسی به پنل فروشنده مراجعه کنید."
        ),
        html_style="simple",
    ),
    "payment_uploaded_seller": NotificationTemplate(
        sms_text=(
            "نیشا: رسید پرداخت سفارش {invoice_code} ثبت شد. لطفا بررسی و تأیید کنید."
        ),
        email_subject="رسید پرداخت سفارش {invoice_code}",
        email_body=(
            "برای سفارش {invoice_code} در فروشگاه {store_name} رسید پرداخت جدیدی ثبت شد. "
            "برای بررسی و تأیید به پنل فروشنده مراجعه کنید."
        ),
        html_style="simple",
    ),
    "order_status_changed": NotificationTemplate(
        sms_text=(
            "نیشا: وضعیت سفارش {invoice_code} به «{status_label}» تغییر کرد."
        ),
        email_subject="تغییر وضعیت سفارش {invoice_code}",
        email_body=(
            "وضعیت سفارش {invoice_code} در فروشگاه {store_name} "
            "به «{status_label}» تغییر کرد."
        ),
        html_style="simple",
    ),
    "test_message": NotificationTemplate(
        sms_text="نیشا: پیام آزمایشی {code}",
        email_subject="پیام آزمایشی {code}",
        email_body="این یک پیام آزمایشی است: {code}",
        html_style="simple",
    ),
    "email_verification": NotificationTemplate(
        sms_text="",
        email_subject="تأیید ایمیل نیشا",
        email_body=(
            "سلام {full_name}\n\n"
            "برای تأیید ایمیل خود روی لینک زیر کلیک کنید:\n"
            "{verify_link}\n\n"
            "اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید."
        ),
        html_style="verification",
    ),
    "password_recovery_code": NotificationTemplate(
        sms_text="نیشا: کد بازیابی رمز: {code}",
        email_subject="کد بازیابی رمز عبور",
        email_body="کد بازیابی رمز عبور شما: {code}",
        html_style="recovery",
    ),
}


class SmsProvider(Protocol):
    def send(self, to: str, text: str) -> None: ...


class EmailProvider(Protocol):
    def send(
        self,
        to: str,
        subject: str,
        body: str,
        *,
        html: str | None = None,
        idempotency_key: str | None = None,
    ) -> None: ...


class ConsoleSmsProvider:
    """Logs the SMS instead of sending it. Default in development/CI."""

    def send(self, to: str, text: str) -> None:
        logger.info("SMS (console provider) to %s: %s", to, text)


class KavenegarSmsProvider:
    """Sends SMS through the Kavenegar REST API."""

    def send(self, to: str, text: str) -> None:
        import httpx

        if not settings.KAVENEGAR_API_KEY:
            raise RuntimeError("KAVENEGAR_API_KEY is not configured")
        url = (
            "https://api.kavenegar.com/v1/"
            + settings.KAVENEGAR_API_KEY
            + "/sms/send.json"
        )
        data = {"receptor": to, "message": text}
        if settings.SMS_SENDER:
            data["sender"] = settings.SMS_SENDER
        response = httpx.post(url, data=data, timeout=15)
        response.raise_for_status()


class ConsoleEmailProvider:
    """Logs the email instead of sending it. Default in development/CI."""

    def send(
        self,
        to: str,
        subject: str,
        body: str,
        *,
        html: str | None = None,
        idempotency_key: str | None = None,
    ) -> None:
        if html:
            logger.info(
                "Email (console provider) to %s [%s] text+html (%d bytes html)",
                to,
                subject,
                len(html),
            )
        else:
            logger.info("Email (console provider) to %s [%s]: %s", to, subject, body)


class SmtpEmailProvider:
    """Sends email through a standard SMTP server."""

    def send(
        self,
        to: str,
        subject: str,
        body: str,
        *,
        html: str | None = None,
        idempotency_key: str | None = None,
    ) -> None:
        if not settings.SMTP_HOST:
            raise RuntimeError("SMTP_HOST is not configured")
        from_addr = settings.EMAIL_FROM or settings.SMTP_USERNAME
        if html:
            message = MIMEMultipart("alternative")
            message.attach(MIMEText(body, "plain", "utf-8"))
            message.attach(MIMEText(html, "html", "utf-8"))
        else:
            message = MIMEText(body, "plain", "utf-8")
        message["Subject"] = subject
        message["From"] = from_addr
        message["To"] = to
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)


class ResendEmailProvider:
    """Sends email through the Resend API with idempotency keys and retries."""

    def send(
        self,
        to: str,
        subject: str,
        body: str,
        *,
        html: str | None = None,
        idempotency_key: str | None = None,
    ) -> None:
        self._send_single(
            self._build_params(to=to, subject=subject, body=body, html=html),
            idempotency_key=idempotency_key,
        )

    def send_batch(self, emails: list[PreparedEmail]) -> None:
        if not emails:
            return
        if len(emails) == 1:
            email = emails[0]
            self.send(
                email.to,
                email.subject,
                email.body,
                html=email.html,
                idempotency_key=email.idempotency_key,
            )
            return

        import resend

        self._configure_api_key()
        params = [
            self._build_params(
                to=email.to, subject=email.subject, body=email.body, html=email.html
            )
            for email in emails
        ]
        batch_id = f"{emails[0].row.id}-{emails[-1].row.id}"
        self._send_batch_with_retries(
            resend,
            params,
            idempotency_key=f"batch-notification-outbox/{batch_id}",
        )

    @staticmethod
    def _configure_api_key() -> None:
        import resend

        if not settings.RESEND_API_KEY:
            raise RuntimeError("RESEND_API_KEY is not configured")
        resend.api_key = settings.RESEND_API_KEY

    @staticmethod
    def _build_params(
        *, to: str, subject: str, body: str, html: str | None = None
    ) -> dict[str, Any]:
        if not settings.EMAIL_FROM:
            raise RuntimeError("EMAIL_FROM is not configured")
        params: dict[str, Any] = {
            "from": settings.EMAIL_FROM,
            "to": to,
            "subject": subject,
            "text": body,
        }
        if html:
            params["html"] = html
        return params

    def _send_single(
        self, params: dict[str, Any], *, idempotency_key: str | None
    ) -> None:
        import resend

        self._configure_api_key()
        options = {"idempotency_key": idempotency_key} if idempotency_key else None
        self._call_with_retries(
            lambda: resend.Emails.send(params, options=options),
            operation_name="send",
        )

    def _send_batch_with_retries(
        self,
        resend_module: Any,
        params: list[dict[str, Any]],
        *,
        idempotency_key: str,
    ) -> None:
        options = {"idempotency_key": idempotency_key}
        self._call_with_retries(
            lambda: resend_module.Batch.send(params, options=options),
            operation_name="batch send",
        )

    def _call_with_retries(self, action: Any, *, operation_name: str) -> None:
        from resend.exceptions import ResendError

        last_error: Exception | None = None
        for attempt in range(RESEND_MAX_SEND_RETRIES):
            try:
                action()
                return
            except ResendError as exc:
                last_error = exc
                status_code = _resend_status_code(exc)
                if status_code in RESEND_PERMANENT_HTTP_CODES:
                    raise PermanentEmailDeliveryError(str(exc.message)) from exc
                if status_code not in RESEND_RETRYABLE_HTTP_CODES:
                    raise RuntimeError(str(exc.message)) from exc
                if attempt >= RESEND_MAX_SEND_RETRIES - 1:
                    raise RuntimeError(str(exc.message)) from exc
                delay = RESEND_INITIAL_BACKOFF_SECONDS * (2**attempt)
                logger.warning(
                    "Resend %s failed (HTTP %s), retrying in %ss: %s",
                    operation_name,
                    status_code,
                    delay,
                    exc.message,
                )
                time.sleep(delay)
        if last_error is not None:
            raise RuntimeError(str(last_error)) from last_error


def _resend_status_code(exc: Any) -> int:
    code = exc.code
    if isinstance(code, int):
        return code
    if isinstance(code, str) and code.isdigit():
        return int(code)
    return 0


def get_sms_provider() -> SmsProvider:
    if settings.SMS_PROVIDER == "kavenegar":
        return KavenegarSmsProvider()
    return ConsoleSmsProvider()


def get_email_provider() -> EmailProvider:
    if settings.EMAIL_PROVIDER == "smtp":
        return SmtpEmailProvider()
    if settings.EMAIL_PROVIDER == "resend":
        return ResendEmailProvider()
    return ConsoleEmailProvider()


def _enqueue(
    db: Session,
    *,
    channel: str,
    recipient: str,
    template: str,
    payload: Optional[dict] = None,
) -> NotificationOutbox:
    if template not in TEMPLATES:
        raise ValueError("Unknown notification template: " + template)
    row = NotificationOutbox(
        channel=channel,
        recipient=recipient,
        template=template,
        payload_json=json.dumps(payload or {}, ensure_ascii=False),
        status=STATUS_PENDING,
        attempts=0,
        next_attempt_at=datetime.now(timezone.utc),
    )
    db.add(row)
    db.flush()
    return row


def enqueue_sms(
    db: Session, phone: str, template: str, payload: Optional[dict] = None
) -> NotificationOutbox:
    return _enqueue(
        db, channel=CHANNEL_SMS, recipient=phone, template=template, payload=payload
    )


def enqueue_email(
    db: Session, email: str, template: str, payload: Optional[dict] = None
) -> NotificationOutbox:
    return _enqueue(
        db, channel=CHANNEL_EMAIL, recipient=email, template=template, payload=payload
    )


def _build_email_html(
    template: NotificationTemplate, *, payload: dict, subject: str, body: str
) -> str | None:
    style = template.html_style
    if style == "verification":
        return verification_email_html(
            full_name=str(payload["full_name"]),
            verify_link=str(payload["verify_link"]),
        )
    if style == "recovery":
        return password_recovery_html(code=str(payload["code"]))
    if style == "simple":
        return simple_notification_html(heading=subject, message=body)
    return None


def _prepare_email(row: NotificationOutbox) -> PreparedEmail:
    template = TEMPLATES.get(row.template)
    if template is None:
        raise RuntimeError("Unknown template: " + row.template)
    payload = json.loads(row.payload_json or "{}")
    subject = template.email_subject.format(**payload)
    body = template.email_body.format(**payload)
    html = _build_email_html(template, payload=payload, subject=subject, body=body)
    return PreparedEmail(
        row=row,
        to=row.recipient,
        subject=subject,
        body=body,
        html=html,
    )


def _mark_notification_sent(row: NotificationOutbox, now: datetime) -> None:
    row.attempts += 1
    row.status = STATUS_SENT
    row.sent_at = now
    row.last_error = None


def _mark_notification_permanently_failed(
    row: NotificationOutbox, exc: Exception, *, now: datetime
) -> None:
    row.attempts += 1
    row.status = STATUS_FAILED
    row.last_error = str(exc)[:500]
    logger.error(
        "Notification %s permanently failed: %s",
        row.id,
        row.last_error,
    )


def _mark_notification_retryable_failure(
    row: NotificationOutbox, exc: Exception, *, now: datetime
) -> None:
    row.attempts += 1
    row.last_error = str(exc)[:500]
    if row.attempts >= settings.NOTIFY_MAX_ATTEMPTS:
        row.status = STATUS_FAILED
        logger.error(
            "Notification %s permanently failed after %s attempts: %s",
            row.id,
            row.attempts,
            row.last_error,
        )
    else:
        backoff_seconds = 60 * (4 ** (row.attempts - 1))
        row.next_attempt_at = now + timedelta(seconds=backoff_seconds)
        logger.warning(
            "Notification %s failed (attempt %s), retrying in %ss: %s",
            row.id,
            row.attempts,
            backoff_seconds,
            row.last_error,
        )


def _deliver_prepared_emails(
    emails: list[PreparedEmail],
    *,
    email_provider: EmailProvider,
    now: datetime,
) -> int:
    if not emails:
        return 0

    delivered = 0
    if isinstance(email_provider, ResendEmailProvider) and len(emails) >= 2:
        try:
            email_provider.send_batch(emails)
        except PermanentEmailDeliveryError as exc:
            for email in emails:
                _mark_notification_permanently_failed(email.row, exc, now=now)
            return 0
        except Exception as exc:  # noqa: BLE001 - batch failure retries all rows
            for email in emails:
                _mark_notification_retryable_failure(email.row, exc, now=now)
            return 0
        for email in emails:
            _mark_notification_sent(email.row, now)
            delivered += 1
        return delivered

    for email in emails:
        try:
            email_provider.send(
                email.to,
                email.subject,
                email.body,
                html=email.html,
                idempotency_key=email.idempotency_key,
            )
        except PermanentEmailDeliveryError as exc:
            _mark_notification_permanently_failed(email.row, exc, now=now)
        except Exception as exc:  # noqa: BLE001 - provider errors are retried
            _mark_notification_retryable_failure(email.row, exc, now=now)
        else:
            _mark_notification_sent(email.row, now)
            delivered += 1
    return delivered


def deliver_pending(
    db: Session,
    *,
    limit: int = 20,
    notification_ids: list[int] | None = None,
    sms_provider: Optional[SmsProvider] = None,
    email_provider: Optional[EmailProvider] = None,
) -> int:
    """Deliver due pending notifications. Returns the number delivered.

    Failures increment `attempts` and schedule an exponential-backoff retry
    (1min, 4min, 16min, ...) until NOTIFY_MAX_ATTEMPTS, then mark `failed`.
    """
    now = datetime.now(timezone.utc)
    query = (
        select(NotificationOutbox)
        .where(NotificationOutbox.status == STATUS_PENDING)
        .where(NotificationOutbox.next_attempt_at <= now)
        .order_by(NotificationOutbox.id)
        .limit(limit)
    )
    if notification_ids:
        query = query.where(NotificationOutbox.id.in_(notification_ids))
    rows = db.scalars(query).all()
    if not rows:
        return 0

    sms_provider = sms_provider or get_sms_provider()
    email_provider = email_provider or get_email_provider()
    delivered = 0
    prepared_emails: list[PreparedEmail] = []

    for row in rows:
        if row.channel == CHANNEL_EMAIL:
            try:
                prepared_emails.append(_prepare_email(row))
            except Exception as exc:  # noqa: BLE001 - template/payload errors
                _mark_notification_retryable_failure(row, exc, now=now)
            continue

        template = TEMPLATES.get(row.template)
        try:
            if template is None:
                raise RuntimeError("Unknown template: " + row.template)
            payload = json.loads(row.payload_json or "{}")
            if row.channel == CHANNEL_SMS:
                sms_provider.send(row.recipient, template.sms_text.format(**payload))
            else:
                raise RuntimeError("Unknown channel: " + row.channel)
        except PermanentEmailDeliveryError as exc:
            _mark_notification_permanently_failed(row, exc, now=now)
        except Exception as exc:  # noqa: BLE001 - provider errors are retried
            _mark_notification_retryable_failure(row, exc, now=now)
        else:
            _mark_notification_sent(row, now)
            delivered += 1

    delivered += _deliver_prepared_emails(
        prepared_emails,
        email_provider=email_provider,
        now=now,
    )

    db.commit()
    return delivered


async def notification_worker_loop(stop_event: asyncio.Event) -> None:
    """Background loop that periodically delivers pending notifications."""
    from app.db.session import SessionLocal

    logger.info("Notification worker started")
    while not stop_event.is_set():
        try:
            with SessionLocal() as db:
                deliver_pending(db)
        except Exception:  # noqa: BLE001 - keep the worker alive
            logger.exception("Notification worker iteration failed")
        try:
            await asyncio.wait_for(
                stop_event.wait(), timeout=settings.NOTIFY_POLL_INTERVAL_SECONDS
            )
        except (asyncio.TimeoutError, TimeoutError):
            pass
    logger.info("Notification worker stopped")
