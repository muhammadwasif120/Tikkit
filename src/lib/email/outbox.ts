import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

const FROM = process.env.RESEND_FROM ?? 'TIKKIT X <hello@tikkitx.com>'
const SITE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tikkitx.com'

type Row = { id: string; to_email: string; template: string; payload: Record<string, unknown>; attempts: number }
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function layout(title: string, body: string, cta?: { href: string; label: string }) {
  return `<div style="background:#070911;padding:32px 16px;font-family:Inter,Arial,sans-serif"><div style="max-width:520px;margin:0 auto;background:#0d1019;border:1px solid #242a3c;border-radius:16px;padding:32px;color:#edf0f7">
  <p style="margin:0 0 20px;font-size:20px;font-weight:800;letter-spacing:-0.02em"><span style="color:#22d3ee">TIKKIT</span> <span style="color:#22d3ee">X</span></p>
  <h1 style="margin:0 0 12px;font-size:20px">${esc(title)}</h1><div style="font-size:15px;line-height:1.6;color:#969fb7;white-space:pre-line">${body}</div>
  ${cta ? `<p style="margin:28px 0 0"><a href="${esc(cta.href)}" style="background:#22d3ee;color:#04141a;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px;display:inline-block">${esc(cta.label)}</a></p>` : ''}
  </div><p style="text-align:center;font-size:12px;color:#68718a;margin-top:16px">Two Bit Digital Ltd, Karachi</p></div>`
}

async function render(row: Row, admin: ReturnType<typeof createAdminClient>): Promise<{ subject: string; html: string } | null> {
  const p = row.payload
  if (row.template === 'announcement' || row.template === 'location_revealed') {
    const { data: ev } = await admin.from('events').select('slug, title').eq('id', String(p.event_id)).maybeSingle()
    const href = `${SITE}/events/${ev?.slug ?? ''}`
    return row.template === 'announcement'
      ? { subject: `${p.event_title}: new update`, html: layout(String(p.event_title), esc(p.body), { href, label: 'Open event' }) }
      : { subject: `${p.event_title}: the location is revealed`, html: layout('The location is revealed', 'Open your ticket to see the address and any notes from the organizer.', { href: `${SITE}/guest/tickets`, label: 'Open my ticket' }) }
  }
  if (row.template === 'team_invite') return { subject: 'You were invited to manage events on TIKKIT X', html: layout('You are invited', 'An organizer invited you to help manage their events. Sign in with this email address to accept.', { href: `${SITE}/auth/login`, label: 'Sign in' }) }
  if (row.template === 'retreat_update') return { subject: `${p.title}: new update`, html: layout(String(p.title), esc(p.body), { href: `${SITE}/guest/tickets`, label: 'See my schedule' }) }
  return null
}

/** Sends queued emails through Resend. Safe to call from a cron route or right after an action. */
export async function processOutbox(limit = 40) {
  const key = process.env.RESEND_API_KEY
  if (!key) return { sent: 0, failed: 0, skipped: 'RESEND_API_KEY missing' }
  const admin = createAdminClient()
  const { data } = await admin.from('email_outbox').select('id, to_email, template, payload, attempts').eq('status', 'queued').lt('attempts', 4).order('created_at').limit(limit)
  let sent = 0, failed = 0
  for (const row of (data ?? []) as Row[]) {
    try {
      const msg = await render(row, admin)
      if (!msg) throw new Error(`unknown template ${row.template}`)
      const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM, to: [row.to_email], subject: msg.subject, html: msg.html }) })
      if (!res.ok) throw new Error(`resend ${res.status}`)
      await admin.from('email_outbox').update({ status: 'sent', sent_at: new Date().toISOString(), attempts: row.attempts + 1 }).eq('id', row.id); sent++
    } catch (e) {
      await admin.from('email_outbox').update({ attempts: row.attempts + 1, last_error: String(e).slice(0, 200), status: row.attempts + 1 >= 4 ? 'failed' : 'queued' }).eq('id', row.id); failed++
    }
  }
  return { sent, failed }
}
