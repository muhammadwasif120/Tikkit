const TZ = 'Asia/Karachi'

export const pkr = (n: number | null | undefined) => `PKR ${(n ?? 0).toLocaleString('en-PK')}`

/** 468000 becomes "PKR 468k", 1250000 becomes "PKR 1.3m". */
export function pkrShort(n: number | null | undefined) {
  const v = n ?? 0
  if (v >= 1_000_000) return `PKR ${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}m`
  if (v >= 10_000) return `PKR ${Math.round(v / 1000)}k`
  return pkr(v)
}

export const fmtDate = (iso: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  iso ? new Intl.DateTimeFormat('en-PK', { timeZone: TZ, ...opts }).format(new Date(iso)) : ''

export const fmtTime = (iso: string | Date | null | undefined) =>
  iso ? new Intl.DateTimeFormat('en-PK', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)) : ''

export const fmtDateTime = (iso: string | Date | null | undefined) =>
  iso ? `${fmtDate(iso)} at ${fmtTime(iso)}` : ''

/** "in 3 days", "3 hours ago". */
export function relative(iso: string | Date | null | undefined) {
  if (!iso) return ''
  const diff = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute')
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), 'hour')
  return rtf.format(Math.round(diff / 86_400_000), 'day')
}

/** yyyy-mm-dd in Pakistan time, for grouping. */
export const pkDay = (iso: string | Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))

export const initials = (name: string) => name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()
