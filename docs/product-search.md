# Storefront Product Search, Filters & Sorting (Task 14)

Buyers can now search, filter and sort products on the public store page. The
full browse state lives in the URL query string, so any filtered view can be
shared as a link.

## API

```
GET /api/v1/public/stores/{slug}/products
```

| Query param | Type | Default | Description |
| --- | --- | --- | --- |
| `q` | string | – | Search text (Persian-aware, see below) |
| `min_price` | decimal | – | Inclusive lower price bound |
| `max_price` | decimal | – | Inclusive upper price bound |
| `in_stock` | bool | `false` | Only products with `stock_quantity > 0` |
| `sort` | enum | `newest` | `newest`, `cheapest`, `most_expensive`, `best_selling` |
| `page` | int | `1` | 1-based page number |
| `page_size` | int | `24` | Max `60` |

Response: `{ items, total, page, page_size, has_more }` where `items` is the
same `PublicProduct` shape used by the store page.

`best_selling` orders by the total units sold per product (sum of order item
quantities across all orders).

## Persian text handling

Both the query and the searched columns (title + description) are normalized
before matching, in `backend/app/services/product_search_service.py`:

- Arabic Yeh (`\u064a`) and Alef Maksura → Persian Yeh (`\u06cc`)
- Arabic Kaf (`\u0643`) → Persian Kaf (`\u06a9`)
- Teh Marbuta → Heh, Hamza-Alef variants → plain Alef
- Tatweel and RTL marks removed
- **Half-space (ZWNJ, `\u200c`) removed entirely**, and a second
  spaces-removed haystack is matched too — so `دست ساز`, `دست‌ساز` and
  `دستساز` all find each other in both directions
- The query is tokenized on whitespace; every token must match (AND)

## Performance

Migration `20260706_0012` (PostgreSQL only, runs automatically on startup):

- enables the `pg_trgm` extension
- adds a trigram GIN index on `lower(title)` which accelerates the
  `LIKE '%…%'` lookups
- adds a btree index on `(store_id, is_active, price)` for the filter path

SQLite (used by the test suite) runs the exact same query code without any
extension. The endpoint easily stays under the 300 ms acceptance budget for
1k products per store; you can verify with the k6 scripts (`docs/load-testing.md`).

## Frontend

- `frontend/components/store/ProductBrowser.tsx` renders the search box
  (debounced 400 ms), price min/max inputs, in-stock toggle, sort select,
  result grid and pagination.
- State is stored in the URL query params `q`, `min`, `max`, `stock`, `sort`,
  `page` via `router.replace` — shareable and survives reload. Changing any
  filter resets `page`.
- With no active filters the SSR-provided product list is shown without an
  extra request.
- API helper: `searchStoreProducts` in `frontend/lib/api/public/stores.ts`.

## Tests

`backend/tests/test_public_product_search.py`:

- Persian search with plain space vs half-space vs Arabic Yeh/Kaf spellings
- Filters (price range, stock) combined with search
- `cheapest` sort consistency across pages + non-overlapping pagination
- `best_selling` puts the product with recorded sales first
