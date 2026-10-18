import ReportButton from '@/components/reports/ReportButton'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, Lock, MapPin, ShieldCheck, Users } from 'lucide-react'
import { Avatar, Badge } from '@/components/kit'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { JsonLd } from '@/components/marketing/blocks'
import RegisterPanel, { type Tier } from '@/components/events/RegisterPanel'
import { createClient } from '@/lib/supabase/server'
import { fmtDateTime, pkr } from '@/lib/format'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ref?: string }> }

async function load(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_event', { p_slug: slug })
  const ev = data?.[0]
  if (!ev || !ev.id) return null
  const [{ data: tiers }, { data: org }, { data: cat }] = await Promise.all([
    supabase.from('public_ticket_types').select('*').eq('event_id', ev.id).order('sort'),
    supabase.from('public_organizers').select('*').eq('id', ev.organizer_id!).maybeSingle(),
    ev.category_id ? supabase.from('event_categories').select('name').eq('id', ev.category_id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  return { supabase, ev, tiers: tiers ?? [], org, category: cat?.name ?? null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const d = await load(slug)
  if (!d) return { title: 'Event not found' }
  const { ev } = d
  const title = `${ev.title} | ${ev.city ?? 'Pakistan'}`
  const description = (ev.description ?? `${ev.title} on ${fmtDateTime(ev.starts_at)}. Get your tickets on TIKKIT X.`).slice(0, 155)
  const url = `https://www.tikkitx.com/events/${ev.slug}`
  return {
    title, description, alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', images: [{ url: ev.cover_image_url ?? '/og-image.jpg', width: 1200, height: 630, alt: ev.title ?? 'Event' }] },
    twitter: { card: 'summary_large_image', title, description, images: [ev.cover_image_url ?? '/og-image.jpg'] },
  }
}

export default async function EventPage({ params, searchParams }: Props) {
  const [{ slug }, { ref = '' }] = await Promise.all([params, searchParams])
  const d = await load(slug)
  if (!d) notFound()
  const { supabase, ev, tiers, org, category } = d

  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = user ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle() : { data: null }

  const tierRows: Tier[] = tiers.map(t => ({ id: t.id!, name: t.name!, price: t.price_pkr!, original: t.original_price_pkr, isVip: !!t.is_vip, seatsLeft: t.seats_left, salesEnd: t.sales_end }))
    .filter((t, i) => { const r = tiers[i]; return !r.sales_start || new Date(r.sales_start) <= new Date() }).filter((t, i) => !tiers[i].sales_end || new Date(tiers[i].sales_end!) > new Date())
  const ended = new Date(ev.ends_at ?? ev.starts_at!).getTime() < Date.now()
  const soldOut = (ev.capacity !== null && (ev.seats_taken ?? 0) >= ev.capacity) || (tierRows.length > 0 && tierRows.every(t => t.seatsLeft === 0))
  const isSecret = !!ev.is_secret_venue
  const where = isSecret ? (ev.area_label ?? ev.city) : [ev.venue_name, ev.area_label ?? ev.city].filter(Boolean).join(', ')
  const lowest = tierRows.length ? Math.min(...tierRows.map(t => t.price)) : 0

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Event', name: ev.title, description: ev.description ?? undefined,
    startDate: ev.starts_at, endDate: ev.ends_at ?? undefined, eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', image: ev.cover_image_url ?? undefined,
    location: { '@type': 'Place', name: isSecret ? 'Location shared with confirmed guests' : ev.venue_name ?? ev.city ?? 'Pakistan', address: { '@type': 'PostalAddress', addressLocality: ev.city ?? undefined, addressCountry: 'PK', streetAddress: isSecret ? undefined : ev.venue_address ?? undefined } },
    organizer: org ? { '@type': 'Organization', name: org.company_name ?? org.full_name, url: org.username ? `https://www.tikkitx.com/organizer/${org.username}` : undefined } : undefined,
    offers: tierRows.map(t => ({ '@type': 'Offer', name: t.name, price: t.price, priceCurrency: 'PKR', availability: t.seatsLeft === 0 ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', url: `https://www.tikkitx.com/events/${ev.slug}` })),
  }

  return (
    <MarketingShell>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-surface">
          {ev.cover_image_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={ev.cover_image_url} alt="" className="h-56 w-full object-cover sm:h-80" />
            : <div className="h-40 w-full sm:h-56" style={{ backgroundImage: 'var(--k-glow)' }} />}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-canvas/90 to-transparent" aria-hidden />
        </div>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">{category && <Badge tone="accent">{category}</Badge>}{isSecret && <Badge tone="violet">Secret location</Badge>}{ev.registration_mode === 'approval' && <Badge tone="info">Approval required</Badge>}{ev.require_id_verified && <Badge tone="success">Verified IDs only</Badge>}</div>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">{ev.title}</h1>
            <ul className="mt-6 space-y-3 text-[15px] text-muted">
              <li className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-accent" aria-hidden /><span className="text-fg">{fmtDateTime(ev.starts_at)}</span></li>
              <li className="flex items-center gap-3">{isSecret ? <Lock className="h-5 w-5 text-violet" aria-hidden /> : <MapPin className="h-5 w-5 text-accent" aria-hidden />}<span className="text-fg">{where || 'Location to be announced'}</span>{isSecret && <span className="text-muted">Address shared with confirmed guests</span>}</li>
              {ev.capacity && <li className="flex items-center gap-3"><Users className="h-5 w-5 text-accent" aria-hidden /><span>{Math.max(0, ev.capacity - (ev.seats_taken ?? 0))} places left</span></li>}
              {lowest > 0 && <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-accent" aria-hidden /><span>From {pkr(lowest)}</span></li>}
            </ul>
            {ev.description && <div className="mt-8"><h2 className="text-lg font-semibold text-fg">About this event</h2><p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">{ev.description}</p></div>}
            {org && (
              <Link href={org.username ? `/organizer/${org.username}` : '#'} className="mt-10 flex items-center gap-4 rounded-2xl bg-surface p-5 shadow-card transition-colors hover:bg-raised">
                <Avatar name={org.company_name ?? org.full_name ?? 'Organizer'} src={org.logo_url ?? org.avatar_url} size={52} />
                <div className="min-w-0 flex-1"><p className="text-xs text-subtle">Hosted by</p><p className="flex items-center gap-2 truncate font-semibold text-fg">{org.company_name ?? org.full_name}{org.is_verified && <ShieldCheck className="h-4 w-4 text-success" aria-label="Verified organizer" />}</p>{org.bio && <p className="truncate text-sm text-muted">{org.bio}</p>}</div>
              </Link>
            )}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              <ReportButton kind="event" subjectId={ev.id!} subjectName={ev.title ?? 'This event'} />
              {org?.id && <ReportButton kind="organizer" subjectId={org.id} subjectName={org.company_name ?? org.full_name ?? 'This organizer'} />}
            </div>
          </div>
          <aside className="lg:sticky lg:top-24">
            <RegisterPanel eventId={ev.id!} slug={ev.slug!} tiers={tierRows} approval={ev.registration_mode === 'approval'} signedIn={!!user} role={me?.role ?? null} isSecret={isSecret} initialRef={ref} soldOut={soldOut} ended={ended} />
          </aside>
        </div>
      </div>
    </MarketingShell>
  )
}
