/** Client-side store slug helpers (mirrors backend `app.utils.slug`). */

const NON_SLUG = /[^a-z0-9]+/g;

export function slugify(text: string, maxLength = 80): string {
  let slug = text.toLowerCase().trim().replace(NON_SLUG, "-").replace(/^-+|-+$/g, "");
  if (!slug) slug = "store";
  return slug.slice(0, maxLength).replace(/-+$/g, "");
}

export function isValidStoreSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
