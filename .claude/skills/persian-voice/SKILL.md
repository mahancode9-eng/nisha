---
name: persian-voice
description: Nisha's Persian UI voice and copy rules. Use whenever writing or editing any Persian user-facing text in this repo (frontend strings, backend error messages, Flutter app_fa.arb, emails, docs shown to users), or when asked to "humanize" Persian copy.
---

# Nisha Persian voice

Nisha talks like a friendly person on the phone with a shop owner — warm, modern, spoken.
Readers are busy sellers and buyers. Sound like a helpful friend, not a brochure or a bot.

## 1. Register: casual «تو» (product UI)

- Address the reader as «تو» in product UI: «می‌خوای»، «می‌تونی»، «بزن»، «ببین»، «بیا».
- Short imperatives are fine: «ذخیره کن»، «ادامه بده»، «بزن بریم».
- Prefer spoken forms: «می‌شه»، «نیست»، «لازم نیست»، «تمام».
- Still polite — never rude or slangy-insulting. Warm friend, not street fight.

| Avoid (bookish / robot) | Write (spoken) |
|---|---|
| می‌باشد / می‌باشند | است / هستن |
| نمایید / کنید (when stiff) | کن / بزن / بفرست |
| جهت / به منظور | برای |
| در صورتی که | اگر |
| لطفاً اقدام فرمایید | این کار رو بکن |
| فروشگاه خود را ایجاد کنید | فروشگاهت رو بساز |

Legal pages (`/terms`, `/privacy`, `/complaints`) may stay a bit clearer and complete, but still plain — no officialese.

## 2. Say it short, say it once

- Lead with what matters. Cut warm-ups («لازم به ذکر است»، «همان‌طور که می‌دانید»).
- One idea per sentence. Most UI lines fit in ~12 words.
- Buttons: 1–3 words, verb-led: «ذخیره»، «ثبت سفارش»، «بزن بریم».

## 3. Errors, empty states, confirmations

- Error = what happened + what to do. No blame.
  - «بارگذاری نشد. اینترنت رو چک کن و دوباره امتحان کن.»
- Empty = why empty + next step.
  - «هنوز سفارشی نداری. لینک فروشگاهت رو برای مشتری‌ها بفرست.»
- Confirmations name the thing: «این محصول حذف بشه؟ برنمی‌گرده.»
- Success: short past tense — «ذخیره شد.»

## 4. No machine-writing tells

- No hype: «بی‌نظیر»، «فوق‌العاده»، «انقلابی»، «بهترین تجربه».
- No fake authority: «هزاران فروشگاه»، «مورد اعتماد همه».
- No dash (— –) inside Persian; use «،» or split.
- No English-idiom calques («تجربه‌ای بی‌دردسر رقم بزن»).
- Don't sound like a translated SaaS landing.

## 5. Typography

- Half-space (ZWNJ): «می‌کنی»، «نمی‌شه»، «سفارش‌ها»، «کارت‌به‌کارت».
- Persian «ی» / «ک» only (not Arabic ي / ك).
- Persian punctuation: «،» «؛» «؟» and guillemets «» when quoting.
- Ellipsis is «…», not "...".
- User-facing numbers via `formatMoney` / `fa-IR`.

## 6. Glossary

| Concept | Word |
|---|---|
| seller / seller panel | فروشنده / پنل فروشنده |
| buyer at checkout | خریدار |
| registered shopper | حساب مشتری |
| order / invoice code / password | سفارش / کد فاکتور / رمز فاکتور |
| payment receipt | رسید پرداخت |
| card-to-card | کارت‌به‌کارت |
| subscription plan | پلن |
| storefront | ویترین / صفحه فروشگاه |
| sign in / sign up | ورود / ثبت‌نام |

## 7. Checking

Run `node scripts/check-persian-copy.mjs` from the repo root.
It flags officialese, "...", Arabic letters, Latin punctuation in Persian, missing half-spaces, and hype.
Informal «تو» is **allowed** (and preferred) in product UI.
