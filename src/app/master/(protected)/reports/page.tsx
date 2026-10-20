import Link from 'next/link'
import { Badge, Card, CardBody, PageHeader } from '@/components/kit'
import ReportActions from '@/components/master/ReportActions'
import { requireAdmin } from '@/lib/data/admin'
import { adminRpc } from '@/lib/data/adminRpc'
import { fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'

export const metadata = { title: 'Reports' }

type Rep = { id: string; kind: 'organizer' | 'attendee' | 'event'; subject_id: string; category: string; details: string; status: string; admin_notes: string | null; created_at: string; reviewed_at: string | null; reporter_id: string | null; reporter: string | null; reporter_role: string | null; subject: string | null; event_id: string | null; event_slug: string | null; reports_on_subject: number }

const TABS = [['', 'Needs review'], ['open', 'Open'], ['reviewing', 'In review'], ['actioned', 'Actioned'], ['dismissed', 'Dismissed'], ['all', 'All']] as const
const CAT: Record<string, string> = { fraud_scam: 'Fraud or scam', no_refund: 'No refund given', fake_event: 'Fake event', harassment: 'Harassment', impersonation: 'Impersonation', inappropriate_content: 'Inappropriate content', safety: 'Safety concern', other: 'Other' }
const TONE: Record<string, 'warning' | 'info' | 'success' | 'neutral'> = { open: 'warning', reviewing: 'info', actioned: 'success', dismissed: 'neutral' }

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = '' } = await searchParams
  const { supabase } = await requireAdmin()
  const all = (await adminRpc<Rep[]>(supabase, 'admin_list_reports', { p_status: status && status !== 'all' ? status : null })) ?? []
  const rows = status === '' ? all.filter(r => r.status === 'open' || r.status === 'reviewing') : all
  const subjectHref = (r: Rep) => r.kind === 'event' ? (r.event_slug ? `/events/${r.event_slug}` : null) : `/master/users/${r.subject_id}`
  return (
    <div className="k-fade-up space-y-6">
      <PageHeader title="Reports" description="Reports from organizers and attendees about each other and about events. Payments and refunds are between the organizer and the guest." />
      <div role="tablist" aria-label="Report status" className="flex flex-wrap gap-1 text-[13px] font-medium">
        {TABS.map(([id, text]) => <Link key={id} href={id ? `/master/reports?status=${id}` : '/master/reports'} role="tab" aria-selected={status === id} className={cn('rounded-lg px-3.5 py-1.5', status === id ? 'bg-raised text-fg' : 'text-muted hover:text-fg')}>{text}</Link>)}
      </div>
      {rows.length === 0 ? <Card><CardBody><p className="py-6 text-center text-sm text-muted">Nothing here.</p></CardBody></Card> : (
        <ul className="space-y-4">{rows.map(r => {
          const href = subjectHref(r)
          return (
            <li key={r.id}><Card><CardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={TONE[r.status] ?? 'neutral'}>{r.status}</Badge><Badge tone="danger">{CAT[r.category] ?? r.category}</Badge><Badge>{r.kind === 'attendee' ? 'Guest reported' : r.kind === 'organizer' ? 'Organizer reported' : 'Event reported'}</Badge>
                {r.reports_on_subject > 1 && <Badge tone="warning">{r.reports_on_subject} reports on this {r.kind}</Badge>}
                <span className="ml-auto text-xs text-muted">{fmtDateTime(r.created_at)}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs uppercase tracking-wider text-subtle">About</p><p className="mt-1 text-sm font-medium text-fg">{href ? <Link href={href} target={r.kind === 'event' ? '_blank' : undefined} className="hover:underline">{r.subject ?? 'Unknown'}</Link> : (r.subject ?? 'Unknown')}</p></div>
                <div><p className="text-xs uppercase tracking-wider text-subtle">Reported by</p><p className="mt-1 text-sm text-fg">{r.reporter_id ? <Link href={`/master/users/${r.reporter_id}`} className="hover:underline">{r.reporter ?? 'Unknown'}</Link> : 'Deleted account'} <span className="text-muted">({r.reporter_role ?? '-'})</span></p></div>
              </div>
              <p className="whitespace-pre-line rounded-xl bg-raised p-4 text-sm leading-relaxed text-fg">{r.details}</p>
              {r.kind !== 'event' && <p className="text-xs text-muted">To act on the person, open their account and suspend it. For an event, use the Events page.</p>}
              <ReportActions id={r.id} status={r.status} notes={r.admin_notes} />
            </CardBody></Card></li>
          )
        })}</ul>
      )}
    </div>
  )
}
