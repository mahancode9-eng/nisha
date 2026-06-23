# Customer and Order Ownership Migration Guide

## What changed

- Customer accounts now store profile data, saved addresses, recovery requests, and order ownership.
- Orders keep their invoice code and invoice password.
- Existing guest checkout, public invoice access, and seller/admin order flows remain valid.

## Database migration

1. Run the Alembic upgrade:

```bash
cd backend
alembic upgrade head
```

2. Verify the schema now includes:

- `customer_accounts.postal_code`
- `orders.customer_id`
- `customer_addresses`
- `customer_password_recoveries`
- `order_claims`
- `customer_order_receipts`
- `order_complaints`
- `customer_reviews`

3. No data backfill is required. Existing orders stay guest-accessible because the invoice code and invoice password are unchanged.

## Application rollout

1. Deploy the backend with the customer routes and services.
2. Deploy the frontend with the customer portal screens.
3. Confirm these smoke checks:

- Guest checkout still creates an order and returns invoice credentials.
- Public invoice tracking still works with invoice code and password.
- A customer can register, log in, recover a password, and edit their profile.
- A customer can claim an old guest order with invoice credentials.
- A customer can save addresses and place an authenticated checkout.

## Operational notes

- Claimed orders remain accessible by invoice credentials.
- Guest orders do not need to be migrated manually.
- If a customer already claimed an order, claiming it again with the same account should be idempotent.
- If a different customer tries to claim an already owned order, the API returns a conflict.
- Complaint notifications are in-app only in this version.

## Rollback

- If you need to roll back the application, revert the backend and frontend deploys.
- The migration is additive, but do not downgrade the database after production data has been written into the new tables unless you are intentionally discarding those records.
