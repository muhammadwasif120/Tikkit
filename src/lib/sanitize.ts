/**
 * Strips all HTML tags and returns plain text.
 * Regex-based so it works in both Node.js (server components) and the browser
 * without pulling in any ESM-only dependency.
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(/<[^>]*>/g, '')          // remove all tags
    .replace(/&nbsp;/g, ' ')          // decode common entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}
