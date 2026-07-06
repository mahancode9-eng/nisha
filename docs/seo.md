# SEO

Roadmap task 18. Storefront pages expose sitemap, robots, meta/OpenGraph tags and Schema.org JSON-LD.

## Environment

- `NEXT_PUBLIC_SITE_URL` (**required in production**) — public site origin, e.g. `https://nisha.example.com`. Used for canonical URLs, OpenGraph and the sitemap.
- `API_INTERNAL_URL` (optional) — server-side base URL for the backend when it differs from `NEXT_PUBLIC_API_URL` (e.g. `http://backend:8000` inside docker-compose). Falls back to `NEXT_PUBLIC_API_URL`.

## Pieces

- `frontend/app/robots.ts` — serves `/robots.txt`; allows `/`, disallows `/seller`, `/admin`, `/customer`, `/invoice`; points to `/sitemap.xml`.
- `frontend/app/sitemap.ts` — serves `/sitemap.xml`; reads `GET /api/v1/public/sitemap` (backend `app/api/v1/public/sitemap.py`, active stores and products only) and lists the homepage, store pages and product pages. Falls back to the homepage if the API is unreachable, revalidates hourly.
- `frontend/app/store/[slug]/page.tsx` — `generateMetadata` (title, description, canonical, OpenGraph, Twitter) plus `OnlineStore` JSON-LD; data fetched server-side with a 5-minute revalidate.
- `frontend/app/store/[slug]/products/[productId]/page.tsx` — same for products, with `Product` JSON-LD including `offers` (priceCurrency `IRR`, InStock/OutOfStock) and `aggregateRating` when reviews exist.

## After deploy

1. Set `NEXT_PUBLIC_SITE_URL` and rebuild the frontend.
2. Verify `https://your-domain/robots.txt` and `https://your-domain/sitemap.xml`.
3. Submit the sitemap in Google Search Console.
