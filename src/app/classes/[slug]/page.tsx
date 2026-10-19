import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MapPin, UserRound } from 'lucide-react'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { JsonLd } from '@/components/marketing/blocks'
import ClassBooker, { type MyPass, type PubPass, type PubSession } from '@/components/booking/ClassBooker'
import { createClient } from '@/lib/supabase/server'
import { pkr } from '@/lib/format'

type Props = { params: Promise<{ slug: string }> }
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
type S = { id: string; slug: string; title: string; description: string | null; cover_image_url: string | null; city: string | null; area_label: string | null; venue_name: string | null; venue_address: string | null; instructor_name: string | null; weekdays: number[]; start_time: string; duration_minutes: number; drop_in_price_pkr: number; organizer_id: string }

async function load(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_class_series', { p_slug: slug })
  const s = (data as S[] | null)?.[0]
  return s ? { supabase, s } : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await load((await params).slug); if (!d) return { title: 'Class not found' }
  const { s } = d
  return { title: `${s.title} in ${s.city ?? 'Pakistan'}`, description: (s.description ?? `${s.title}, weekly classes. Book a session on TIKKIT X.`).slice(0, 155), alternates: { canonical: `https://www.tikkitx.com/classes/${s.slug}` } }
}

export default async function ClassPage({ params }: Props) {
  const d = await load((await params).slug); if (!d) notFound()
  const { supabase, s } = d
  const [{ data: sessions }, { data: passes }, { data: { user } }] = await Promise.all([
    supabase.from('public_class_sessions').select('id, starts_at, seats_left').eq('series_id', s.id).order('starts_at').limit(24),
    supabase.from('public_pass_products').select('id, name, kind, sessions_count, validity_days, price_pkr, billing_period, period_sessions').eq('organizer_id', s.organizer_id).or(`series_id.eq.${s.id},series_id.is.null`).order('sort'),
    supabase.auth.getUser(),
  ])
  const { data: me } = user ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle() : { data: null }
  let mine: MyPass[] = []
  if (user && me?.role === 'attendee') {
    const { data } = await supabase.from('pass_purchases').select('id, sessions_total, sessions_used, pass_products(name)').eq('attendee_id', user.id).eq('organizer_id', s.organizer_id).eq('status', 'active')
    mine = ((data ?? []) as unknown as { id: string; sessions_total: number | null; sessions_used: number; pass_products: { name: string } | null }[]).map(p => ({ id: p.id, name: p.pass_products?.name ?? 'Pass', left: p.sessions_total === null ? 'unlimited' : `${p.sessions_total - p.sessions_used} left` }))
  }
  return (
    <MarketingShell>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Course', name: s.title, description: s.description ?? undefined, provider: { '@type': 'Organization', name: 'TIKKIT X' }, offers: { '@type': 'Offer', price: s.drop_in_price_pkr, priceCurrency: 'PKR' } }} />
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Class</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">{s.title}</h1>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-muted">
          <li>{s.weekdays.map(w => DAYS[w]).join(', ')} at {s.start_time.slice(0, 5)} · {s.duration_minutes} min</li>
          {s.instructor_name && <li className="flex items-center gap-1.5"><UserRound className="h-4 w-4" aria-hidden />{s.instructor_name}</li>}
          {(s.venue_name || s.city) && <li className="flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden />{[s.venue_name, s.area_label ?? s.city].filter(Boolean).join(', ')}</li>}
          <li className="tnum text-fg">{s.drop_in_price_pkr ? `${pkr(s.drop_in_price_pkr)} per session` : 'Free'}</li>
        </ul>
        {s.description && <p className="mt-6 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-muted">{s.description}</p>}
        <div className="mt-10 max-w-2xl"><ClassBooker slug={s.slug} organizerId={s.organizer_id} price={s.drop_in_price_pkr} sessions={(sessions ?? []) as PubSession[]} passes={(passes ?? []) as PubPass[]} myPasses={mine} signedIn={!!user} isAttendee={me?.role === 'attendee'} /></div>
      </div>
    </MarketingShell>
  )
}
