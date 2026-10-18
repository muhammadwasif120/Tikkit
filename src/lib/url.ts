/** Only http and https links from user supplied fields. A javascript: or data: link must never reach an href. */
export function safeHttpUrl(v: string | null | undefined): string | null {
  if (!v) return null
  try { const u = new URL(v.trim()); return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null } catch { return null }
}

/** An Instagram handle: letters, digits, dots and underscores only. */
export function safeInstagram(v: string | null | undefined): string | null {
  const h = (v ?? '').trim().replace(/^@/, '')
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? h : null
}
