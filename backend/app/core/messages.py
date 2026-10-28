from __future__ import annotations

from typing import Final

_EXACT_TRANSLATIONS: Final[dict[str, str]] = {
    "Conversation not found": "گفتگو پیدا نشد",
    "Order not found": "سفارش پیدا نشد",
    "Store not found": "فروشگاه پیدا نشد",
    "Product not found": "محصول پیدا نشد",
    "Payment method not found": "روش پرداخت پیدا نشد",
    "Image not found": "تصویر پیدا نشد",
    "Field not found": "فیلد پیدا نشد",
    "Badge not found": "نشان پیدا نشد",
    "Social link not found": "لینک اجتماعی پیدا نشد",
    "Review not found": "نظر پیدا نشد",
    "Address not found": "آدرس پیدا نشد",
    "Account not found": "حساب پیدا نشد",
    "Recovery request not found": "درخواست بازیابی پیدا نشد",
    "Recovery code already used": "این کد قبلاً استفاده شده. یک کد تازه بگیر.",
    "Recovery code expired": "این کد منقضی شده. یک کد تازه بگیر.",
    "Invalid recovery code": "کد بازیابی درست نیست.",
    "Could not create conversation": "گفتگو باز نشد. دوباره امتحان کن.",
    "Could not create product": "محصول ساخته نشد. دوباره امتحان کن.",
    "Could not update product": "تغییرات محصول ذخیره نشد. دوباره امتحان کن.",
    "Could not create image": "عکس اضافه نشد. دوباره امتحان کن.",
    "Could not update image": "تغییر عکس ذخیره نشد. دوباره امتحان کن.",
    "Could not reorder images": "ترتیب عکس‌ها ذخیره نشد. دوباره امتحان کن.",
    "Could not create field": "سؤال سفارشی اضافه نشد. دوباره امتحان کن.",
    "Could not update field": "سؤال سفارشی ذخیره نشد. دوباره امتحان کن.",
    "Could not reorder fields": "ترتیب سؤال‌ها ذخیره نشد. دوباره امتحان کن.",
    "Could not create social link": "لینک اضافه نشد. دوباره امتحان کن.",
    "Could not update social link": "تغییر لینک ذخیره نشد. دوباره امتحان کن.",
    "Could not delete social link": "لینک حذف نشد. دوباره امتحان کن.",
    "Could not reorder social links": "ترتیب لینک‌ها ذخیره نشد. دوباره امتحان کن.",
    "Could not create order": "سفارش ثبت نشد. دوباره امتحان کن.",
    "Could not create payment method": "روش پرداخت اضافه نشد. دوباره امتحان کن.",
    "Could not update payment method": "تغییر روش پرداخت ذخیره نشد. دوباره امتحان کن.",
    "Could not delete payment method": "روش پرداخت حذف نشد. دوباره امتحان کن.",
    "Could not generate unique invoice code, please retry": "سفارش ثبت نشد. دوباره امتحان کن.",
    "Invalid invoice credentials": "کد یا رمز فاکتور درست نیست.",
    "Order cannot be edited after payment is confirmed": "بعد از تایید پرداخت، دیگه نمی‌تونی سفارش رو ویرایش کنی.",
    "Payment proof cannot be uploaded for this order status": "تو این مرحله نمی‌تونی برای این سفارش رسید بفرستی.",
    "File too large": "حجم فایل زیادیه",
    "Empty file": "فایل خالیه",
    "File is required": "فایلی انتخاب نشده.",
    "Only image files are allowed": "فقط عکس می‌تونی بارگذاری کنی.",
    "Invalid image file content": "این فایل عکس سالم نیست. عکس دیگه‌ای انتخاب کن.",
    "Invalid image order": "ترتیب تصویر درست نیست",
    "Invalid field order": "ترتیب فیلد درست نیست",
    "Invalid social link order": "ترتیب لینک اجتماعی درست نیست",
    "Store update failed due to a constraint conflict": "تنظیمات فروشگاه ذخیره نشد. دوباره امتحان کن.",
    "Cannot delete payment method with existing references": "این روش پرداخت تو سفارش‌ها استفاده شده و حذف نمی‌شه؛ به‌جاش غیرفعالش کن.",
    "Slug already taken": "این آدرس فروشگاه قبلاً گرفته شده؛ آدرس دیگه‌ای انتخاب کن.",
    "Could not validate credentials": "نشستت تموم شده. دوباره وارد شو.",
    "Too many recovery requests. Please try again later.": "درخواست بازیابی زیادی فرستادی. کمی بعد دوباره امتحان کن.",
    "Too many failed attempts. Please request a new code.": "چند بار کد اشتباه زدی. یک کد تازه بگیر.",
    "Email not verified": "ایمیلت هنوز تایید نشده. لینک داخل ایمیل رو باز کن.",
    "Invalid or expired verification token": "این لینک تایید معتبر نیست یا منقضی شده.",
    "Too many verification requests. Please try again later.": "درخواست زیادی فرستادی. کمی بعد دوباره امتحان کن.",
    "Invalid verification kind": "لینک تایید معتبر نیست.",
    "Order already claimed by another customer": "این سفارش قبلاً به حساب دیگه‌ای اضافه شده.",
    "Complaint is only available for active delivery orders": "برای این سفارش الان نمی‌تونی شکایت ثبت کنی.",
    "Reviews are available after delivery": "بعد از تحویل سفارش می‌تونی نظر بدی.",
    "Only pending reviews can be approved": "فقط نظرهای در انتظار بررسی رو می‌شه تایید کرد.",
    "Only pending reviews can be rejected": "فقط نظرهای در انتظار بررسی رو می‌شه رد کرد.",
    "Invalid login or password": "ایمیل/تلفن یا رمز عبور درست نیست.",
    "Invalid email or password": "ایمیل یا رمز عبور درست نیست.",
    "Email already registered": "با این ایمیل قبلاً حساب ساخته شده. وارد شو یا رمز رو بازیابی کن.",
    "Account is inactive": "این حساب غیرفعاله. با پشتیبانی تماس بگیر.",
    "Email or password is invalid": "ایمیل یا رمز عبور درست نیست.",
    "At least one of email or phone is required": "ایمیل یا شماره تلفن رو وارد کن؛ یکی کافیه.",
    "Phone already registered": "با این شماره قبلاً حساب ساخته شده. وارد شو یا رمز رو بازیابی کن.",
    "This account already exists": "این حساب از قبل هست. وارد شو.",
    "No changes provided": "تغییری برای ذخیره نیست.",
    "store_id and customer_id are required": "شناسه فروشگاه و مشتری لازمه",
    "At least one field must be provided": "حداقل یک فیلد باید فرستاده بشه",
    "card_number and owner_name are required for CARD_TO_CARD": "برای کارت‌به‌کارت، شماره کارت و نام صاحب حساب رو وارد کن.",
    "wallet_address is required for CRYPTO": "برای رمزارز، آدرس کیف پول رو وارد کن.",
    "external_url is required for EXTERNAL_GATEWAY": "برای درگاه پرداخت، لینک درگاه رو وارد کن.",
    "Invalid token": "لینک یا نشستت معتبر نیست. دوباره وارد شو.",
}

_PREFIX_TRANSLATIONS: Final[list[tuple[str, str]]] = [
    ("Product is not available: ", "محصول در دسترس نیست: "),
    ("Insufficient stock for ", "موجودی برای این مورد کافی نیست: "),
    ("Invalid value for ", "مقدار درست نیست برای "),
    ("Unsupported field type: ", "نوع فیلد پشتیبانی نمی‌شه: "),
    ("Unknown field: ", "فیلد ناشناخته: "),
    ("Duplicate field: ", "فیلد تکراری: "),
    ("Cannot confirm payment from status ", "نمی‌شه پرداخت رو تو وضعیت "),
    ("Cannot reject payment from status ", "نمی‌شه پرداخت رو تو وضعیت "),
    ("Cannot change status from terminal state ", "نمی‌شه وضعیت رو از حالت نهایی "),
    ("Invalid status transition from ", "تغییر وضعیت درست نیست از "),
]


def _translate_dynamic_message(message: str) -> str | None:
    if message.endswith(" file is required"):
        field_name = message[: -len(" file is required")]
        return f"بارگذاری فایل برای {field_name} لازمه"

    if message.endswith(" is required"):
        field_name = message[: -len(" is required")]
        return f"{field_name} لازمه"

    if message.endswith(" must be a number"):
        field_name = message[: -len(" must be a number")]
        return f"{field_name} باید عدد باشه"

    if message.endswith(" must be true or false"):
        field_name = message[: -len(" must be true or false")]
        return f"{field_name} باید درست یا نادرست باشه"

    return None


def translate_backend_message(message: str) -> str:
    if message in _EXACT_TRANSLATIONS:
        return _EXACT_TRANSLATIONS[message]

    dynamic_translation = _translate_dynamic_message(message)
    if dynamic_translation is not None:
        return dynamic_translation

    for prefix, translated_prefix in _PREFIX_TRANSLATIONS:
        if message.startswith(prefix):
            return f"{translated_prefix}{message[len(prefix):]}"

    return message
