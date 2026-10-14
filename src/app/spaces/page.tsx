import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Container, PageHero, Section } from '@/components/marketing/blocks'
import { createClient } from '@/lib/supabase/server'
import { fromLoose } from '@/lib/rpc'
import { pkr } from '@/lib/format'

export const metadata: Metadata = { title: 'Rooms, courts and studios to book in Pakistan', description: 'Reserve rooms, courts, studios and tables by the slot in Karachi, Lahore and Islamabad.', alternates: { canonical: 'https://www.tikkitx.com/spaces' } }
export const revalidate = 300

type R = { id: string; slug: string; name: string; kind: string; city: string | null; area_label: string | null; price_pkr_per_slot: number; slot_minutes: number; photos: string[] }

export default async function SpacesBrowse() {
  const supabase = await createClient()
  const { data } = await fromLoose(supabase as never, 'public_spaces').select('id, slug, name, kind, city, area_label, price_pkr_per_slot, slot_minutes, photos').limit(60)
  const list = (data ?? []) as R[]
  return (
    <MarketingShell>
      <PageHero eyebrow="Spaces" title="Book a space by the hour" lead="Rooms, courts, studios and tables. Pick a time and reserve." />
      <Container className="pb-24"><Section className="pt-0">{list.length === 0 ? <p className="text-muted">No spaces are listed yet.</p> : <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map(s => (
        <li key={s.id}><Link href={`/spaces/${s.slug}`} className="block overflow-hidden rounded-2xl bg-surface shadow-card transition-colors hover:bg-raised">{s.photos[0]
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={s.photos[0]} alt="" className="h-40 w-full object-cover" /> : <div className="h-40 w-full" style={{ backgroundImage: 'var(--k-glow)' }} />}<div className="p-5"><p className="text-xs font-medium capitalize text-accent">{s.kind}</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-fg">{s.name}</h2><p className="mt-1 text-sm text-muted">{s.area_label ?? s.city}</p><p className="mt-3 tnum text-sm font-semibold text-fg">{s.price_pkr_per_slot ? `${pkr(s.price_pkr_per_slot)} / ${s.slot_minutes} min` : 'Free'}</p></div></Link></li>))}</ul>}</Section></Container>
    </MarketingShell>
  )
}
