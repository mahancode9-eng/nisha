"""OCR + match helpers for card-to-card payment proofs.

Reads amount / destination card last-4 from receipt image text (Tesseract when
available) and compares them to the order. Suggests a match for sellers — never
auto-confirms payment.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from io import BytesIO
from typing import Callable

from app.core.config import settings
from app.models.order import Order, PaymentProof
from app.models.payment_method import PaymentMethod

logger = logging.getLogger(__name__)

OCR_PENDING = "pending"
OCR_MATCHED = "matched"
OCR_MISMATCH = "mismatch"
OCR_UNCLEAR = "unclear"
OCR_FAILED = "failed"
OCR_SKIPPED = "skipped"

_DIGIT_TRANSLATE = str.maketrans(
    "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩",
    "01234567890123456789",
)

# Prefer full 16-digit Iranian cards (spaces/dashes), then masked ****1234.
_FULL_CARD_RE = re.compile(r"(?:\d{4}[\s\-]?){3}\d{4}")
_MASKED_CARD_RE = re.compile(r"\*{2,4}[\s\-]*(\d{4})", re.IGNORECASE)
_AMOUNT_CANDIDATE_RE = re.compile(r"\d{3,12}(?:[.,]\d{1,2})?")

ExtractTextFn = Callable[[bytes], str]


@dataclass(slots=True, frozen=True)
class OcrMatchResult:
    status: str
    amount: Decimal | None = None
    dest_card_last4: str | None = None
    amount_matched: bool | None = None
    dest_card_matched: bool | None = None
    confidence: Decimal | None = None


def normalize_digits(text: str) -> str:
    return (text or "").translate(_DIGIT_TRANSLATE)


def card_last4(card_number: str | None) -> str | None:
    if not card_number:
        return None
    digits = "".join(ch for ch in normalize_digits(card_number) if ch.isdigit())
    if len(digits) < 4:
        return None
    return digits[-4:]


def extract_amounts(text: str) -> list[Decimal]:
    normalized = normalize_digits(text).replace(",", "").replace("٬", "")
    found: list[Decimal] = []
    seen: set[str] = set()
    for raw in _AMOUNT_CANDIDATE_RE.findall(normalized):
        cleaned = raw.replace(",", "")
        if cleaned in seen:
            continue
        seen.add(cleaned)
        try:
            value = Decimal(cleaned)
        except InvalidOperation:
            continue
        if value <= 0:
            continue
        # Ignore tiny noise (years, short codes) unless exactly matching later.
        if value < 100 and "." not in cleaned:
            continue
        found.append(value)
    return found


def extract_card_last4s(text: str) -> list[str]:
    normalized = normalize_digits(text)
    found: list[str] = []
    seen: set[str] = set()

    def _add(last4: str) -> None:
        if len(last4) == 4 and last4 not in seen:
            seen.add(last4)
            found.append(last4)

    for match in _FULL_CARD_RE.finditer(normalized):
        digits = "".join(ch for ch in match.group(0) if ch.isdigit())
        if len(digits) >= 4:
            _add(digits[-4:])

    for digits in re.findall(r"\d{16}", normalized):
        _add(digits[-4:])

    for match in _MASKED_CARD_RE.finditer(normalized):
        _add(match.group(1))

    return found


def extract_text_from_image(image_bytes: bytes) -> str:
    """Best-effort OCR. Raises on hard failures so callers can mark failed."""
    from PIL import Image

    try:
        import pytesseract
    except ImportError as exc:  # pragma: no cover - dependency optional in some envs
        raise RuntimeError("pytesseract not installed") from exc

    image = Image.open(BytesIO(image_bytes))
    # Prefer Persian + English digit/latin; fall back to eng-only.
    for lang in ("fas+eng", "eng"):
        try:
            text = pytesseract.image_to_string(image, lang=lang) or ""
            if text.strip():
                return text
        except pytesseract.TesseractError:
            continue
        except Exception:  # noqa: BLE001 - OCR must never break upload
            logger.exception("Tesseract OCR failed for lang=%s", lang)
            break
    return ""


def match_order_to_ocr_text(order: Order, text: str) -> OcrMatchResult:
    expected_amount = Decimal(order.total_amount).quantize(Decimal("1"))
    expected_dest = card_last4(
        order.payment_method.card_number if order.payment_method is not None else None
    )

    amounts = extract_amounts(text)
    last4s = extract_card_last4s(text)

    amount_hit = any(
        Decimal(a).quantize(Decimal("1")) == expected_amount
        or a == Decimal(order.total_amount)
        for a in amounts
    )

    dest_hit: bool | None
    chosen_dest: str | None = None
    if expected_dest is None:
        dest_hit = None
    else:
        dest_hit = expected_dest in last4s
        if dest_hit:
            chosen_dest = expected_dest
        elif last4s:
            chosen_dest = last4s[0]

    matched_amount = next(
        (
            a
            for a in amounts
            if Decimal(a).quantize(Decimal("1")) == expected_amount
            or a == Decimal(order.total_amount)
        ),
        amounts[0] if amounts else None,
    )

    if not amounts and not last4s:
        return OcrMatchResult(status=OCR_UNCLEAR, confidence=Decimal("0.100"))

    if amount_hit and (dest_hit is None or dest_hit):
        confidence = Decimal("0.900") if dest_hit else Decimal("0.750")
        return OcrMatchResult(
            status=OCR_MATCHED,
            amount=matched_amount,
            dest_card_last4=chosen_dest or expected_dest,
            amount_matched=True,
            dest_card_matched=dest_hit,
            confidence=confidence,
        )

    if amounts or last4s:
        # Clear evidence that disagrees → mismatch; otherwise unclear.
        if (amounts and not amount_hit) or (expected_dest and last4s and not dest_hit):
            return OcrMatchResult(
                status=OCR_MISMATCH,
                amount=matched_amount,
                dest_card_last4=chosen_dest,
                amount_matched=amount_hit,
                dest_card_matched=dest_hit,
                confidence=Decimal("0.650"),
            )

    return OcrMatchResult(
        status=OCR_UNCLEAR,
        amount=matched_amount,
        dest_card_last4=chosen_dest,
        amount_matched=amount_hit if amounts else None,
        dest_card_matched=dest_hit,
        confidence=Decimal("0.300"),
    )


def analyze_payment_proof(
    order: Order,
    image_bytes: bytes,
    *,
    payer_card_last4: str | None = None,
    transfer_tracking: str | None = None,
    extract_text: ExtractTextFn | None = None,
) -> OcrMatchResult:
    if not settings.PAYMENT_PROOF_OCR_ENABLED:
        return OcrMatchResult(status=OCR_SKIPPED)

    extractor = extract_text or extract_text_from_image
    try:
        text = extractor(image_bytes) or ""
    except Exception:  # noqa: BLE001
        logger.exception("Payment proof OCR extract failed for order %s", order.id)
        return OcrMatchResult(status=OCR_FAILED)

    extra_bits = []
    if transfer_tracking:
        extra_bits.append(transfer_tracking)
    if payer_card_last4:
        # Do not treat payer last4 as destination; only add to text for completeness.
        extra_bits.append(f"payer {payer_card_last4}")
    combined = "\n".join([text, *extra_bits]).strip()
    if not combined:
        return OcrMatchResult(status=OCR_UNCLEAR, confidence=Decimal("0.050"))

    return match_order_to_ocr_text(order, combined)


def apply_ocr_result(proof: PaymentProof, result: OcrMatchResult) -> None:
    proof.ocr_status = result.status
    proof.ocr_amount = result.amount
    proof.ocr_dest_card_last4 = result.dest_card_last4
    proof.ocr_amount_matched = result.amount_matched
    proof.ocr_dest_card_matched = result.dest_card_matched
    proof.ocr_confidence = result.confidence


def payment_method_dest_last4(method: PaymentMethod | None) -> str | None:
    if method is None:
        return None
    return card_last4(method.card_number)
