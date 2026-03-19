/**
 * Generate an SEO-friendly slug from any string.
 * e.g. "Tech Summit Karachi 2026!" → "tech-summit-karachi-2026"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')                       // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')        // strip accent marks
    .replace(/[^a-z0-9\s-]/g, '')          // keep alphanumeric, space, hyphen
    .trim()
    .replace(/[\s]+/g, '-')                // spaces → hyphens
    .replace(/-+/g, '-')                   // collapse multiple hyphens
    .replace(/^-+|-+$/g, '')               // trim leading/trailing hyphens
    .slice(0, 70)                           // cap length
}

/**
 * Build the canonical event slug: "<title-slug>-<first-8-chars-of-uuid>"
 * e.g. "tech-summit-karachi-2026-5d4c0941"
 */
export function buildEventSlug(title: string, id: string): string {
  const base = slugify(title)
  const short = id.replace(/-/g, '').slice(0, 8)
  return base ? `${base}-${short}` : short
}

/** Returns true if the string looks like a full UUID (v4). */
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}
