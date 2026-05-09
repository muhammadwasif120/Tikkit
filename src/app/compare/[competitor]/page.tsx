import type { Metadata } from 'next'
import { Ticket, Zap, Shield, ChevronRight, Check, X, Minus } from 'lucide-react'
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

type CompareRow = {
  feature: string
  tikkit: string | boolean
  competitor: string | boolean
}

function getCompareRows(compName: string): CompareRow[] {
  return [
    { feature: 'Setup cost',               tikkit: 'Free',           competitor: compName === 'Ticketwala' ? 'Free' : 'Free' },
    { feature: 'Platform fee per ticket',  tikkit: 'Low flat fee',   competitor: 'Higher variable fee' },
    { feature: 'Payout speed',             tikkit: 'Instant (same day)', competitor: compName === 'Ticketwala' ? '5–7 business days' : '3–5 business days' },
    { feature: 'JazzCash & EasyPaisa',     tikkit: true,             competitor: compName === 'Ticketwala' ? false : true },
    { feature: 'Bank transfer support',    tikkit: true,             competitor: true },
    { feature: 'Dynamic QR security',      tikkit: true,             competitor: false },
    { feature: 'Guest approval workflow',  tikkit: true,             competitor: false },
    { feature: 'Guest list management',    tikkit: true,             competitor: compName === 'Ticketwala' ? 'Limited' : false },
    { feature: 'Private / invite-only events', tikkit: true,         competitor: false },
    { feature: 'Custom capacity controls', tikkit: true,             competitor: compName === 'Bookme.pk' ? false : 'Limited' },
    { feature: 'Door scanner app',         tikkit: true,             competitor: compName === 'Ticketwala' ? true : false },
    { feature: 'Built exclusively for events', tikkit: true,         competitor: compName === 'Bookme.pk' ? false : true },
    { feature: 'Organizer dashboard',      tikkit: true,             competitor: true },
    { feature: 'Event analytics',          tikkit: true,             competitor: compName === 'Ticketwala' ? 'Basic' : false },
  ]
}

function CellValue({ value }: { value: string | boolean }) {
  if (value === true)  return <span className="flex justify-center"><Check className="w-5 h-5 text-green-500" /></span>
  if (value === false) return <span className="flex justify-center"><X className="w-5 h-5 text-red-400" /></span>
  if (value === 'Limited' || value === 'Basic') return (
    <span className="flex justify-center items-center gap-1 text-sm text-amber-600">
      <Minus className="w-4 h-4" /> {value}
    </span>
  )
  return <span className="text-sm text-gray-700 text-center block">{value as string}</span>
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

  const compareRows = getCompareRows(compName)

  const faqItems = slug === 'tikkit-vs-ticketwala' ? [
    {
      q: 'Is Tikkit free to use like Ticketwala?',
      a: 'Yes, both platforms are free to set up. Tikkit charges a low flat fee per ticket sold, and there are no subscription or onboarding costs. You can launch your first event in under 2 minutes.',
    },
    {
      q: 'How much faster are payouts on Tikkit vs Ticketwala?',
      a: 'Tikkit processes payouts on the same day. Ticketwala typically holds funds for 5–7 business days. For event organizers who need to pay vendors quickly, this difference is significant.',
    },
    {
      q: 'Does Tikkit support JazzCash and EasyPaisa?',
      a: 'Yes. Tikkit natively supports JazzCash, EasyPaisa, and bank transfers. Pakistan\'s most popular mobile wallets are built in, not bolted on.',
    },
    {
      q: 'Can I control who attends my event on Tikkit?',
      a: 'Yes. Tikkit lets you run invite-only events, set up guest approval workflows, and manage a curated guest list. Ticketwala does not offer this level of access control.',
    },
    {
      q: 'What is Dynamic QR security and does Ticketwala have it?',
      a: 'Dynamic QR codes refresh every 15 seconds, making screenshots and ticket sharing impossible. Tikkit uses Dynamic QR on every ticket. Ticketwala uses static QR codes, which can be screenshotted and shared.',
    },
  ] : [
    {
      q: 'What is the difference between Tikkit and Bookme.pk?',
      a: 'Bookme.pk is a general booking platform covering buses, cinemas, and some events. Tikkit is built exclusively for live events — private parties, concerts, corporate events, and brand activations. Every feature on Tikkit is designed for event organizers.',
    },
    {
      q: 'Is Tikkit better than Bookme for private events?',
      a: 'Yes. Tikkit supports invite-only events, guest approval workflows, and curated guest lists. Bookme does not offer these features, making it unsuitable for private or exclusive events.',
    },
    {
      q: 'Does Tikkit support JazzCash and EasyPaisa like Bookme?',
      a: 'Yes. Both platforms support JazzCash and EasyPaisa. Tikkit also adds a screenshot-verified payment flow that works for organizer-managed collections, not just automated gateway payments.',
    },
    {
      q: 'How does Tikkit\'s QR check-in compare to Bookme?',
      a: 'Tikkit uses Dynamic QR codes that refresh every 15 seconds, preventing screenshot fraud. Bookme uses standard static QR codes. For exclusive events where guest list integrity matters, Tikkit\'s approach is significantly more secure.',
    },
    {
      q: 'Can I manage my guest list on Tikkit?',
      a: 'Yes. Tikkit gives you a full guest management dashboard — approve or decline RSVPs, set capacity limits, manage waitlists, and give your door team a scanner link with no app download required.',
    },
  ]

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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <main className="min-h-screen bg-gray-50 flex flex-col items-center">
        <PublicNav />

        {/* Hero */}
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

        {/* Key differentiators */}
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

        {/* Comparison table */}
        <section className="w-full py-24 bg-gray-50">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-4">
              Tikkit vs {compName} — Feature by Feature
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              A detailed side-by-side comparison of the features that matter most to event organizers in Pakistan.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500 w-1/2">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-[#1E5EFF] w-1/4">Tikkit X</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-500 w-1/4">{compName}</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">{row.feature}</td>
                      <td className="px-6 py-4"><CellValue value={row.tikkit} /></td>
                      <td className="px-6 py-4"><CellValue value={row.competitor} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Who should use each */}
        <section className="w-full bg-white py-24 border-y">
          <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12">
            <div className="rounded-2xl border-2 border-[#1E5EFF] p-8">
              <div className="inline-flex items-center rounded-full bg-[#1E5EFF]/10 px-3 py-1 text-sm font-semibold text-[#1E5EFF] mb-6">
                Choose Tikkit X if you…
              </div>
              <ul className="space-y-3 text-gray-700">
                {[
                  'Run exclusive, invite-only, or curated events',
                  'Need same-day payouts before your event',
                  'Want dynamic QR to prevent ticket fraud',
                  'Need guest approval and waitlist workflows',
                  'Organize private parties, brand activations, or corporate dinners',
                  'Want JazzCash and EasyPaisa natively supported',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#1E5EFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 p-8 bg-gray-50">
              <div className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-600 mb-6">
                Stick with {compName} if you…
              </div>
              <ul className="space-y-3 text-gray-500">
                {slug === 'tikkit-vs-ticketwala' ? [
                  'Only need basic public ticketing with no access control',
                  'Are comfortable waiting 5–7 days for payouts',
                  'Don\'t need guest approval or invite-only settings',
                  'Are fine with static QR codes and no fraud protection',
                ] : [
                  'Also need to book cinema or bus tickets in the same platform',
                  'Are running a large public event with no guest curation',
                  'Don\'t need a dedicated event organizer dashboard',
                  'Are fine with a general-purpose booking interface',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <Minus className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full py-24 bg-gray-50">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-black text-gray-900 text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqItems.map(({ q, a }) => (
                <div key={q} className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-3">{q}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{a}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-gray-600 mb-6">Ready to try Pakistan's most advanced event platform?</p>
              <Link
                href="/how-it-works"
                className="rounded-full bg-[#1E5EFF] px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2"
              >
                Get started with Tikkit X
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
