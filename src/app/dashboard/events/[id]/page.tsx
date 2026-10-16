import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { Eye, Lock, MapPin, QrCode, Share2, Users } from 'lucide-react'
import { Badge, ButtonLink, Card, CardBody, CardHeader, PageHeader, Progress, StatCard } from '@/components/kit'
import EventForm, { toLocal, type EventValues } from '@/components/events/EventForm'
import { Announcements, CopyButton, GateLinks, StatusActions } from '@/components/events/EventManage'
import { requireOrganizer } from '@/lib/data/viewer'
import { eventFormContext } from '@/lib/data/events'
import { fmtDateTime, pkrShort } from '@/lib/format'
import { cn } from '@/lib/cn'

const TABS = [
  { id: 'overview', label: 'Overview' }, { id: 'details', label: 'Details and tickets' },
  { id: 'announce', label: 'Announcements' }, { id: 'door', label: 'Door team' },
] as const
const tone = { draft: 'neutral', published: 'success', completed: 'info', cancelled: 'danger', archived: 'neutral' } as const

export default async function EventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab = 'overview' }] = await Promise.all([params, searchParams])
  const org = await requireOrganizer()
  const { supabase, entitlements, isManager } = org

  const { data: event } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
  if (!event) notFound()

  const [{ data: tickets }, { data: secrets }, { data: links }, { data: regs }, { data: anns }, { data: gates }] = await Promise.all([
    supabase.from('ticket_types').select('*').eq('event_id', id).order('sort'),
    supabase.from('event_secrets').select('venue_address, reveal_at, reveal_notified_at').eq('event_id', id).maybeSingle(),
    supabase.from('event_payment_accounts').select('payment_account_id').eq('event_id', id),
    supabase.from('registrations').select('status, price_paid_pkr, ticket_type_id').eq('event_id', id).limit(10000),
    supabase.from('event_announcements').select('id, body, created_at, send_email').eq('event_id', id).order('created_at', { ascending: false }),
    supabase.from('gate_staff_links').select('id, label, expires_at, revoked_at, last_used_at, event_ids').contains('event_ids', [id]).order('created_at', { ascending: false }),
  ])

  const rows = regs ?? []
  const confirmed = rows.filter(r => ['confirmed', 'checked_in', 'no_show'].includes(r.status))
  const checkedIn = rows.filter(r => r.status === 'checked_in').length
  const pending = rows.filter(r => ['requested', 'payment_submitted'].includes(r.status)).length
  const revenue = confirmed.reduce((s, r) => s + (r.price_paid_pkr ?? 0), 0)
  const perTicket = (tickets ?? []).map(t => ({ ...t, sold: confirmed.filter(r => r.ticket_type_id === t.id).length }))

  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`
  const publicUrl = event.slug ? `${origin}/events/${event.slug}` : ''

  let ctx: Awaited<ReturnType<typeof eventFormContext>> | null = null
  let initial: EventValues | null = null
  if (tab === 'details') {
    ctx = await eventFormContext(org)
    initial = {
      id: event.id, title: event.title, description: event.description ?? '', categoryId: event.category_id ?? '', city: event.city ?? '',
      coverUrl: event.cover_image_url ?? '', startsAt: toLocal(event.starts_at), endsAt: toLocal(event.ends_at),
      secret: event.is_secret_venue, areaLabel: event.area_label ?? '', venueName: event.venue_name ?? '', venueAddress: event.venue_address ?? '',
      secretAddress: secrets?.venue_address ?? '', revealAt: toLocal(secrets?.reveal_at),
      approval: event.registration_mode === 'approval', idOnly: event.require_id_verified, isPrivate: event.visibility === 'private',
      capacity: event.capacity ? String(event.capacity) : '',
      tiers: (tickets ?? []).map(t => ({ key: t.id, id: t.id, name: t.name, price: String(t.price_pkr), qty: t.quantity ? String(t.quantity) : '', ends: toLocal(t.sales_end), vip: t.is_vip })),
      accountIds: (links ?? []).map(l => l.payment_account_id),
      status: event.status,
    }
    if (initial.tiers.length === 0) initial.tiers = [{ key: 'new-1', name: 'General', price: '', qty: '', ends: '', vip: false }]
  }

  const tabs = isManager ? TABS.filter(t => t.id === 'overview' || t.id === 'announce') : TABS
  if (isManager && (tab === 'details' || tab === 'door')) redirect(`/dashboard/events/${id}`)

  const annLimit = entitlements?.limits.announcements_per_event
  const remaining = typeof annLimit === 'number' && annLimit >= 0 ? Math.max(0, annLimit - (anns?.length ?? 0)) : null

  return (
    <div className="k-fade-up">
      <PageHeader
        eyebrow={fmtDateTime(event.starts_at)}
        title={event.title}
        description={event.is_secret_venue ? 'Secret location' : [event.venue_name, event.city].filter(Boolean).join(', ') || undefined}
        actions={
          <>
            <Badge tone={tone[event.status]}>{event.status}</Badge>
            {event.admin_status !== 'live' && <Badge tone="danger">{event.admin_status}</Badge>}
            <ButtonLink href={`/dashboard/guests?event=${id}`} variant="secondary" leading={<Users className="h-4 w-4" />}>Guests</ButtonLink>
            <ButtonLink href={`/dashboard/event-day?event=${id}`} leading={<QrCode className="h-4 w-4" />}>Event Day</ButtonLink>
          </>
        }
      />

      <nav aria-label="Event sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(t => (
          <Link key={t.id} href={`/dashboard/events/${id}?tab=${t.id}`} aria-current={tab === t.id ? 'page' : undefined}
            className={cn('-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg')}>
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'overview' && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Numbers">
            <StatCard label="Confirmed" value={String(confirmed.length)} hint={event.capacity ? `of ${event.capacity}` : 'no cap'} icon={<Users className="h-4 w-4" />} />
            <StatCard tone="magenta" label="Revenue" value={pkrShort(revenue)} hint="approved payments" />
            <StatCard label="Pending" value={String(pending)} hint="waiting on you" />
            <StatCard label="Checked in" value={String(checkedIn)} hint={confirmed.length ? `${Math.round((checkedIn / Math.max(1, confirmed.length)) * 100)}% of guests` : 'doors closed'} icon={<QrCode className="h-4 w-4" />} />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Tickets" description="Sold per type" action={isManager ? undefined : <ButtonLink href={`/dashboard/events/${id}?tab=details`} variant="ghost" size="sm">Edit</ButtonLink>} />
              <CardBody className="space-y-4">
                {perTicket.map(t => (
                  <div key={t.id}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-fg">{t.name}{t.is_vip && <Badge tone="magenta">VIP</Badge>}</span>
                      <span className="tnum text-muted">{t.sold}{t.quantity ? ` / ${t.quantity}` : ''} · PKR {t.price_pkr.toLocaleString('en-PK')}</span>
                    </div>
                    {t.quantity ? <Progress value={Math.min(100, Math.round((t.sold / t.quantity) * 100))} tone={t.is_vip ? 'accent' : 'accent'} /> : null}
                  </div>
                ))}
                {perTicket.length === 0 && <p className="text-sm text-muted">No tickets yet.</p>}
              </CardBody>
            </Card>

            <div className="space-y-6">
              {!isManager && (
                <Card>
                  <CardHeader title="Status" />
                  <CardBody className="space-y-4"><StatusActions id={id} status={event.status} /></CardBody>
                </Card>
              )}
              {event.status === 'published' && publicUrl && (
                <Card>
                  <CardHeader title="Share" action={<Share2 className="h-4 w-4 text-subtle" aria-hidden />} />
                  <CardBody className="space-y-3">
                    <p className="break-all rounded-lg bg-raised p-2.5 font-mono text-xs text-fg">{publicUrl}</p>
                    <div className="flex gap-2"><CopyButton text={publicUrl} /><ButtonLink href={publicUrl} variant="ghost" size="sm" target="_blank" leading={<Eye className="h-4 w-4" />}>Preview</ButtonLink></div>
                  </CardBody>
                </Card>
              )}
              {event.is_secret_venue && (
                <Card>
                  <CardHeader title="Secret location" action={<Lock className="h-4 w-4 text-violet" aria-hidden />} />
                  <CardBody className="space-y-1 text-sm">
                    <p className="flex items-start gap-2 text-fg"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-subtle" aria-hidden />{secrets?.venue_address || 'No address set yet'}</p>
                    <p className="text-muted">
                      {secrets?.reveal_notified_at ? `Revealed ${fmtDateTime(secrets.reveal_notified_at)}`
                        : secrets?.reveal_at ? `Reveals ${fmtDateTime(secrets.reveal_at)}` : 'You will announce it yourself.'}
                    </p>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'details' && ctx && initial && <EventForm mode="edit" initial={initial} {...ctx} />}
      {tab === 'announce' && <Announcements eventId={id} items={anns ?? []} remaining={remaining} />}
      {tab === 'door' && <GateLinks eventId={id} links={gates ?? []} origin={origin} />}
    </div>
  )
}
