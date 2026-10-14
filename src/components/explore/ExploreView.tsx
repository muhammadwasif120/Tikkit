import Link from 'next/link'
import { CalendarX2 } from 'lucide-react'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Container, JsonLd, PageHero, Section } from '@/components/marketing/blocks'
import { EventCard } from './EventCard'
import { createClient } from '@/lib/supabase/server'
import { CATEGORY_DB_SLUG, CATEGORY_LABELS, CITIES, titleCase } from '@/lib/exploreContent'
import { ButtonLink, EmptyState } from '@/components/kit'
import { cn } from '@/lib/cn'

type Props = { city?: string; category?: string; q?: string; when?: string; intro?: string; heading: string; breadcrumb: { name: string; url: string }[] }

const WHEN = [['', 'Any time'], ['week', 'This week'], ['weekend', 'This weekend'], ['month', 'This month']] as const

/** Shared server view for /explore, /explore/[city] and /explore/[city]/[category]. */
export async function ExploreView({ city, category, q, when = '', intro, heading, breadcrumb }: Props) {
  const supabase = await createClient()
  const now = new Date()
  let query = supabase.from('event_listings')
    .select('id, slug, title, cover_image_url, city, area_label, venue_name, is_secret_venue, starts_at, min_price_pkr, registration_mode, capacity, seats_taken, organizer_id, category_id')
    .gte('ends_at', now.toISOString()).order('starts_at', { ascending: true }).limit(60)

  if (city) query = query.ilike('city', titleCase(city))
  if (when) {
    const end = new Date(now); end.setDate(end.getDate() + (when === 'week' ? 7 : when === 'month' ? 31 : (7 - end.getDay()) % 7 + 1))
    query = query.lte('starts_at', end.toISOString())
    if (when === 'weekend') { const start = new Date(now); start.setDate(start.getDate() + ((5 - start.getDay() + 7) % 7)); start.setHours(0, 0, 0, 0); query = query.gte('starts_at', start.toISOString()) }
  }
  if (q) query = query.ilike('title', `%${q.replace(/[%,()]/g, ' ')}%`)
  if (category) {
    const { data: cat } = await supabase.from('event_categories').select('id').eq('slug', CATEGORY_DB_SLUG[category] ?? category).maybeSingle()
    query = cat ? query.eq('category_id', cat.id) : query.eq('category_id', '00000000-0000-0000-0000-000000000000')
  }
  const { data: events } = await query

  const orgIds = [...new Set((events ?? []).map(e => e.organizer_id).filter(Boolean))] as string[]
  const { data: orgs } = orgIds.length ? await supabase.from('public_organizers').select('id, company_name, full_name').in('id', orgIds) : { data: [] }
  const orgName = (id: string | null) => { const o = orgs?.find(x => x.id === id); return o?.company_name ?? o?.full_name ?? null }

  const base = city ? `/explore/${city}` : '/explore'
  const href = (patch: Record<string, string>) => { const p = new URLSearchParams({ ...(q ? { q } : {}), ...(when ? { when } : {}), ...patch }); for (const [k, v] of [...p]) if (!v) p.delete(k); const s = p.toString(); return s ? `${base}${category ? `/${category}` : ''}?${s}` : `${base}${category ? `/${category}` : ''}` }

  const list = events ?? []
  const itemList = list.length ? {
    '@context': 'https://schema.org', '@type': 'ItemList', name: heading,
    itemListElement: list.slice(0, 20).map((e, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Event', name: e.title, startDate: e.starts_at, url: `https://www.tikkitx.com/events/${e.slug}`, eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', location: { '@type': 'Place', name: e.is_secret_venue ? 'Location shared with confirmed guests' : e.venue_name ?? e.city ?? 'Pakistan', address: { '@type': 'PostalAddress', addressLocality: e.city ?? undefined, addressCountry: 'PK' } } } })),
  } : null
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tikkitx.com' }, ...breadcrumb.map((b, i) => ({ '@type': 'ListItem', position: i + 2, name: b.name, item: b.url }))] }
  const cats = Object.entries(CATEGORY_LABELS)

  return (
    <MarketingShell>
      <JsonLd data={[crumbs, ...(itemList ? [itemList] : [])]} />
      <PageHero eyebrow="Explore" title={heading} lead={intro?.split('. ').slice(0, 2).join('. ') + (intro ? '.' : '')} />
      <Container className="pb-8">
        <form action={base + (category ? `/${category}` : '')} className="mb-5 flex flex-wrap gap-3">
          <input name="q" defaultValue={q} placeholder="Search events" aria-label="Search events" className="h-11 w-full max-w-sm rounded-[10px] border border-line-strong bg-raised px-4 text-[15px] text-fg placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 sm:h-10" />
          {when && <input type="hidden" name="when" value={when} />}
        </form>
        <div className="flex flex-wrap gap-2" aria-label="When">
          {WHEN.map(([v, l]) => <Link key={v} href={href({ when: v })} aria-current={when === v ? 'true' : undefined} className={cn('rounded-full px-4 py-1.5 text-[13px] font-medium ring-1', when === v ? 'bg-accent/12 text-accent ring-accent/40' : 'text-muted ring-line hover:text-fg')}>{l}</Link>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Category">
          {[['', 'All categories'], ...cats].map(([slug, label]) => <Link key={slug} href={`${base}${slug ? `/${slug}` : ''}${when || q ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(when ? { when } : {}) })}` : ''}`} aria-current={(category ?? '') === slug ? 'true' : undefined} className={cn('rounded-full px-3.5 py-1 text-xs font-medium ring-1', (category ?? '') === slug ? 'bg-magenta/12 text-magenta ring-magenta/40' : 'text-muted ring-line hover:text-fg')}>{label}</Link>)}
        </div>
      </Container>

      <Section className="pt-6">
        {list.length === 0 ? (
          <EmptyState icon={<CalendarX2 className="h-6 w-6" />} title="No events match yet" description="Try another date or category, or host the first one yourself." action={<ButtonLink href="/auth/login?flow=organizer-signup">Start free trial</ButtonLink>} />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map(e => <li key={e.id}><EventCard e={e} org={orgName(e.organizer_id)} /></li>)}</ul>
        )}
      </Section>

      {!city && (
        <Section className="pt-0">
          <h2 className="text-lg font-semibold text-fg">Browse by city</h2>
          <ul className="mt-4 flex flex-wrap gap-2">{CITIES.map(c => <li key={c}><Link href={`/explore/${c}`} className="rounded-full bg-surface px-4 py-1.5 text-sm text-muted shadow-card hover:text-fg">Events in {titleCase(c)}</Link></li>)}</ul>
        </Section>
      )}
      {city && intro && (
        <Section className="pt-0"><div className="max-w-3xl"><h2 className="text-lg font-semibold text-fg">Events in {titleCase(city)}</h2><p className="mt-3 text-[15px] leading-relaxed text-muted">{intro}</p></div></Section>
      )}
    </MarketingShell>
  )
}
