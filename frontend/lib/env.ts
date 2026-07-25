const DEFAULT_API_URL = "http://localhost:8000";
const DEFAULT_SITE_URL = "http://localhost:3000";

/**
 * Browser requests use NEXT_PUBLIC_API_URL (host-mapped port).
 * Server components in Docker use API_URL / API_INTERNAL_URL (service name) when set.
 */
export function getApiUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.API_INTERNAL_URL ??
      process.env.API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      DEFAULT_API_URL
    );
  }
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

/** Public site origin for metadata, robots, sitemap, and canonicals. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
}
