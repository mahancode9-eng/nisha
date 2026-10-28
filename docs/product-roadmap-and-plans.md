# Nisha product roadmap & plan monetization

Grounded in what Nisha already is: manual-payment commerce for small Iranian / Instagram-style stores, with Free → Basic → Pro → Enterprise entitlements.

Current plan gates (from `entitlement_service.py`):

| Entitlement | Free | Basic | Pro | Enterprise |
|-------------|------|-------|-----|------------|
| max_products | 30 | 200 | unlimited | unlimited |
| max_product_images | 3 | 8 | 8 | 8 |
| product_video | — | — | ✓ | ✓ |
| custom_fields | — | ✓ | ✓ | ✓ |
| discounts | — | ✓ | ✓ | ✓ |
| analytics_max_days | 7 | 30 | 90 | 90 |
| guest_checkout | — | ✓ | ✓ | ✓ |
| badge_trust | — | — | ✓ | ✓ |
| badge_premium | — | — | — | ✓ |
| store_theme | — | — | ✓ | ✓ |
| excel_export | — | — | ✓ | ✓ |
| store_pages | — | — | ✓ | ✓ |
| priority_support | — | — | — | ✓ |

---

## What to build (by priority)

### Critical — money and trust break without these

1. **Payment-proof chase** — SMS/Telegram nudge when an order stays unpaid / no receipt
2. **Shareable product + invoice links** — strong OG preview (image, price, store) for Instagram / Telegram / WhatsApp
3. **Stable guest checkout + order tracking** — Free can’t sell well without this path (already a Basic unlock; keep rock-solid)
4. **Seller order inbox clarity** — pending proof → confirmed → shipped in one glance, with chat attached
5. **Hard entitlement UX** — clear “ارتقا به پایه/حرفه‌ای” when hitting product/image/discount limits (not a dead error)

### High — converts social traffic into orders

6. **Product share card / story image** — one-tap export for Stories (fits the photo-first product wizard)
7. **Telegram / WhatsApp order notify** — buyer + seller, alongside SMS
8. **Low-stock alerts** — seller ping when variants hit a threshold
9. **Saved payment methods display** — clearer card/iban on checkout and invoice
10. **Abandoned cart / open invoice recovery** — “سفارشت هنوز بازه” link
11. **Pro analytics that sell Pro** — 30/90-day trends, top products, conversion (days already gated)
12. **Discount campaigns UX** — “۱۰٪ برای فالوورها” templates (Basic+)

### Medium — differentiation and retention

13. **Collections / homepage sections** — featured, new, sale
14. **Trust & premium badges on storefront** (Pro/Enterprise — make them *visible* and desirable)
15. **Custom store pages** (Pro) — About, Shipping, FAQ that buyers actually read
16. **Theme packs** (Pro) — 3–5 polished skins, not infinite DIY
17. **Excel export of orders/products** — accountants care (planned on Basic+; still gated in code until that phase)
18. **Review highlights on product page** — social proof without clutter
19. **Seller quick-replies in chat** — “کد پیگیری”، «کارت به کارت»، «موجود شد»
20. **Multi-staff / roles** — later Enterprise hook

### Low — nice later, don’t prioritize now

21. Wishlist / follow store
22. Loyalty points
23. Public marketplace search across all stores
24. AI product description
25. Advanced CRM / email blasts
26. White-label domain (Enterprise later)
27. Native app feature parity before web monetization is strong

---

## Plan ideas that push upgrades

Make gated features **painful to miss** and **easy to want**.

### Free → Basic (main volume upgrade)

Sell **“بتونی بفروشی”**, not a feature checklist:

| Hook | Why it converts |
|------|-----------------|
| Guest checkout | Free can’t take casual Instagram buyers |
| Discounts | “کد برای استوری” is the seller’s daily weapon |
| 200 products + 8 photos | Catalog growth hits the wall fast |
| Custom fields | Size/note/file for real handmade/digital shops |
| 30-day analytics | “کدوم پست فروش آورد؟” |

**In-product prompts:** when they try discount, guest checkout, 4th image, or product #31 → upgrade sheet with soft social proof (“فروشنده‌های شبیه تو بعد از پایه سفارش بیشتری گرفتن”).

### Basic → Pro (recommended — primary money plan)

Sell **“فروشگاه جدی”**:

| Hook | Why it converts |
|------|-----------------|
| Product video | Already gated; show locked upload in the wizard |
| Store themes | Visual envy when they see a Pro store |
| Trust badge | “فروشگاه تأییدشده نیشا” next to the store name |
| Unlimited products | Fear of ceiling |
| Store pages + Excel + 90-day stats | “کسب‌وکار” language |

**Positioning:** Basic = open the shop. Pro = look professional and scale. Keep `is_recommended` on Pro and surface yearly savings clearly.

### Pro → Enterprise

Sell **status + support**, not more toggles:

| Hook | Why it converts |
|------|-----------------|
| Premium badge | Status in a crowded Instagram niche |
| Priority support | “پشتیبانی اختصاصی / پاسخ زیر ۲ ساعت” |
| Future | Staff seats, custom domain, higher SMS quota, API |

Don’t add fluff to Enterprise until Pro is clearly better than Basic in the UI.

---

## Extra monetization plays

1. **Usage add-ons** (not only tiers): extra SMS pack, extra storage/images, extra staff seat
2. **Quarterly/yearly bias** — surface “۳ ماهه = ۲ ماه + ۱ ماه هدیه” on the paywall (prices already exist)
3. **Trial of Pro for 7 days** after first paid order on Basic — highest converting moment
4. **“Unlock for this product” micro-upsell** — e.g. video on one SKU needs Pro
5. **Success metrics on billing page** — “این ماه ۱۲ سفارش از مهمان · بدون پایه این‌ها نمی‌اومدن”
6. **Remove brand / custom domain** only on Enterprise later — classic FOMO for bigger shops

---

## Suggested build order (next 2–3 cycles)

1. Paywall + entitlement UX polish (Critical)
2. Share cards + payment nudges (Critical / High)
3. Make Pro visibly better on the live store (theme + badge + video)
4. Then Medium store merchandising

---

## Landing / voice

Animated landing + hand-made story sections are merged. Product Persian voice is **casual spoken «تو»** (see `.claude/skills/persian-voice/SKILL.md`). Legal pages stay clearer.

## Next step (optional)

Turn this into a concrete plan matrix (Free / Basic / Pro / Enterprise × feature flags) ready to drop into `backend/app/services/entitlement_service.py`.

---

## Expanded idea backlog (50+ more)

Researched and adapted from Shopify / Shopify Plus, Instagram→WhatsApp commerce patterns, Odoo & ElasticFunnels-style stacks, and Iranian store builders (پادرو، دیجی‌فای، انار). Ideas are rewritten for Nisha’s model: **manual / card-to-card payments, Instagram-style sellers, Persian RTL, Free→Basic→Pro→Enterprise**.

Suggested plan tags: `Free+` = improve for all · `Basic+` · `Pro+` · `Ent+` · `Add-on` = sell as pack.

### Critical+ (ops & cashflow)

| # | Feature | Why it matters | Plan |
|---|---------|----------------|------|
| 28 | **Automatic payment-proof OCR / match** — read transfer amount + last 4 digits from receipt image | Cuts seller time; competitors still do screenshot hell | Pro+ / Ent+ |
| 29 | **Partial payments & deposits** (Shopify Plus B2B pattern) — 30% now, rest on ship | Big ticket handmade / custom orders | Pro+ |
| 30 | **COD / پرداخت در محل** toggle with fee | Digify / local norms; expands buyer trust | Basic+ |
| 31 | **Installment / BNPL hooks** (دیجی‌پی، تارا، اسنپ‌پی style) | Iranian sellers expect “الان بخر بعداً بده” | Ent+ / partner |
| 32 | **Fraud / duplicate-order signals** — same phone, same proof reused | Protects sellers on flash sales | Pro+ |
| 33 | **Order edit window with audit log** — change address/qty before confirm | Fewer chat renegotiations | Basic+ |
| 34 | **Refund & store-credit wallet** | Retention without full cash-out pain | Pro+ |
| 35 | **Shipping rate matrix** by city / weight / post vs tipax | Checkout conversion killer if missing | Basic+ |
| 36 | **Tracking number + carrier SMS** | “کجا مرسوله؟” is #1 support ticket | Basic+ |
| 37 | **SLA timers on pending proof** — auto-cancel unpaid after N hours | Clears fake carts; frees stock | Basic+ |

### High+ (social selling & conversion)

| # | Feature | Why it matters | Plan |
|---|---------|----------------|------|
| 38 | **Instagram post → product import** (پادرو pattern) — paste reel/post URL, draft SKU | Fits photo-first wizard | Pro+ |
| 39 | **Click-to-WhatsApp / Telegram from product** with prefilled “می‌خوام اینو” | IG discovery → chat → Nisha checkout | Basic+ |
| 40 | **Unified social inbox** (IG DM + WA + TG + Nisha chat) | Queek / social-inbox pattern; one queue | Pro+ / Ent+ |
| 41 | **Catalog sync to WhatsApp Business catalogue** | Meta commerce; send product messages in chat | Pro+ |
| 42 | **Live-sale comment keyword → auto DM product link** | Instagram Live shopping replacement (2025+) | Pro+ |
| 43 | **Story sticker pack generator** — price, countdown, “لینک در بیو” | Share cards 2.0 | Basic+ |
| 44 | **UTM / source tags on share links** — Story vs Bio vs Telegram | Pro analytics that sell Pro | Pro+ |
| 45 | **Order bump / checkbox upsell** at checkout (“همراه با این…”) | ElasticFunnels / Shopify apps staple | Pro+ |
| 46 | **One-click post-purchase upsell** page | AOV lift without Plus pricing | Pro+ |
| 47 | **“Customers also bought” / related products** | Odoo cross-sell; keeps PDP minimal | Basic+ |
| 48 | **Back-in-stock notify** (SMS/Telegram) | Captures demand when variants sell out | Basic+ |
| 49 | **Waitlist / preorder with deposit** | Drops & limited drops for fashion | Pro+ |
| 50 | **Flash sale scheduler** (Launchpad-lite) — time-box price + stock | Campaign FOMO without Shopify Plus | Pro+ |
| 51 | **Discount: first-order only, free-shipping threshold, BOGO** | Beyond simple % codes | Basic+ → Pro+ |
| 52 | **Affiliate / influencer codes with payout report** | IG creators are the growth channel | Pro+ |
| 53 | **Gift message + gift wrap fee** | High margin, low complexity | Basic+ |
| 54 | **Digital goods delivery** — file unlock after proof confirm | Already adjacent to downloads portal | Basic+ |
| 55 | **Appointment / service booking SKU** | Beauty, consult, classes sellers | Pro+ |

### Medium+ (catalog, inventory, storefront)

| # | Feature | Why it matters | Plan |
|---|---------|----------------|------|
| 56 | **Barcode / SKU scan for warehouse packing** | Scales past 50 orders/day | Pro+ |
| 57 | **Multi-location inventory** (home + انبار) | Oversell prevention | Ent+ |
| 58 | **Bundle / kit products** — sell set, deplete parts | Gift boxes, starters | Pro+ |
| 59 | **Wholesale / B2B price lists** by customer tag | Shopify B2B lite for resellers | Ent+ |
| 60 | **Quantity breaks** (10+ = cheaper) | Wholesale without full B2B | Pro+ |
| 61 | **Draft → scheduled publish** | Drop culture | Basic+ |
| 62 | **SEO fields + schema.org Product JSON-LD** (انار pattern) | Google / ترب discovery | Basic+ |
| 63 | **Torob / Emalls / price-comparison feed export** | Iranian acquisition channels | Pro+ |
| 64 | **Blog / lookbook pages** | Digify-style content SEO | Pro+ |
| 65 | **Custom domain + HTTPS** (remove nisha subdomain) | Trust + branding | Pro+ / Ent+ |
| 66 | **Remove “Powered by Nisha”** | Classic upgrade FOMO | Ent+ |
| 67 | **Homepage builder blocks** — hero, collection row, trust bar | Without full theme DIY | Pro+ |
| 68 | **Mega menu / nested categories** | Already have parent categories — finish UX | Basic+ |
| 69 | **Size guide & size chart attachment** | Fashion returns down | Basic+ |
| 70 | **360° / multi-angle gallery enhancements** | Luxury feel on PDP | Pro+ |
| 71 | **Product recommendations AI** (simple collab filter) | After catalog is rich | Ent+ |
| 72 | **Duplicate product / bulk edit** | Catalog ops speed | Basic+ |
| 73 | **CSV / Excel import products** | Migration from Digikala / Excel | Pro+ |
| 74 | **Image background removal (AI)** | Shopify Magic-style catalog polish | Pro+ / Add-on |
| 75 | **Auto alt-text & Persian SEO title suggestions** | Same AI assist wave | Pro+ |

### Medium+ (CRM, messaging, retention)

| # | Feature | Why it matters | Plan |
|---|---------|----------------|------|
| 76 | **Customer segments** — VIP, new, at-risk, unpaid | CRM without Salesforce weight | Pro+ |
| 77 | **Broadcast SMS / Telegram to segment** (quota-gated) | Re-engagement | Pro+ / Add-on |
| 78 | **Birthday / anniversary coupon auto-send** | Loyalty lite | Pro+ |
| 79 | **RFM scores on customer profile** | Who to chase manually | Ent+ |
| 80 | **Saved addresses book UX improvements** | Faster repeat checkout | Free+ |
| 81 | **Reorder button on customer portal** | Repeat GMV | Basic+ |
| 82 | **Subscription / refill products** with dunning-style reminders | ElasticFunnels pattern; adapt to manual pay | Ent+ |
| 83 | **Complaint SLA dashboard** (you have complaints — make ops) | Trust & admin quality | Pro+ |
| 84 | **NPS / post-delivery mini survey** | Review funnel | Basic+ |
| 85 | **Review request automation** after delivered | Social proof engine | Basic+ |
| 86 | **Photo reviews / UGC gallery** | Instagram loop back to store | Pro+ |
| 87 | **Chatbot FAQ from store pages** (shipping, return) | Deflects 40% of DMs | Pro+ |
| 88 | **Away message + business hours** on chat | WhatsApp Business parity | Basic+ |
| 89 | **Canned flows**: “send invoice”, “send payment card”, “ask for size” | Seller speed | Basic+ |
| 90 | **Assign chat to staff seat** | Multi-person shops | Ent+ |

### Ops, analytics, platform (High–Medium for monetization)

| # | Feature | Why it matters | Plan |
|---|---------|----------------|------|
| 91 | **Revenue attribution by channel** — IG Story link vs search vs Telegram | Makes Pro analytics irresistible | Pro+ |
| 92 | **Cohort / repeat purchase rate** | Shows “why upgrade” on billing | Pro+ |
| 93 | **Export accounting package** — PDF factor + Excel for حسابدار | Iran ops reality | Pro+ |
| 94 | **Tax / invoice fields** (شرکت، شناسه ملی) for B2B buyers | Enterprise wedge | Ent+ |
| 95 | **Staff permissions** — orders only / catalog only / finance | Shopify staff parity | Ent+ |
| 96 | **Activity audit log** | Who confirmed payment | Ent+ |
| 97 | **Shopify Flow–lite automations** — if unpaid 6h → SMS; if delivered → review ask | Pro differentiator | Pro+ / Ent+ |
| 98 | **Webhooks + public API** | Agencies & power sellers | Ent+ |
| 99 | **Multi-store under one seller account** | Plus “expansion stores” lite | Ent+ |
| 100 | **Staging / preview theme before publish** | Safer Pro themes | Pro+ |
| 101 | **A/B test homepage hero** (same-URL split) | Conversion science | Ent+ |
| 102 | **Bot protection on flash checkout** | Plus-style launch safety | Ent+ |
| 103 | **Priority queue during drops** | Fairness + paid upgrade | Ent+ / Add-on |
| 104 | **SMS quota dashboard + top-up packs** | Usage monetization | Add-on |
| 105 | **Storage / media quota + top-up** | Video & gallery growth | Add-on |
| 106 | **White-glove onboarding call** | Enterprise close | Ent+ |
| 107 | **Dedicated success manager** | Enterprise retention | Ent+ |
| 108 | **SLA 99.9% + status page** | Enterprise procurement | Ent+ |
| 109 | **SSO / Google login for staff** | Agency & team shops | Ent+ |
| 110 | **Mobile seller PWA offline packing list** | Flutter/web bridge | Pro+ |

### Iran / local-market specifics

| # | Feature | Why it matters | Plan |
|---|---------|----------------|------|
| 111 | **Sheba + card number pretty invoice card** (copy buttons, bank logo) | Manual pay UX win | Free+ |
| 112 | **Bale / Eitaa / Gap notify channels** | Domestic messengers beyond TG | Pro+ |
| 113 | **Post / tipax / chapar label PDF** | Fulfillment speed | Pro+ |
| 114 | **City/province picker with post price API** | Fewer failed deliveries | Basic+ |
| 115 | **National ID / postal code validation** soft warnings | Address quality | Basic+ |
| 116 | **Enamad / trust seals slot** on storefront | Buyer confidence | Pro+ |
| 117 | **Digikala catalog import** (دیجی‌فای pattern) for multi-channel sellers | Migration magnet | Pro+ |
| 118 | **“Buy with ecosystem” partner embeds** later | Only if partnership exists | Ent+ partner |
| 119 | **Persian voice note → text in seller chat** | IG sellers live on voice | Pro+ |
| 120 | **Rial display helpers** (تومان vs ریال toggle) | Avoid 10× price mistakes | Free+ |

### Buyer experience polish (often under-prioritized)

| # | Feature | Why it matters | Plan |
|---|---------|----------------|------|
| 121 | **Guest order magic link** (no password) via SMS | Tracking without account friction | Basic+ |
| 122 | **Order timeline UI** — paid → packed → shipped → delivered | Trust | Free+ |
| 123 | **Estimated delivery date** at checkout | Conversion | Basic+ |
| 124 | **Return / exchange request flow** | Reduces angry DMs | Pro+ |
| 125 | **Size exchange suggestions** | Fashion vertical | Pro+ |
| 126 | **Recently viewed products** | Soft remarketing on-site | Free+ |
| 127 | **Share cart link** (seller sends prefilled cart) | DM selling superpower | Basic+ |
| 128 | **Passwordless customer login (OTP)** | Iran mobile-first | Free+ |
| 129 | **Dark-store / password gate for private drops** | Exclusive IG drops | Pro+ |
| 130 | **Age / region gate** for restricted goods | Compliance lite | Ent+ |

---

## Sources / inspiration (for diligence)

- Shopify Plus plan features (checkout extensibility, B2B, Launchpad, Flow, multi-store, staff, fraud/bot) — [Shopify Help · Plus](https://help.shopify.com/en/manual/intro-to-shopify/pricing-plans/plans-features/shopify-plus-plan)
- Instagram → website checkout + WhatsApp catalog / click-to-chat selling (2025–2026 social commerce shift)
- Unified social commerce inboxes (WhatsApp / IG / Telegram catalog + payment link patterns)
- Odoo eCommerce (abandoned cart, cross-sell, stock notify, subscriptions)
- ElasticFunnels-style stack (order bumps, one-click upsells, dunning, inventory alerts)
- Iranian builders: پادرو (IG post→product, card-to-card), دیجی‌فای (BNPL, Digikala import, Torob), انار (manual pay methods, schema.org, SMS status)

---

## How to use this backlog

1. **Do not build all of it.** Pick from Critical / Critical+ and High / High+ first.
2. Every feature should answer: *Does it increase paid orders, reduce seller time, or make a paid plan obviously better?*
3. Prefer features that **strengthen existing gates** (guest checkout, discounts, video, theme, badge, analytics, excel) before inventing new Ent-only toggles.
4. Use **Add-ons** (SMS, storage, seats) to monetize heavy users without forcing Enterprise.
