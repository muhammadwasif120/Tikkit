import type { Metadata } from 'next'
import { Ticket, Zap, Shield, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import PublicNav from '@/components/layout/PublicNav'

type Props = {
  params: Promise<{ competitor: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const slug = resolvedParams.competitor

  if (slug === 'tikkit-vs-ticketwala') {
    return {
      title: 'Tikkit vs Ticketwala — Best Event Ticketing Platform in Pakistan 2026',
      description: 'See why event organizers in Pakistan are switching from Ticketwala to Tikkit. Dynamic QR security, instant payouts, guest approval workflows — built exclusively for live events.',
      keywords: ['tikkit vs ticketwala', 'ticketwala alternative Pakistan', 'best event ticketing Pakistan', 'event platform Pakistan', 'sell event tickets Pakistan'],
      alternates: { canonical: 'https://www.tikkitx.com/compare/tikkit-vs-ticketwala' },
      openGraph: {
        title: 'Tikkit vs Ticketwala — Why Organizers Are Switching',
        description: 'Dynamic QR security, instant payouts, and full guest management. See why Tikkit is Pakistan\'s preferred alternative to Ticketwala.',
        url: 'https://www.tikkitx.com/compare/tikkit-vs-ticketwala',
        type: 'article',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit vs Ticketwala Comparison' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Tikkit vs Ticketwala — Why Organizers Are Switching',
        description: 'Dynamic QR security, instant payouts, full guest management. Pakistan\'s best Ticketwala alternative.',
        images: ['/og-image.jpg'],
      },
    }
  }

  if (slug === 'tikkit-vs-bookme') {
    return {
      title: 'Tikkit vs Bookme.pk — Best Bookme Alternative for Events in Pakistan',
      description: 'Looking for a Bookme.pk alternative for events? Tikkit is exclusively built for live events — not cinemas or buses. Get guest list control, dynamic QR, and instant payouts.',
      keywords: ['tikkit vs bookme', 'bookme alternative Pakistan', 'bookme alternative events', 'event ticketing app Pakistan', 'better than bookme'],
      alternates: { canonical: 'https://www.tikkitx.com/compare/tikkit-vs-bookme' },
      openGraph: {
        title: 'Tikkit vs Bookme.pk — The Events-Only Alternative',
        description: 'Bookme handles buses and cinemas. Tikkit is built exclusively for live events. Guest approval, dynamic QR, instant payouts.',
        url: 'https://www.tikkitx.com/compare/tikkit-vs-bookme',
        type: 'article',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit vs Bookme Comparison' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Tikkit vs Bookme.pk — The Events-Only Alternative',
        description: 'Bookme handles buses and cinemas. Tikkit is built exclusively for live events in Pakistan.',
        images: ['/og-image.jpg'],
      },
    }
  }

  return {
    title: 'Compare Tikkit — Best Event Ticketing Platform in Pakistan',
    alternates: { canonical: `https://www.tikkitx.com/compare/${slug}` },
  }
}

export default async function CompareCompetitorPage({ params }: Props) {
  const resolvedParams = await params
  const slug = resolvedParams.competitor

  let compName = 'Other Platforms'
  let compWeakness = 'outdated technology and high fees'
  let pageTitle = 'Why organizers are switching to Tikkit'
  let pageDescription = 'Tikkit X is built specifically for modern event organizers in Pakistan who demand instant payouts, dynamic QR security, and a premium guest experience.'

  if (slug === 'tikkit-vs-ticketwala') {
    compName = 'Ticketwala'
    compWeakness = 'limited B2B organizer tools and delayed payouts'
    pageTitle = 'Tikkit vs Ticketwala — Why Organizers Are Switching'
    pageDescription = 'Tikkit offers dynamic QR security, instant payouts, and full guest management that Ticketwala simply doesn\'t provide.'
  } else if (slug === 'tikkit-vs-bookme') {
    compName = 'Bookme.pk'
    compWeakness = 'a bloated interface meant for bus tickets, not exclusive events'
    pageTitle = 'Tikkit vs Bookme.pk — Built Exclusively for Events'
    pageDescription = 'Unlike Bookme which handles buses and cinemas, Tikkit is built exclusively for live events — giving organizers and attendees a focused, premium experience.'
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: pageTitle,
    description: pageDescription,
    url: `https://www.tikkitx.com/compare/${slug}`,
    publisher: {
      '@type': 'Organization',
      '@id': 'https://www.tikkitx.com/#organization',
      name: 'Tikkit X',
    },
    about: [
      { '@type': 'SoftwareApplication', name: 'Tikkit X', url: 'https://www.tikkitx.com' },
      { '@type': 'SoftwareApplication', name: compName },
    ],
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tikkitx.com' },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://www.tikkitx.com/compare' },
      { '@type': 'ListItem', position: 3, name: pageTitle, item: `https://www.tikkitx.com/compare/${slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <main className="min-h-screen bg-gray-50 flex flex-col items-center">
      <PublicNav />

      <section className="w-full max-w-5xl mx-auto px-6 pt-36 pb-20 md:pt-44 md:pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center rounded-full border border-[#1E5EFF]/20 bg-[#1E5EFF]/5 px-3 py-1 text-sm font-medium text-[#1E5EFF] mb-8">
          The Modern Alternative
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
          Why Organizers are switching from {compName} to <span className="text-[#1E5EFF]">TIKKIT X</span>.
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl leading-relaxed mb-10">
          Stop settling for {compWeakness}. Tikkit X is built specifically for modern event organizers in Pakistan who demand instant payouts, dynamic QR security, and a premium guest experience.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/how-it-works"
            className="rounded-full bg-[#1E5EFF] px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2"
          >
            See how TIKKIT X works
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="w-full bg-white py-24 border-y">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          
          <div className="flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E5EFF] flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Built for Events</h3>
            <p className="text-gray-600 leading-relaxed">
              Unlike generic platforms that sell cinema and bus tickets, Tikkit is obsessively focused on events. We offer guest-list management, approval workflows, and custom payment splits.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E5EFF] flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Dynamic QR Security</h3>
            <p className="text-gray-600 leading-relaxed">
              Eliminate ticket fraud instantly. Our proprietary Dynamic QR engine refreshes every 15 seconds, making screenshots and unauthorized duplicate entries impossible.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E5EFF] flex items-center justify-center mb-6">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Zero Setup Cost</h3>
            <p className="text-gray-600 leading-relaxed">
              No subscription fees, no onboarding hurdles. Launch your event page in 2 minutes, get your organizer dashboard, and start selling tickets immediately across Pakistan.
            </p>
          </div>

        </div>
      </section>

    </main>
    </>
  )
}
