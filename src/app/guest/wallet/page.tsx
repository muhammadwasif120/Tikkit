import Link from 'next/link'
import { Receipt, Ticket, Wallet } from 'lucide-react'
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, Progress, type BadgeTone } from '@/components/kit'
import { loadBookings } from '@/lib/attendee'
import { requireAttendee } from '@/lib/data/viewer'
import { fmtDate, pkr } from '@/lib/format'

export const metadata = { title: 'Wallet' }

const STATUS: Record<string, { label: string; tone: BadgeTone }> = { submitted: { label: 'Under review', tone: 'warning' }, approved: { label: 'Approved', tone: 'success' }, rejected: { label: 'Rejected', tone: 'danger' } }
const KIND: Record<string, string> = { pass_purchase: 'Class pass', class_booking: 'Class booking', space_booking: 'Space reservation' }

export default async function WalletPage() {
  const { supabase, profile } = await requireAttendee()
  const [b, { data: subs }, { data: prods }] = await Promise.all([
    loadBookings(supabase, profile.id),
    supabase.from('payment_submissions').select('id, amount_pkr, status, reference, created_at, reason, registrations!inner(attendee_id, events(title))').eq('registrations.attendee_id', profile.id).order('created_at', { ascending: false }).limit(40),
    supabase.from('product_payments').select('id, kind, amount_pkr, status, created_at, reject_reason').eq('payer_id', profile.id).order('created_at', { ascending: false }).limit(40),
  ])
  type Pay = { id: string; title: string; amount: number; status: string; at: string; note: string | null }
  const pays: Pay[] = [
    ...(subs ?? []).map(s => ({ id: s.id, title: ((s.registrations as unknown as { events: { title: string } | null } | null)?.events?.title) ?? 'Event ticket', amount: s.amount_pkr ?? 0, status: s.status, at: s.created_at, note: s.reason ?? (s.reference ? `Ref ${s.reference}` : null) })),
    ...(prods ?? []).map(p => ({ id: p.id, title: KIND[p.kind] ?? 'Payment', amount: p.amount_pkr, status: p.status, at: p.created_at, note: p.reject_reason })),
  ].sort((x, y) => +new Date(y.at) - +new Date(x.at))
  const paid = pays.filter(p => p.status === 'approved').reduce((a, p) => a + p.amount, 0)
  const pending = pays.filter(p => p.status === 'submitted').reduce((a, p) => a + p.amount, 0)
  const passes = b.rows.filter(r => r.kind === 'pass_purchase')
  const due = b.rows.filter(r => r.status === 'awaiting_payment' && !r.past)

  return (
    <div className="k-fade-up space-y-8">
      <PageHeader title="Wallet" description="Your passes and everything you have paid." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-xs text-muted">Paid so far</p><p className="mt-1 text-2xl font-semibold tnum text-fg">{pkr(paid)}</p></Card>
        <Card className="p-5"><p className="text-xs text-muted">Under review</p><p className="mt-1 text-2xl font-semibold tnum text-fg">{pkr(pending)}</p></Card>
        <Card className="p-5"><p className="text-xs text-muted">Payments due</p><p className="mt-1 text-2xl font-semibold tnum text-fg">{due.length}</p>{due.length > 0 && <Link href="/guest/tickets" className="text-xs font-medium text-accent hover:underline">Pay now</Link>}</Card>
      </div>

      <section aria-labelledby="pass-title" data-tour="passes">
        <h2 id="pass-title" className="mb-3 text-lg font-semibold tracking-tight text-fg">Passes</h2>
        {passes.length === 0 ? <Card><EmptyState icon={<Ticket className="h-6 w-6" />} title="No passes" description="Buy a class pass to book sessions without paying each time." action={<Link href="/classes" className="text-sm font-medium text-accent hover:underline">See classes</Link>} /></Card> : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {passes.map(p => (
              <li key={p.id} className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line">
                <div className="flex items-center justify-between gap-2"><p className="font-semibold text-fg">{p.title}</p><Badge tone={p.status === 'active' ? 'success' : 'warning'}>{p.status.replace('_', ' ')}</Badge></div>
                {p.total ? <><div className="mt-4"><Progress value={Math.round(((p.total - (p.left ?? 0)) / p.total) * 100)} /></div><p className="mt-2 text-sm text-muted"><span className="font-semibold text-fg tnum">{p.left}</span> of {p.total} sessions left</p></> : <p className="mt-4 text-sm text-muted">Unlimited sessions</p>}
                {p.validUntil && <p className="mt-1 text-xs text-subtle">Valid until {fmtDate(p.validUntil)}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="pay-title">
        <h2 id="pay-title" className="mb-3 text-lg font-semibold tracking-tight text-fg">Payment history</h2>
        {pays.length === 0 ? <Card><EmptyState icon={<Receipt className="h-6 w-6" />} title="No payments yet" description="Receipts you upload and what the organizer decided show up here." /></Card> : (
          <Card><CardHeader title="Receipts" description="Organizers approve each payment by hand" action={<Wallet className="h-5 w-5 text-subtle" aria-hidden />} /><CardBody>
            <ul className="divide-y divide-line">{pays.map(p => { const st = STATUS[p.status] ?? { label: p.status, tone: 'neutral' as BadgeTone }; return (
              <li key={p.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-fg">{p.title}</p><p className="text-xs text-muted">{fmtDate(p.at)}{p.note ? ` · ${p.note}` : ''}</p></div><Badge tone={st.tone}>{st.label}</Badge><span className="tnum w-24 text-right text-sm font-medium text-fg">{pkr(p.amount)}</span></li>
            ) })}</ul>
          </CardBody></Card>
        )}
      </section>
    </div>
  )
}
