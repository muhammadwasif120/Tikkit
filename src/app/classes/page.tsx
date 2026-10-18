import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Container, PageHero, Section } from '@/components/marketing/blocks'
import { createClient } from '@/lib/supabase/server'
import { fmtDate, fmtTime, pkr } from '@/lib/format'

export const metadata: Metadata = { title: 'Classes and workshops in Pakistan', description: 'Find weekly classes and workshops in Karachi, Lahore and Islamabad. Book a session or buy a pass.', alternates: { canonical: 'https://www.tikkitx.com/classes' } }
export const revalidate = 300

type R = { id: string; slug: string; title: string; city: string | null; area_label: string | null; instructor_name: string | null; drop_in_price_pkr: number; next_session_at: string | null }

export default async function ClassesBrowse() {
  const supabase = await createClient()
  const { data } = await supabase.from('public_class_series').select('id, slug, title, city, area_label, instructor_name, drop_in_price_pkr, next_session_at').order('next_session_at', { nullsFirst: false }).limit(60)
  const list = (data ?? []) as R[]
  return (
    <MarketingShell>
      <PageHero eyebrow="Classes" title="Learn something this week" lead="Yoga, dance, art and more. Book a single session or buy a pass." />
      <Container className="pb-24"><Section className="pt-0">{list.length === 0 ? <p className="text-muted">No classes are listed yet.</p> : <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map(c => (
        <li key={c.id}><Link href={`/classes/${c.slug}`} className="block rounded-2xl bg-surface p-5 shadow-card transition-colors hover:bg-raised"><p className="text-xs font-medium text-accent">{c.next_session_at ? `Next ${fmtDate(c.next_session_at)} · ${fmtTime(c.next_session_at)}` : 'Weekly'}</p><h2 className="mt-2 text-lg font-semibold tracking-tight text-fg">{c.title}</h2><p className="mt-1 text-sm text-muted">{[c.instructor_name, c.area_label ?? c.city].filter(Boolean).join(' · ')}</p><p className="mt-4 tnum text-sm font-semibold text-fg">{c.drop_in_price_pkr ? pkr(c.drop_in_price_pkr) : 'Free'}</p></Link></li>))}</ul>}</Section></Container>
    </MarketingShell>
  )
}
