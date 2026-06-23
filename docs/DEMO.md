# Nisha MVP - 5-minute demo script

Prerequisites: start the stack with Docker Compose, run migrations, and seed demo data if you want the sample seller/store content. See [README.md](../README.md) for the local setup commands.

## 1. Customer flow (2 min)

1. Open `http://localhost:3000` and browse the demo store, or go directly to `/store/demo-store`.
2. Add a product to the cart and go to checkout.
3. Fill in buyer details, choose a payment method, and submit the order.
4. Save the invoice code and invoice password shown after checkout.
5. Upload a payment proof image from the order page.
6. Open `Track order` at `/track-order` with the invoice code and password to confirm status and proofs.
7. Open `/invoice/{invoiceCode}`, enter the password, and print the invoice if needed.

## 2. Seller flow (2 min)

1. Log in at `/seller/login` with `seller@example.com` / `seller123456`.
2. Open the dashboard to show metrics, low stock, and recent orders.
3. Open the order detail page for the guest order.
4. Confirm payment, or reject it to restore stock.
5. Move the order through the fulfillment statuses if you want to show the lifecycle.

## 3. Admin flow (1 min)

1. Log in at `/admin/login` with `admin@example.com` / `admin123456`.
2. Show the platform dashboard with totals and recent orders.
3. Open the stores view and deactivate or reactivate a store.
4. Open the orders view to browse all stores and inspect or update an order detail.

## UI notes

- The UI defaults to Persian and RTL.
- Use the shared language switch in the shell if you want to show the English labels.
- Theme mode can be switched between light, dark, and system from the shared header/shell.

## Screenshot placeholders

| Step | Screenshot |
|------|------------|
| Store catalog | _(add store-grid.png)_ |
| Checkout success | _(add checkout-invoice.png)_ |
| Track order | _(add track-order.png)_ |
| Seller confirm payment | _(add seller-order.png)_ |
| Admin dashboard | _(add admin-dashboard.png)_ |

## Verify before presenting

```bash
docker compose exec backend python -m pytest -q
cd frontend && npm run build
```
