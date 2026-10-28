"""Jalali (Persian) calendar helpers for month-based seller reports.

Month boundaries are midnight in Tehran (UTC+03:30; Iran has had no
daylight saving time since 2022).
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

TEHRAN = timezone(timedelta(hours=3, minutes=30))

MONTH_NAMES_FA = (
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
)


def gregorian_to_jalali(gy: int, gm: int, gd: int) -> tuple[int, int, int]:
    g_d_m = (0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334)
    gy2 = gy + 1 if gm > 2 else gy
    days = (
        355666
        + 365 * gy
        + (gy2 + 3) // 4
        - (gy2 + 99) // 100
        + (gy2 + 399) // 400
        + gd
        + g_d_m[gm - 1]
    )
    jy = -1595 + 33 * (days // 12053)
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    if days < 186:
        return jy, 1 + days // 31, 1 + days % 31
    return jy, 7 + (days - 186) // 30, 1 + (days - 186) % 30


def jalali_to_gregorian(jy: int, jm: int, jd: int) -> tuple[int, int, int]:
    jy += 1595
    days = (
        -355668
        + 365 * jy
        + (jy // 33) * 8
        + ((jy % 33) + 3) // 4
        + jd
        + ((jm - 1) * 31 if jm < 7 else (jm - 7) * 30 + 186)
    )
    gy = 400 * (days // 146097)
    days %= 146097
    if days > 36524:
        days -= 1
        gy += 100 * (days // 36524)
        days %= 36524
        if days >= 365:
            days += 1
    gy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        gy += (days - 1) // 365
        days = (days - 1) % 365
    gd = days + 1
    leap = (gy % 4 == 0 and gy % 100 != 0) or gy % 400 == 0
    month_days = (31, 29 if leap else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
    gm = 1
    for length in month_days:
        if gd <= length:
            break
        gd -= length
        gm += 1
    return gy, gm, gd


def current_month(now: datetime | None = None) -> tuple[int, int]:
    """The Jalali (year, month) it is now in Tehran."""
    local = (now or datetime.now(timezone.utc)).astimezone(TEHRAN)
    jy, jm, _ = gregorian_to_jalali(local.year, local.month, local.day)
    return jy, jm


def shift_month(jy: int, jm: int, delta: int) -> tuple[int, int]:
    index = jy * 12 + (jm - 1) + delta
    return index // 12, index % 12 + 1


def month_range(jy: int, jm: int) -> tuple[datetime, datetime]:
    """[start, end) of a Jalali month as UTC datetimes."""

    def start_of(y: int, m: int) -> datetime:
        gy, gm, gd = jalali_to_gregorian(y, m, 1)
        return datetime(gy, gm, gd, tzinfo=TEHRAN).astimezone(timezone.utc)

    ny, nm = shift_month(jy, jm, 1)
    return start_of(jy, jm), start_of(ny, nm)


def parse_month(value: str | None, now: datetime | None = None) -> tuple[int, int]:
    """"1404-08" → (1404, 8); empty → the current month. Raises ValueError."""
    if not value:
        return current_month(now)
    parts = value.strip().split("-")
    if len(parts) != 2 or not all(p.isdigit() for p in parts):
        raise ValueError("month must look like 1404-08")
    jy, jm = int(parts[0]), int(parts[1])
    if not (1300 <= jy <= 1500 and 1 <= jm <= 12):
        raise ValueError("month out of range")
    return jy, jm


def month_key(jy: int, jm: int) -> str:
    return f"{jy:04d}-{jm:02d}"


def month_label(jy: int, jm: int) -> str:
    return f"{MONTH_NAMES_FA[jm - 1]} {jy}"


def to_date(jy: int, jm: int, jd: int) -> date:
    return date(*jalali_to_gregorian(jy, jm, jd))
