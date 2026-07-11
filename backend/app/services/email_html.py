"""RTL HTML layouts for transactional emails."""

from __future__ import annotations

from html import escape

from app.core.config import settings

_BRAND_COLOR = "#0f4c5c"
_BRAND_LIGHT = "#f0f7f8"
_TEXT_COLOR = "#1a1a1a"
_MUTED_COLOR = "#5c5c5c"


def _frontend_url() -> str:
    return settings.FRONTEND_BASE_URL.rstrip("/")


def layout(*, title: str, body_html: str) -> str:
    """Shared RTL email shell with Nisha branding."""
    site_url = escape(_frontend_url())
    return f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{escape(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:{_BRAND_COLOR};padding:24px 32px;text-align:center;">
              <span style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">نیشا</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:{_TEXT_COLOR};font-size:15px;line-height:1.8;">
              {body_html}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e5e7eb;background-color:{_BRAND_LIGHT};text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:{_MUTED_COLOR};">نیشا — بازار آنلاین</p>
              <a href="{site_url}" style="font-size:13px;color:{_BRAND_COLOR};text-decoration:none;">{site_url}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def verification_email_html(*, full_name: str, verify_link: str) -> str:
    safe_name = escape(full_name)
    safe_link = escape(verify_link)
    expire_hours = max(1, settings.EMAIL_VERIFICATION_EXPIRE_MINUTES // 60)
    body = f"""
<p style="margin:0 0 16px;font-size:16px;">سلام {safe_name}،</p>
<p style="margin:0 0 24px;color:{_MUTED_COLOR};">
  از ثبت‌نام شما در نیشا سپاسگزاریم. برای تکمیل حساب کاربری، لطفاً ایمیل خود را تأیید کنید.
</p>
<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
  <tr>
    <td style="border-radius:8px;background-color:{_BRAND_COLOR};">
      <a href="{safe_link}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">
        تأیید ایمیل
      </a>
    </td>
  </tr>
</table>
<p style="margin:0 0 8px;font-size:13px;color:{_MUTED_COLOR};">
  اگر دکمه کار نکرد، این لینک را در مرورگر خود باز کنید:
</p>
<p style="margin:0 0 24px;font-size:13px;word-break:break-all;">
  <a href="{safe_link}" style="color:{_BRAND_COLOR};">{safe_link}</a>
</p>
<p style="margin:0;font-size:12px;color:{_MUTED_COLOR};">
  این لینک تا {expire_hours} ساعت معتبر است. اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.
</p>"""
    return layout(title="تأیید ایمیل نیشا", body_html=body)


def password_recovery_html(*, code: str) -> str:
    safe_code = escape(code)
    body = f"""
<p style="margin:0 0 16px;font-size:16px;">سلام،</p>
<p style="margin:0 0 24px;color:{_MUTED_COLOR};">
  درخواست بازیابی رمز عبور برای حساب شما در نیشا ثبت شد. کد زیر را در صفحه بازیابی وارد کنید:
</p>
<p style="margin:0 0 28px;text-align:center;">
  <span style="display:inline-block;padding:16px 32px;font-size:28px;font-weight:bold;letter-spacing:6px;
               background-color:{_BRAND_LIGHT};border:2px dashed {_BRAND_COLOR};border-radius:8px;color:{_BRAND_COLOR};">
    {safe_code}
  </span>
</p>
<p style="margin:0;font-size:12px;color:{_MUTED_COLOR};">
  این کد محدود به زمان است. اگر شما این درخواست را نداده‌اید، رمز عبور خود را تغییر دهید و با پشتیبانی تماس بگیرید.
</p>"""
    return layout(title="بازیابی رمز عبور نیشا", body_html=body)


def simple_notification_html(*, heading: str, message: str) -> str:
    body = f"""
<p style="margin:0 0 12px;font-size:17px;font-weight:bold;">{escape(heading)}</p>
<p style="margin:0;color:{_MUTED_COLOR};">{escape(message)}</p>"""
    return layout(title=heading, body_html=body)
