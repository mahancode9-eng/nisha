# Discount Codes

Roadmap task 17. Sellers can create percent-based or fixed-amount discount codes with usage caps, expiry dates and minimum order amounts. Buyers apply a code at checkout and the discount is validated and consumed atomically on the backend.

## Data model

- Table `discount_codes` (migration `20260706_0014_discount_codes`), unique per store on the normalized (uppercase) code.
- Columns: `code`, `description`, `discount_type` (`PERCENT` | `FIXED`), `percent_off`, `amount_off`, `min_order_amount`, `max_uses`, `used_count`, `starts_at`, `expires_at`, `is_active`.
- `orders` gained `discount_code` (snapshot of the applied code) and `discount_amount` (default 0). `total_amount = subtotal - discount_amount`.

## Backend

- `app/models/discount.py` — `DiscountCode` model.
- `app/services/discount_service.py` — CRUD, validation (`get_valid_discount`), amount computation (`compute_discount_amount`, percent rounded to 0.01, fixed capped at subtotal), atomic consumption (`consume_discount`, UPDATE … WHERE guarded against races) and `preview_discount`.
- `app/services/checkout_service.py` — applies `discount_code` from the checkout payload for both guest and customer checkout.

### Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET/POST | `/api/v1/seller/discounts` | list / create (201) |
| GET/PUT/DELETE | `/api/v1/seller/discounts/{id}` | manage a single code (DELETE returns 204) |
| POST | `/api/v1/public/stores/{slug}/discount-preview` | `{code, subtotal}` → `{code, discount_amount, payable_amount}` (422 with a Persian message when invalid) |

Validation errors (invalid, not started, expired, max uses reached, minimum order amount not met) return HTTP 422 with Persian user-facing messages.

## Frontend

- Checkout (`/store/{slug}/checkout`): optional discount input in the order summary; “apply” calls the preview endpoint, shows the discount line and payable amount, and sends `discount_code` with the order.
- Seller management page at `/seller/discounts` (`frontend/app/seller/discounts/page.tsx`): create, activate/deactivate and delete codes. Note: not yet linked from the seller navigation — open the URL directly or add a nav link.
- API client: `frontend/lib/api/seller/discounts.ts`, types in `frontend/types/seller/discount.ts`.

## Tests

`backend/tests/test_discounts.py` covers CRUD, percent/fixed application, all rejection reasons, the preview endpoint and discount visibility in order tracking.
