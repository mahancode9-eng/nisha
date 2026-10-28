/** Routing rules for stores served from a seller's own domain. Pure, so middleware stays small. */

const FILE_EXTENSION = /\.[a-zA-Z0-9]+$/;
const PASS_THROUGH_PREFIXES = ["/_next", "/api", "/favicon"];
const PASS_THROUGH_PATHS = ["/robots.txt", "/sitemap.xml"];
const MAIN_SITE_PREFIXES = ["/seller", "/admin", "/customer"];

/** The host a request was made for: proxy header first, no port, lowercase. */
export function requestHost(forwardedHost: string | null, host: string | null): string {
  const raw = (forwardedHost ?? host ?? "").split(",")[0].trim().toLowerCase();
  return raw.replace(/:\d+$/, "");
}

/** Hosts that are Nisha itself: the site host, its www variant, and local development. */
export function ownHosts(siteUrl: string): Set<string> {
  const hosts = new Set(["localhost", "127.0.0.1"]);
  try {
    const host = new URL(siteUrl).hostname.toLowerCase();
    hosts.add(host);
    hosts.add(host.startsWith("www.") ? host.slice(4) : `www.${host}`);
  } catch {
    // an unparsable site URL leaves only the local hosts
  }
  return hosts;
}

function startsWithSegment(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export type DomainRoute =
  | { kind: "next" }
  | { kind: "rewrite"; pathname: string }
  | { kind: "main-site"; pathname: string };

/** What to do with a request on a custom domain that serves store `slug`. */
export function routeForCustomDomain(pathname: string, slug: string): DomainRoute {
  if (
    PASS_THROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    PASS_THROUGH_PATHS.includes(pathname) ||
    FILE_EXTENSION.test(pathname) ||
    startsWithSegment(pathname, `/store/${slug}`)
  ) {
    return { kind: "next" };
  }
  if (MAIN_SITE_PREFIXES.some((prefix) => startsWithSegment(pathname, prefix))) {
    return { kind: "main-site", pathname };
  }
  return { kind: "rewrite", pathname: `/store/${slug}${pathname === "/" ? "" : pathname}` };
}
