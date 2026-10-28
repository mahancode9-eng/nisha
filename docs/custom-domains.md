# Custom domains (Pro)

A seller on Pro can serve their store from their own domain, e.g.
`https://shop.example.com`, instead of `nisha.ir/store/<slug>`.

## How it works

1. **Connect**: in the panel (**دامنه اختصاصی**) the seller enters a hostname.
   The backend normalises it (lowercase, IDNA, no scheme/port/path) and refuses
   IPs and Nisha's own hosts (`CUSTOM_DOMAIN_RESERVED`, `FRONTEND_BASE_URL`,
   `API_PUBLIC_BASE_URL`). A domain can belong to one store only.
2. **Prove ownership**: the panel shows a TXT record:
   `_nisha-verify.<hostname>` → `nisha-verify=<token>`. Pressing *بررسی دوباره*
   (`POST /api/v1/seller/domain/verify`) looks it up in DNS. Changing the
   hostname issues a new token.
3. **Point it at Nisha**: a `CNAME <hostname> → CUSTOM_DOMAIN_CNAME_TARGET`
   for subdomains, or `A` records to `CUSTOM_DOMAIN_IPV4` for apex domains
   (`example.com`). The check reports whether it's pointing yet:
   `pending` (no TXT yet) → `verified` (owned, not pointing) → `active`.
4. **HTTPS**: issued automatically by Caddy on the first visit. Caddy asks
   `GET /api/v1/public/domains/tls-check?domain=…` first, which answers 200
   only for verified domains on a plan that includes custom domains, so nobody
   can make us request certificates for random names.
5. **Routing**: requests for a custom host reach Next.js, whose middleware asks
   `GET /api/v1/public/domains/resolve?host=…` (cached) and serves
   `/store/<slug>/…` for that host. The API accepts CORS from verified custom
   domains (HTTPS only), so the storefront's browser calls work there.

If the seller's plan lapses, routing, new certificates and CORS stop, but the
setup is kept, so renewing brings the domain back without redoing DNS.

## Configuration

Backend (`.env`):

```
CUSTOM_DOMAIN_CNAME_TARGET=stores.nisha.ir   # what sellers CNAME to
CUSTOM_DOMAIN_IPV4=203.0.113.10              # A record(s) for apex domains, comma-separated
CUSTOM_DOMAIN_RESERVED=nisha.ir              # nobody may claim these (or subdomains)
```

Frontend (`.env`): `NEXT_PUBLIC_SITE_URL` must be Nisha's own URL. Any other
host is treated as a possible custom domain by `middleware.ts`.

DNS on Nisha's side: point `stores.nisha.ir` (the CNAME target) at the edge
server running Caddy.

## Edge setup

`deploy/Caddyfile.custom-domains` is a ready config. Two ways to run it next to
the existing nginx (`deploy/nginx.conf.example`):

- **Caddy as the only edge (simplest).** Let Caddy own ports 80/443. Add
  Nisha's own sites to the same Caddyfile (`nisha.ir { reverse_proxy 127.0.0.1:3000 }`,
  `api.nisha.ir { reverse_proxy 127.0.0.1:9000 }`), since Caddy gets their
  certificates as well, and stop nginx.
- **Keep nginx for Nisha's hosts.** Move nginx's TLS servers to another port
  and put an nginx `stream { ssl_preread on; }` block on 443 that sends Nisha's
  own server names to that port and everything else to Caddy (e.g. port 8443).
  Port 80 goes to Caddy for custom hosts (ACME challenges and redirects).

## Testing

- Backend: `pytest tests/test_phase6b_domain.py` (DNS is faked).
- By hand on staging: connect a real subdomain you control, add the TXT and
  CNAME records, wait for DNS, press *بررسی دوباره* until it says *فعال*,
  then open `https://<your-domain>`: the store loads with a valid certificate.
