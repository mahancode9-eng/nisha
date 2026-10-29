import { NextResponse, type NextRequest } from "next/server";
import { getApiUrl, getSiteUrl } from "@/lib/env";
import { ownHosts, requestHost, routeForCustomDomain } from "@/lib/domains/routing";

const POSITIVE_TTL_MS = 5 * 60_000;
const NEGATIVE_TTL_MS = 60_000;
const RESOLVE_TIMEOUT_MS = 2_000;

const cache = new Map<string, { slug: string | null; expires: number }>();

/** The store slug a custom host serves, or null. Lookup failures are not cached. */
async function resolveSlug(host: string): Promise<string | null> {
  const hit = cache.get(host);
  if (hit && hit.expires > Date.now()) return hit.slug;

  try {
    const res = await fetch(
      `${getApiUrl()}/api/v1/public/domains/resolve?host=${encodeURIComponent(host)}`,
      { signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS), cache: "no-store" },
    );
    if (res.status === 404) {
      cache.set(host, { slug: null, expires: Date.now() + NEGATIVE_TTL_MS });
      return null;
    }
    if (!res.ok) return null;
    const body = (await res.json()) as { slug?: string };
    const slug = body.slug ?? null;
    cache.set(host, {
      slug,
      expires: Date.now() + (slug ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS),
    });
    return slug;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const siteUrl = getSiteUrl();
  const host = requestHost(request.headers.get("x-forwarded-host"), request.headers.get("host"));
  if (!host || ownHosts(siteUrl).has(host)) return NextResponse.next();

  const slug = await resolveSlug(host);
  if (!slug) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const route = routeForCustomDomain(pathname, slug);

  if (route.kind === "rewrite") {
    const url = request.nextUrl.clone();
    url.pathname = route.pathname;
    return NextResponse.rewrite(url);
  }
  if (route.kind === "main-site") {
    return NextResponse.redirect(new URL(`${route.pathname}${search}`, siteUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|css|js|map|txt|xml|woff|woff2)$).*)",
  ],
};
