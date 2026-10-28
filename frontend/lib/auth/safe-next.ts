/** A return URL from `?next=`, only if it stays inside the seller panel. */
export function safeSellerNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/seller/") || value.startsWith("//")) return null;
  return value;
}
