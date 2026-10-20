export type Period = 'weekly' | 'monthly'
export type MState = 'paid' | 'due_soon' | 'overdue' | 'lapsed' | 'pending' | 'awaiting_first' | 'pending_first'

const WINDOW_DAYS: Record<Period, number> = { weekly: 3, monthly: 7 }
export const PERIOD_WORD: Record<Period, string> = { weekly: 'week', monthly: 'month' }

/** Mirrors the database: where a membership stands, from its status, paid-through date and any receipt waiting. */
export function membershipState(m: { status: string; validUntil: string | null; period: Period; pending: boolean }, now = Date.now()): MState {
  if (m.status === 'awaiting_payment') return 'awaiting_first'
  if (m.status === 'payment_submitted') return 'pending_first'
  if (m.pending) return 'pending'
  if (m.status === 'expired') return 'lapsed'
  const until = m.validUntil ? new Date(m.validUntil).getTime() : 0
  if (until < now) return 'overdue'
  if (until <= now + WINDOW_DAYS[m.period] * 86_400_000) return 'due_soon'
  return 'paid'
}

/** A renewal payment can be sent once the due date is close, or after it has passed. */
export const canPayRenewal = (s: MState) => s === 'due_soon' || s === 'overdue' || s === 'lapsed'

export const STATE_LABEL: Record<MState, string> = {
  paid: 'Paid', due_soon: 'Due soon', overdue: 'Overdue', lapsed: 'Lapsed', pending: 'Receipt sent', awaiting_first: 'Awaiting payment', pending_first: 'Receipt sent',
}
export const STATE_TONE: Record<MState, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  paid: 'success', due_soon: 'warning', overdue: 'danger', lapsed: 'neutral', pending: 'info', awaiting_first: 'warning', pending_first: 'info',
}

/** A wa.me link that opens WhatsApp with a message ready to send. Pakistani numbers become +92 format. */
export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0')) d = '92' + d.slice(1)
  else if (d.length === 10 && d.startsWith('3')) d = '92' + d
  if (d.length < 11) return null
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`
}

export const DEFAULT_REMINDER = 'Hi {name}, your {product} payment of {amount} {when}. Please pay to {account} and send the screenshot here, or upload it in the app: {link}. Thank you!'

export function fillReminder(tpl: string, v: { name: string; product: string; amount: string; when: string; account: string; link: string }) {
  return tpl.replace(/\{(name|product|amount|when|account|link)\}/g, (_, k: keyof typeof v) => v[k])
}
