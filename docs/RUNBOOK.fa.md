# 📘 راهنمای راه‌اندازی و بهره‌برداری نیشا (Runbook)

این سند خلاصه همه کارهایی است که تا الان روی زیرساخت و فازهای نقشه راه انجام شده، به‌علاوه **چک‌لیست دقیق کارهایی که خودت باید انجام بدهی** تا سیستم بدون مشکل بالا بیاید. هر بخش به سند فنی کامل‌ترش لینک شده است.

> آخرین به‌روزرسانی: تیر ۱۴۰۵ (ژوئیه ۲۰۲۶) — تا پایان تسک ۱۵ نقشه راه

---

## ۱. معماری در یک نگاه

- **بک‌اند:** FastAPI + SQLAlchemy + Alembic (پوشه `backend/`)
- **فرانت‌اند:** Next.js (پوشه `frontend/`)
- **دیتابیس:** PostgreSQL (در پروداکشن) / SQLite (در تست‌ها)
- **اجرا:** Docker Compose — فایل `docker-compose.prod.yml` برای پروداکشن و `docker-compose.staging.yml` برای استیجینگ
- مایگریشن‌های دیتابیس **به‌صورت خودکار** موقع بالا آمدن بک‌اند اجرا می‌شوند (فقط روی PostgreSQL).
- سلامت سرویس: `GET /api/v1/health`

---

## ۲. چه چیزهایی تا الان ساخته شده

| تسک | چه چیزی ساخته شد | سند کامل |
| --- | --- | --- |
| ۱ — CI/CD | گیت‌هاب اکشنز با ۴ جاب: تست بک‌اند، لینت و بیلد فرانت، بیلد داکر، ممیزی امنیتی (pip-audit + npm audit) | فایل `.github/workflows/ci.yml` |
| ۲ — استیجینگ | کانفیگ استیجینگ جدا با `docker-compose.staging.yml` و `.env.staging.example` | `docs/staging.md` |
| ۳ — تست و کاورج | pytest-cov، `backend/pytest.ini`، اسکلت تست E2E با Playwright در `e2e/` | `docs/testing.md` |
| ۴ — مانیتورینگ | Sentry (با متغیر `SENTRY_DSN` فعال می‌شود) + لاگ JSON با request-id | `docs/monitoring.md` |
| ۵ — هدرهای امنیتی | میدل‌ور هدرهای امنیتی (CSP, HSTS و...) | `docs/monitoring.md` |
| ۶ — بکاپ | سرویس `db-backup` در کامپوز پروداکشن + دستور ریستور | `docs/backup.md` |
| ۷ — آبجکت استوریج | لایه استوریج با دو بک‌اند `local` و `s3` (سازگار با هر سرویس S3-compatible مثل آروان/لیارا) | `docs/object-storage.md` |
| ۹ — لاگ ساختاریافته | لاگ JSON + شناسه درخواست در همه لاگ‌ها | `docs/monitoring.md` |
| ۱۰ — تست بار | اسکریپت‌های k6 (اسموک و بار) | `docs/load-testing.md` |
| ۱۱ — سرویس نوتیفیکیشن | صف نوتیفیکیشن (outbox) + ورکر پس‌زمینه + پیامک کاوه‌نگار + ایمیل SMTP + قالب‌های فارسی | `docs/notifications.md` |
| ۱۲ — نوتیفیکیشن چرخه سفارش | پیامک به خریدار و ایمیل به فروشنده در ثبت سفارش، ثبت رسید پرداخت و هر تغییر وضعیت | `docs/notifications.md` |
| ۱۳ — چت Real-time | چت WebSocket زنده برای فروشنده/مشتری/مهمان + رویداد badge خوانده‌نشده؛ polling قبلی به‌عنوان fallback حفظ شده | `docs/chat-realtime.md` |
| ۱۴ — جستجو و فیلتر ویترین | جستجوی فارسی (نرمال‌سازی ی/ک عربی و نیم‌فاصله)، فیلتر قیمت و موجودی، مرتب‌سازی (جدیدترین/ارزان‌ترین/گران‌ترین/پرفروش‌ترین) با صفحه‌بندی + ایندکس pg_trgm؛ state جستجو در URL ذخیره می‌شود | `docs/product-search.md` |
| ۱۵ — گالری و ویدیوی محصول | تا ۸ تصویر برای هر محصول با مرتب‌سازی drag & drop، گالری صفحه محصول با swipe موبایل و بزرگ‌نمایی (lightbox)، و ویدیوی محصول تا ۵۰ مگابایت (MP4/WebM) | `docs/product-gallery.md` |

---

## ۳. چک‌لیست راه‌اندازی پروداکشن (گام‌به‌گام)

### گام ۱ — آماده‌سازی سرور

1. یک سرور لینوکسی (Ubuntu 22.04 یا جدیدتر) با حداقل ۲ گیگ رم تهیه کن.
2. Docker و Docker Compose را نصب کن.
3. ریپازیتوری را کلون کن:

```bash
git clone <آدرس ریپو>
cd nisha
```

### گام ۲ — ساخت فایل `.env`

کنار `docker-compose.prod.yml` یک فایل `.env` بساز. **متغیرهای الزامی:**

```env
# --- الزامی ---
POSTGRES_PASSWORD=یک-رمز-قوی-و-تصادفی
JWT_SECRET_KEY=یک-کلید-تصادفی-حداقل-۳۲-کاراکتر
CORS_ORIGINS=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com
```

**متغیرهای اختیاری (سرویس‌ها را فعال می‌کنند):**

```env
# --- مانیتورینگ خطا (بخش ۴.۱) ---
SENTRY_DSN=

# --- آبجکت استوریج به‌جای دیسک لوکال (بخش ۴.۲) ---
STORAGE_BACKEND=local        # یا s3
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT_URL=             # برای آروان/لیارا الزامی
S3_PUBLIC_BASE_URL=          # اختیاری، مثل آدرس CDN

# --- پیامک (بخش ۴.۳) ---
SMS_PROVIDER=console         # یا kavenegar
KAVENEGAR_API_KEY=
SMS_SENDER=

# --- ایمیل (بخش ۴.۴)