# Admin Tools (Task 21)

## Complaints management

Buyers file complaints from the customer portal (see `docs/` customer portal notes; statuses:
`OPEN` → `IN_REVIEW` → `RESOLVED`). Admins now have a dedicated screen to work through them.

### Endpoints

- `GET /api/v1/admin/complaints?page=&page_size=&status=` (auth: admin)
  - Paginated (`PaginatedResponse[AdminComplaintListItem]`), newest first, optional status filter.
  - Each item joins order + store info: `invoice_code`, `buyer_name`, `store_name`, `store_slug`, etc.
- `PATCH /api/v1/admin/complaints/{id}` body `{ status, note? }` (auth: admin)
  - Updates the complaint status and writes an admin audit log entry
    (`entity_type="complaint"`, `action="STATUS_<new>"`, label = invoice code).

### Frontend

- Page: `/admin/complaints` (added to admin nav as «شکایت‌ها»).
- Filter chips (all / open / in review / resolved), status badges, quick actions
  «شروع بررسی» and «حل شد» per row, links to the store detail page.

## Store impersonation (support tool)

Lets an admin log in as a store owner to reproduce and fix seller-reported issues.

### Endpoint

- `POST /api/v1/admin/stores/{store_id}/impersonate` (auth: admin)
  - Returns a normal `TokenResponse` (`access_token`, `refresh_token`, `user`) for the store owner.
  - 404 if the store does not exist; 400 if the owner account is inactive.
  - Every use is written to the admin audit log (`action="IMPERSONATE"`).

### Frontend

- Button «ورود به‌جای فروشنده» on each row of `/admin/stores`.
- On click, the app swaps the current session to the seller session and redirects to the seller dashboard.

### Important caveat

Impersonation **replaces the admin's browser session** with the seller session (single-token model).
To return to the admin panel, the admin must log in again. This is intentional for the MVP —
no dual-session/"return to admin" mechanism exists yet.

## Testing

`backend/tests/test_admin_tools.py` covers: listing/filtering/updating complaints,
seller access denied (403), missing complaint (404), impersonation token works on seller
endpoints, unknown store (404), non-admin blocked (403).
