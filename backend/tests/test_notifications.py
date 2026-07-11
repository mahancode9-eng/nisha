from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.notification_service import (
    STATUS_FAILED,
    STATUS_PENDING,
    STATUS_SENT,
    PermanentEmailDeliveryError,
    PreparedEmail,
    ResendEmailProvider,
    deliver_pending,
    enqueue_email,
    enqueue_sms,
    get_email_provider,
)


class RecordingSmsProvider:
    def __init__(self) -> None:
        self.sent: list[tuple[str, str]] = []

    def send(self, to: str, text: str) -> None:
        self.sent.append((to, text))


class RecordingEmailProvider:
    def __init__(self) -> None:
        self.sent: list[tuple[str, str, str, str | None, str | None]] = []

    def send(
        self,
        to: str,
        subject: str,
        body: str,
        *,
        html: str | None = None,
        idempotency_key: str | None = None,
    ) -> None:
        self.sent.append((to, subject, body, html, idempotency_key))


class FailingSmsProvider:
    def send(self, to: str, text: str) -> None:
        raise RuntimeError("provider down")


def test_enqueue_and_deliver_sms(db: Session) -> None:
    notification = enqueue_sms(
        db,
        "+989121000000",
        "order_placed_buyer",
        {"invoice_code": "INV-1001", "store_name": "Store A"},
    )
    db.commit()
    assert notification.status == STATUS_PENDING

    sms = RecordingSmsProvider()
    email = RecordingEmailProvider()
    delivered = deliver_pending(db, sms_provider=sms, email_provider=email)

    assert delivered == 1
    assert len(sms.sent) == 1
    assert sms.sent[0][0] == "+989121000000"
    assert "INV-1001" in sms.sent[0][1]
    assert email.sent == []

    db.refresh(notification)
    assert notification.status == STATUS_SENT
    assert notification.attempts == 1
    assert notification.sent_at is not None


def test_enqueue_and_deliver_email(db: Session) -> None:
    notification = enqueue_email(
        db,
        "buyer@example.com",
        "order_status_changed",
        {
            "invoice_code": "INV-2002",
            "store_name": "Store B",
            "status_label": "ارسال شد",
        },
    )
    db.commit()

    sms = RecordingSmsProvider()
    email = RecordingEmailProvider()
    delivered = deliver_pending(db, sms_provider=sms, email_provider=email)

    assert delivered == 1
    assert len(email.sent) == 1
    to, subject, body, html, idempotency_key = email.sent[0]
    assert to == "buyer@example.com"
    assert "INV-2002" in subject
    assert "INV-2002" in body
    assert "ارسال شد" in body
    assert "\\u062" not in subject
    assert html is not None
    assert "نیشا" in html
    assert idempotency_key == f"order_status_changed/{notification.id}"

    db.refresh(notification)
    assert notification.status == STATUS_SENT


def test_failed_delivery_retries_then_fails(db: Session) -> None:
    notification = enqueue_sms(
        db,
        "+989121000001",
        "order_placed_buyer",
        {"invoice_code": "INV-3003", "store_name": "Store C"},
    )
    db.commit()

    failing = FailingSmsProvider()
    email = RecordingEmailProvider()

    for attempt in range(settings.NOTIFY_MAX_ATTEMPTS):
        notification.next_attempt_at = datetime.now(timezone.utc)
        db.commit()
        delivered = deliver_pending(db, sms_provider=failing, email_provider=email)
        assert delivered == 0
        db.refresh(notification)
        assert notification.attempts == attempt + 1

    assert notification.status == STATUS_FAILED
    assert "provider down" in (notification.last_error or "")


def test_retry_is_scheduled_in_future(db: Session) -> None:
    notification = enqueue_sms(
        db,
        "+989121000002",
        "test_message",
        {"code": "1234"},
    )
    db.commit()

    deliver_pending(
        db, sms_provider=FailingSmsProvider(), email_provider=RecordingEmailProvider()
    )
    db.refresh(notification)

    assert notification.status == STATUS_PENDING
    assert notification.attempts == 1
    assert notification.next_attempt_at is not None

    # Not due yet, so another delivery pass must not pick it up.
    delivered = deliver_pending(
        db, sms_provider=FailingSmsProvider(), email_provider=RecordingEmailProvider()
    )
    assert delivered == 0
    db.refresh(notification)
    assert notification.attempts == 1


def test_unknown_template_rejected(db: Session) -> None:
    with pytest.raises(ValueError):
        enqueue_sms(db, "+989121000003", "no_such_template", {})


def test_resend_email_provider_sends_html(monkeypatch) -> None:
    import resend

    monkeypatch.setattr(
        "app.services.notification_service.settings.RESEND_API_KEY",
        "re_test_key",
    )
    monkeypatch.setattr(
        "app.services.notification_service.settings.EMAIL_FROM",
        "Nisha <noreply@nishanorep.cloudproducts.ir>",
    )
    mock_send = MagicMock()
    monkeypatch.setattr(resend.Emails, "send", mock_send)
    ResendEmailProvider().send(
        "buyer@example.com",
        "تأیید ایمیل نیشا",
        "سلام کاربر",
        html="<html><body>تأیید ایمیل</body></html>",
        idempotency_key="email_verification/42",
    )
    mock_send.assert_called_once_with(
        {
            "from": "Nisha <noreply@nishanorep.cloudproducts.ir>",
            "to": "buyer@example.com",
            "subject": "تأیید ایمیل نیشا",
            "text": "سلام کاربر",
            "html": "<html><body>تأیید ایمیل</body></html>",
        },
        options={"idempotency_key": "email_verification/42"},
    )


def test_verification_email_template_renders_persian_and_html(db: Session) -> None:
    notification = enqueue_email(
        db,
        "buyer@example.com",
        "email_verification",
        {
            "full_name": "ماهان <test>",
            "verify_link": "http://localhost:3000/verify-email?token=abc",
        },
    )
    db.commit()

    email = RecordingEmailProvider()
    deliver_pending(db, sms_provider=RecordingSmsProvider(), email_provider=email)

    assert len(email.sent) == 1
    _, subject, body, html, _ = email.sent[0]
    assert subject == "تأیید ایمیل نیشا"
    assert "ماهان" in body
    assert "\\u062" not in body
    assert "\\n" not in body
    assert html is not None
    assert "تأیید ایمیل" in html
    assert "ماهان &lt;test&gt;" in html
    assert 'href="http://localhost:3000/verify-email?token=abc"' in html
    db.refresh(notification)
    assert notification.status == STATUS_SENT


def test_resend_email_provider_sends(monkeypatch) -> None:
    import resend

    monkeypatch.setattr(
        "app.services.notification_service.settings.RESEND_API_KEY",
        "re_test_key",
    )
    monkeypatch.setattr(
        "app.services.notification_service.settings.EMAIL_FROM",
        "Nisha <noreply@nishanorep.cloudproducts.ir>",
    )
    mock_send = MagicMock()
    monkeypatch.setattr(resend.Emails, "send", mock_send)
    ResendEmailProvider().send(
        "buyer@example.com",
        "Hello World",
        "Congrats on sending your first email!",
        idempotency_key="email_verification/42",
    )
    assert resend.api_key == "re_test_key"
    mock_send.assert_called_once_with(
        {
            "from": "Nisha <noreply@nishanorep.cloudproducts.ir>",
            "to": "buyer@example.com",
            "subject": "Hello World",
            "text": "Congrats on sending your first email!",
        },
        options={"idempotency_key": "email_verification/42"},
    )


def test_resend_email_provider_retries_rate_limit(monkeypatch) -> None:
    import resend
    from resend.exceptions import RateLimitError

    monkeypatch.setattr(
        "app.services.notification_service.settings.RESEND_API_KEY",
        "re_test_key",
    )
    monkeypatch.setattr(
        "app.services.notification_service.settings.EMAIL_FROM",
        "noreply@example.com",
    )
    monkeypatch.setattr(
        "app.services.notification_service.time.sleep",
        lambda _seconds: None,
    )
    mock_send = MagicMock(
        side_effect=[
            RateLimitError(message="Too many requests", error_type="rate_limit_exceeded", code=429),
            None,
        ]
    )
    monkeypatch.setattr(resend.Emails, "send", mock_send)
    ResendEmailProvider().send("buyer@example.com", "Subject", "Body")
    assert mock_send.call_count == 2


def test_resend_email_provider_permanent_auth_error(monkeypatch) -> None:
    import resend
    from resend.exceptions import InvalidApiKeyError

    monkeypatch.setattr(
        "app.services.notification_service.settings.RESEND_API_KEY",
        "re_test_key",
    )
    monkeypatch.setattr(
        "app.services.notification_service.settings.EMAIL_FROM",
        "noreply@example.com",
    )
    mock_send = MagicMock(
        side_effect=InvalidApiKeyError(
            message="Invalid API key",
            error_type="invalid_api_key",
            code=403,
        )
    )
    monkeypatch.setattr(resend.Emails, "send", mock_send)
    with pytest.raises(PermanentEmailDeliveryError, match="Invalid API key"):
        ResendEmailProvider().send("buyer@example.com", "Subject", "Body")


def test_resend_email_provider_batch_send(monkeypatch) -> None:
    import resend

    monkeypatch.setattr(
        "app.services.notification_service.settings.RESEND_API_KEY",
        "re_test_key",
    )
    monkeypatch.setattr(
        "app.services.notification_service.settings.EMAIL_FROM",
        "noreply@example.com",
    )
    mock_batch_send = MagicMock()
    monkeypatch.setattr(resend.Batch, "send", mock_batch_send)
    row_one = MagicMock(id=10, template="order_placed_seller")
    row_two = MagicMock(id=11, template="payment_uploaded_seller")
    emails = [
        PreparedEmail(row=row_one, to="a@example.com", subject="A", body="Body A"),
        PreparedEmail(row=row_two, to="b@example.com", subject="B", body="Body B"),
    ]
    ResendEmailProvider().send_batch(emails)
    mock_batch_send.assert_called_once_with(
        [
            {
                "from": "noreply@example.com",
                "to": "a@example.com",
                "subject": "A",
                "text": "Body A",
            },
            {
                "from": "noreply@example.com",
                "to": "b@example.com",
                "subject": "B",
                "text": "Body B",
            },
        ],
        options={"idempotency_key": "batch-notification-outbox/10-11"},
    )


def test_permanent_email_error_fails_without_retry(db: Session) -> None:
    class PermanentEmailProvider:
        def send(
            self,
            to: str,
            subject: str,
            body: str,
            *,
            html: str | None = None,
            idempotency_key: str | None = None,
        ) -> None:
            raise PermanentEmailDeliveryError("Invalid sender domain")

    notification = enqueue_email(
        db,
        "buyer@example.com",
        "order_status_changed",
        {
            "invoice_code": "INV-4004",
            "store_name": "Store D",
            "status_label": "ارسال شد",
        },
    )
    db.commit()

    delivered = deliver_pending(
        db,
        sms_provider=RecordingSmsProvider(),
        email_provider=PermanentEmailProvider(),
    )

    assert delivered == 0
    db.refresh(notification)
    assert notification.status == STATUS_FAILED
    assert notification.attempts == 1
    assert "Invalid sender domain" in (notification.last_error or "")


def test_resend_email_provider_requires_api_key(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.notification_service.settings.RESEND_API_KEY",
        "",
    )
    monkeypatch.setattr(
        "app.services.notification_service.settings.EMAIL_FROM",
        "onboarding@resend.dev",
    )
    with pytest.raises(RuntimeError, match="RESEND_API_KEY"):
        ResendEmailProvider().send("buyer@example.com", "Subject", "Body")


def test_resend_email_provider_requires_from_address(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.notification_service.settings.RESEND_API_KEY",
        "re_test_key",
    )
    monkeypatch.setattr(
        "app.services.notification_service.settings.EMAIL_FROM",
        "",
    )
    with pytest.raises(RuntimeError, match="EMAIL_FROM"):
        ResendEmailProvider().send("buyer@example.com", "Subject", "Body")


def test_get_email_provider_resend(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.notification_service.settings.EMAIL_PROVIDER",
        "resend",
    )
    assert isinstance(get_email_provider(), ResendEmailProvider)
