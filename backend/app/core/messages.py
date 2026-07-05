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
    "Recovery code already used": "کد بازیابی قبلا استفاده شده است",
    "Recovery code expired": "کد بازیابی منقضی شده است",
    "Invalid recovery code": "کد بازیابی نامعتبر است",
    "Could not create conversation": "ایجاد گفتگو ممکن نشد",
    "Could not create product": "ایجاد محصول ممکن نشد",
    "Could not update product": "به‌روزرسانی محصول ممکن نشد",
    "Could not create image": "ایجاد تصویر ممکن نشد",
    "Could not update image": "به‌روزرسانی تصویر ممکن نشد",
    "Could not reorder images": "مرتب‌سازی تصاویر ممکن نشد",
    "Could not create field": "ایجاد فیلد ممکن نشد",
    "Could not update field": "به‌روزرسانی فیلد ممکن نشد",
    "Could not reorder fields": "مرتب‌سازی فیلدها ممکن نشد",
    "Could not create social link": "ایجاد لینک اجتماعی ممکن نشد",
    "Could not update social link": "به‌روزرسانی لینک اجتماعی ممکن نشد",
    "Could not delete social link": "حذف لینک اجتماعی ممکن نشد",
    "Could not reorder social links": "مرتب‌سازی لینک‌های اجتماعی ممکن نشد",
    "Could not create order": "ایجاد سفارش ممکن نشد",
    "Could not create payment method": "ایجاد روش پرداخت ممکن نشد",
    "Could not update payment method": "به‌روزرسانی روش پرداخت ممکن نشد",
    "Could not delete payment method": "حذف روش پرداخت ممکن نشد",
    "Could not generate unique invoice code, please retry": "تولید کد فاکتور یکتا ممکن نشد، لطفا دوباره تلاش کنید",
    "Invalid invoice credentials": "اعتبارنامه فاکتور نامعتبر است",
    "Order cannot be edited after payment is confirmed": "سفارش پس از تایید پرداخت قابل ویرایش نیست",
    "Payment proof cannot be uploaded for this order status": "برای این وضعیت سفارش امکان بارگذاری رسید وجود ندارد",
    "File too large": "حجم فایل بیش از حد مجاز است",
    "Empty file": "فایل خالی است",
    "File is required": "فایل الزامی است",
    "Only image files are allowed": "فقط فایل‌های تصویری مجاز هستند",
    "Invalid image file content": "محتوای فایل تصویر نامعتبر است",
    "Invalid image order": "ترتیب تصویر نامعتبر است",
    "Invalid field order": "ترتیب فیلد نامعتبر است",
    "Invalid social link order": "ترتیب لینک اجتماعی نامعتبر است",
    "Store update failed due to a constraint conflict": "به‌روزرسانی فروشگاه به‌دلیل تداخل محدودیت‌ها انجام نشد",
    "Cannot delete payment method with existing references": "روش پرداختی که استفاده شده است قابل حذف نیست",
    "Slug already taken": "اسلاگ قبلا گرفته شده است",
    "Could not validate credentials": "اعتبارنامه قابل تایید نیست",
    "Too many recovery requests. Please try again later.": "تعداد درخواست‌های بازیابی زیاد است. لطفا بعدا دوباره تلاش کنید.",
    "Too many failed attempts. Please request a new code.": "تعداد تلاش‌های ناموفق زیاد است. لطفا یک کد جدید درخواست کنید.",
    "Order already claimed by another customer": "این سفارش قبلا توسط مشتری دیگری ثبت شده است",
    "Complaint is only available for active delivery orders": "اعتراض فقط برای سفارش‌های در حال ارسال فعال است",
    "Reviews are available after delivery": "امکان ثبت نظر پس از تحویل سفارش فعال می‌شود",
    "Only pending reviews can be approved": "فقط نظرات در انتظار تایید قابل تایید هستند",
    "Only pending reviews can be rejected": "فقط نظرات در انتظار تایید قابل رد شدن هستند",
    "Invalid login or password": "ورود یا رمز عبور نامعتبر است",
    "Invalid email or password": "ایمیل یا رمز عبور نامعتبر است",
    "Email already registered": "ایمیل قبلا ثبت شده است",
    "Account is inactive": "حساب کاربری غیرفعال است",
    "Email or password is invalid": "ایمیل یا رمز عبور نامعتبر است",
    "At least one of email or phone is required": "حداقل یکی از ایمیل یا تلفن الزامی است",
    "Phone already registered": "تلفن قبلا ثبت شده است",
    "This account already exists": "این حساب قبلا ایجاد شده است",
    "No changes provided": "هیچ تغییری ارسال نشده است",
    "store_id and customer_id are required": "شناسه فروشگاه و مشتری الزامی هستند",
    "At least one field must be provided": "حداقل یک فیلد باید ارسال شود",
    "card_number and owner_name are required for CARD_TO_CARD": "شماره کارت و نام صاحب حساب برای پرداخت کارت‌به‌کارت الزامی هستند",
    "wallet_address is required for CRYPTO": "آدرس کیف پول برای پرداخت رمزارز الزامی است",
    "external_url is required for EXTERNAL_GATEWAY": "آدرس خارجی برای درگاه پرداخت الزامی است",
    "Invalid token": "توکن نامعتبر است",
}

_PREFIX_TRANSLATIONS: Final[list[tuple[str, str]]] = [
    ("Product is not available: ", "محصول در دسترس نیست: "),
    ("Insufficient stock for ", "موجودی برای این مورد کافی نیست: "),
    ("Invalid value for ", "مقدار نامعتبر برای "),
    ("Unsupported field type: ", "نوع فیلد پشتیبانی نمی‌شود: "),
    ("Unknown field: ", "فیلد ناشناخته: "),
    ("Duplicate field: ", "فیلد تکراری: "),
    ("Cannot confirm payment from status ", "امکان تایید پرداخت در وضعیت "),
    ("Cannot reject payment from status ", "امکان رد پرداخت در وضعیت "),
    ("Cannot change status from terminal state ", "امکان تغییر وضعیت از حالت نهایی "),
    ("Invalid status transition from ", "تغییر وضعیت نامعتبر از "),
]


def _translate_dynamic_message(message: str) -> str | None:
    if message.endswith(" file is required"):
        field_name = message[: -len(" file is required")]
        return f"بارگذاری فایل برای {field_name} الزامی است"

    if message.endswith(" is required"):
        field_name = message[: -len(" is required")]
        return f"{field_name} الزامی است"

    if message.endswith(" must be a number"):
        field_name = message[: -len(" must be a number")]
        return f"{field_name} باید یک عدد باشد"

    if message.endswith(" must be true or false"):
        field_name = message[: -len(" must be true or false")]
        return f"{field_name} باید درست یا نادرست باشد"

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
