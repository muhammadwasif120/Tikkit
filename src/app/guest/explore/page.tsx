import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/kit'
import { DiscoverFeed, InterestChips } from '@/components/attendee/DiscoverFeed'
import { buildDiscovery } from '@/lib/discover'
import { requireAttendee } from '@/lib/data/viewer'

export const metadata = { title: 'For you' }

export default async function ForYouPage() {
  const { supabase, profile } = await requireAttendee()
  const d = await buildDiscovery(supabase, profile.id, profile.city)
  return (
    <div className="k-fade-up space-y-6">
      <PageHeader title="For you" description={d.hasHistory ? 'Events, classes and spaces picked from what you go to.' : 'Tell us what you are into and we will find it.'} />
      <section aria-labelledby="interests-title" className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line sm:p-5" data-tour="interests">
        <h2 id="interests-title" className="text-sm font-semibold text-fg">Your interests</h2>
        <p className="mb-3 mt-0.5 text-xs text-muted">Tap what you like. Your feed also learns from the events and classes you book.</p>
        <InterestChips categories={d.categories} />
      </section>
      <DiscoverFeed forYou={d.forYou} different={d.different} />
      <p className="pt-2 text-center text-sm text-muted"><Link href="/explore" className="inline-flex items-center gap-1 text-accent hover:underline">Browse every event <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link></p>
    </div>
  )
}
