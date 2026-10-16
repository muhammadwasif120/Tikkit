import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MapPin, Users } from 'lucide-react'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import SpaceBooker from '@/components/booking/SpaceBooker'
import { createClient } from '@/lib/supabase/server'
import { pkr } from '@/lib/format'

type Props = { params: Promise<{ slug: string }> }
type S = { id: string; slug: string; name: string; kind: string; description: string | null; photos: string[]; amenities: string[]; city: string | null; area_label: string | null; address: string | null; capacity: number | null; price_pkr_per_slot: number; slot_minutes: number; max_advance_days: number; requires_approval: boolean; organizer_id: string }
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

async function load(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_space', { p_slug: slug })
  const s = (data as S[] | null)?.[0]
  return s ? { supabase, s } : null
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await load((await params).slug); if (!d) return { title: 'Space not found' }
  return { title: `${d.s.name} in ${d.s.city ?? 'Pakistan'}`, description: (d.s.description ?? `Reserve ${d.s.name} by the slot on TIKKIT X.`).slice(0, 155), alternates: { canonical: `https://www.tikkitx.com/spaces/${d.s.slug}` } }
}

export default async function SpacePage({ params }: Props) {
  const d = await load((await params).slug); if (!d) notFound()
  const { supabase, s } = d
  const [{ data: hours }, { data: { user } }] = await Promise.all([supabase.from('public_space_hours').select('weekday, opens, closes').eq('space_id', s.id).order('weekday'), supabase.auth.getUser()])
  const { data: me } = user ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle() : { data: null }
  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
        {s.photos[0]
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={s.photos[0]} alt="" className="mb-8 h-56 w-full rounded-3xl object-cover sm:h-80" /> : null}
        <p className="text-xs font-semibold uppercase tracking-[0.14em] capitalize text-accent">{s.kind}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">{s.name}</h1>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-muted"><li className="flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden />{[s.address, s.area_label ?? s.city].filter(Boolean).join(', ')}</li>{s.capacity && <li className="flex items-center gap-1.5"><Users className="h-4 w-4" aria-hidden />Up to {s.capacity}</li>}<li className="tnum text-fg">{s.price_pkr_per_slot ? `${pkr(s.price_pkr_per_slot)} per ${s.slot_minutes} min` : `Free · ${s.slot_minutes} min`}</li></ul>
        {s.description && <p className="mt-6 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-muted">{s.description}</p>}
        {s.amenities.length > 0 && <ul className="mt-4 flex flex-wrap gap-2">{s.amenities.map(a => <li key={a} className="rounded-full bg-surface px-3 py-1 text-xs text-muted shadow-card">{a}</li>)}</ul>}
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_300px]">
          <SpaceBooker spaceId={s.id} organizerId={s.organizer_id} slug={s.slug} price={s.price_pkr_per_slot} capacity={s.capacity} approval={s.requires_approval} maxDays={s.max_advance_days} signedIn={!!user} isAttendee={me?.role === 'attendee'} />
          <aside className="rounded-2xl bg-surface p-5 shadow-card"><h2 className="text-sm font-semibold text-fg">Opening hours</h2><ul className="mt-3 space-y-1.5 text-sm">{((hours ?? []) as { weekday: number; opens: string; closes: string }[]).map((h, i) => <li key={i} className="flex justify-between text-muted"><span>{DAYS[h.weekday]}</span><span className="tnum text-fg">{h.opens.slice(0, 5)} to {h.closes.slice(0, 5)}</span></li>)}</ul></aside>
        </div>
      </div>
    </MarketingShell>
  )
}
