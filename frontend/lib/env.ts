const DEFAULT_API_URL = "http://localhost:8000";

/**
 * Browser requests use NEXT_PUBLIC_API_URL (host-mapped port).
 * Server components in Docker use API_URL (service name) when set.
 */
export function getApiUrl(): string {
  if (typeof window === "undefined" && process.env.API_URL) {
    return process.env.API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}
