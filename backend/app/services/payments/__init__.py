from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.subscription import SubscriptionInvoice
from app.services import platform_setting_service
from app.services.exceptions import ServiceError


@dataclass
class PaymentSession:
    provider: str
    mode: str
    instructions: dict[str, Any]
    redirect_url: str | None = None
    external_reference: str | None = None


class PaymentProvider(Protocol):
    name: str

    def create_payment(self, db: Session, invoice: SubscriptionInvoice) -> PaymentSession: ...

    def handle_callback(self, db: Session, payload: dict[str, Any]) -> SubscriptionInvoice: ...

    def verify(self, db: Session, invoice: SubscriptionInvoice, payload: dict[str, Any] | None = None) -> bool: ...


class CardToCardPaymentProvider:
    name = "card_to_card"

    def create_payment(self, db: Session, invoice: SubscriptionInvoice) -> PaymentSession:
        return PaymentSession(
            provider=self.name,
            mode="card_to_card",
            instructions=get_platform_card_instructions(db),
            redirect_url=None,
            external_reference=None,
        )

    def handle_callback(self, db: Session, payload: dict[str, Any]) -> SubscriptionInvoice:
        raise ServiceError(
            "درگاه کارت‌به‌کارت از callback پشتیبانی نمی‌کند",
            status_code=400,
        )

    def verify(
        self,
        db: Session,
        invoice: SubscriptionInvoice,
        payload: dict[str, Any] | None = None,
    ) -> bool:
        return False


def get_platform_card_instructions(db: Session) -> dict[str, str]:
    cards = platform_setting_service.get_subscription_card_settings(db)
    return {
        "card_number": cards["subscription_card_number"],
        "card_owner": cards["subscription_card_owner"],
        "card_bank": cards["subscription_card_bank"],
        "message": "مبلغ را به کارت زیر واریز کنید و رسید را بارگذاری کنید.",
    }


def get_payment_provider() -> PaymentProvider:
    provider = settings.SUBSCRIPTION_PAYMENT_PROVIDER
    if provider == "card_to_card":
        return CardToCardPaymentProvider()
    raise ServiceError(f"ارائه‌دهنده پرداخت ناشناخته: {provider}", status_code=500)
