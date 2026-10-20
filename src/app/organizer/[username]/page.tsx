import ReportButton from '@/components/reports/ReportButton'
import { safeHttpUrl, safeInstagram } from '@/lib/url'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Globe, Instagram, MessageCircle, ShieldCheck, Mail } from 'lucide-react'
import { Avatar, ButtonLink } from '@/components/kit'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { JsonLd } from '@/components/marketing/blocks'
import { EventCard } from '@/components/explore/EventCard'
import { createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ username: string }> }
export const revalidate = 300

async function load(username: string) {
  const supabase = await createClient()
  const { data: org } = await supabase.from('public_organizers').select('*').eq('username', username.toLowerCase()).maybeSingle()
  if (!org) return null
  const { data: events } = await supabase.from('event_listings')
    .select('id, slug, title, cover_image_url, city, area_label, venue_name, is_secret_venue, starts_at, min_price_pkr, registration_mode, capacity, seats_taken')
    .eq('organizer_id', org.id!).gte('ends_at', new Date().toISOString()).order('starts_at').limit(30)
  return { org, events: events ?? [] }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const d = await load(username)
  if (!d) return { title: 'Organizer not found' }
  const name = d.org.company_name ?? d.org.full_name ?? username
  const url = `https://www.tikkitx.com/organizer/${username}`
  const description = d.org.bio?.slice(0, 155) ?? `Upcoming events by ${name} on TIKKIT X. Register and get your QR ticket.`
  return { title: `${name}: Events on Tikkit`, description, alternates: { canonical: url }, openGraph: { title: `${name}: Events on Tikkit`, description, url, images: [{ url: d.org.cover_url ?? d.org.logo_url ?? '/og-image.jpg', width: 1200, height: 630, alt: name }] }, twitter: { card: 'summary_large_image', title: `${name}: Events on Tikkit`, description } }
}

export default async function OrganizerPage({ params }: Props) {
  const { username } = await params
  const d = await load(username)
  if (!d) notFound()
  const { org, events } = d
  const name = org.company_name ?? org.full_name ?? username
  const url = `https://www.tikkitx.com/organizer/${username}`

  return (
    <MarketingShell>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'ProfilePage', '@id': url, mainEntity: { '@type': 'Organization', name, url, description: org.bio ?? undefined, logo: org.logo_url ?? undefined, sameAs: [org.instagram ? `https://instagram.com/${org.instagram.replace('@', '')}` : null, org.website].filter(Boolean) } }} />
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-surface">
          {org.cover_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={org.cover_url} alt="" className="h-40 w-full object-cover sm:h-56" />
            : <div className="h-32 w-full sm:h-44" style={{ backgroundImage: 'var(--k-glow)' }} />}
          <div className="flex flex-wrap items-end gap-5 px-6 pb-6">
            <div className="-mt-10 rounded-full ring-4 ring-surface"><Avatar name={name} src={org.logo_url ?? org.avatar_url} size={84} /></div>
            <div className="min-w-0 flex-1 pt-3">
              <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{name}{org.is_verified && <ShieldCheck className="h-5 w-5 text-success" aria-label="Verified organizer" />}</h1>
              <p className="text-sm text-muted">{[org.city, `${org.upcoming_event_count ?? 0} upcoming`].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {org.whatsapp && <ButtonLink href={`https://wa.me/${org.whatsapp.replace(/\D/g, '')}`} variant="secondary" size="sm" target="_blank" rel="noopener noreferrer" leading={<MessageCircle className="h-4 w-4" />}>WhatsApp</ButtonLink>}
              {org.contact_email && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(org.contact_email) && <ButtonLink href={`mailto:${org.contact_email}`} variant="secondary" size="sm" leading={<Mail className="h-4 w-4" />}>Email</ButtonLink>}
              {safeInstagram(org.instagram) && <ButtonLink href={`https://instagram.com/${safeInstagram(org.instagram)}`} variant="ghost" size="sm" target="_blank" rel="noopener noreferrer" leading={<Instagram className="h-4 w-4" />}>Instagram</ButtonLink>}
              {safeHttpUrl(org.website) && <ButtonLink href={safeHttpUrl(org.website)!} variant="ghost" size="sm" target="_blank" rel="noopener noreferrer" leading={<Globe className="h-4 w-4" />}>Website</ButtonLink>}
            </div>
          </div>
          <div className="px-6 pb-4"><ReportButton kind="organizer" subjectId={org.id!} subjectName={name} /></div>
          {org.bio && <p className="max-w-3xl whitespace-pre-line px-6 pb-6 text-[15px] leading-relaxed text-muted">{org.bio}</p>}
        </div>

        <h2 className="mb-5 mt-10 text-xl font-semibold tracking-tight text-fg">Upcoming events</h2>
        {events.length === 0 ? <p className="text-muted">No upcoming events right now.</p> : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{events.map(e => <li key={e.id}><EventCard e={e} /></li>)}</ul>
        )}
      </div>
    </MarketingShell>
  )
}
