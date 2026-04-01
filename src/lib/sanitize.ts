import DOMPurify from 'isomorphic-dompurify'

/**
 * Strips all HTML tags and returns plain text.
 * Use this wherever user-supplied content is rendered as text — guards against
 * future regressions if a rendering path is ever changed to dangerouslySetInnerHTML.
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

/**
 * Sanitizes HTML to a safe subset (bold, italic, links, lists).
 * Use this only if rich text rendering via dangerouslySetInnerHTML is ever added.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORCE_BODY: true,
  })
}
