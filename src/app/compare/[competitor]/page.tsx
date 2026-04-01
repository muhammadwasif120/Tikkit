import type { Metadata } from 'next'
import { Ticket, Zap, Shield, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Props = {
  params: Promise<{ competitor: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const slug = resolvedParams.competitor
  
  if (slug === 'tikkit-vs-ticketwala') {
    return {
      title: 'Tikkit vs Ticketwala | Best Event Ticketing Platform in Pakistan',
      description: 'See why top event organizers in Pakistan are choosing Tikkit over Ticket Wala. Zero hidden fees, instant payouts, and dynamic QR scanning.',
      alternates: { canonical: 'https://www.tikkitx.com/compare/tikkit-vs-ticketwala' },
    }
  }

  if (slug === 'tikkit-vs-bookme') {
    return {
      title: 'Tikkit vs Bookme | The Premier Bookme Alternative for Events',
      description: 'Looking for a Bookme.pk alternative? Tikkit offers a modern, dedicated event ticketing experience for organizers and attendees in Pakistan.',
      alternates: { canonical: 'https://www.tikkitx.com/compare/tikkit-vs-bookme' },
    }
  }

  return { title: 'Compare Tikkit' }
}

export default async function CompareCompetitorPage({ params }: Props) {
  const resolvedParams = await params
  const slug = resolvedParams.competitor

  let compName = 'Other Platforms'
  let compWeakness = 'outdated technology and high fees'

  if (slug === 'tikkit-vs-ticketwala') {
    compName = 'Ticketwala'
    compWeakness = 'limited B2B organizer tools and delayed payouts'
  } else if (slug === 'tikkit-vs-bookme') {
    compName = 'Bookme.pk'
    compWeakness = 'a bloated interface meant for bus tickets, not exclusive events'
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Navbar Placeholder - You can import your actual PublicNav here */}
      <header className="w-full bg-white border-b py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="font-bold text-xl tracking-tight text-[#1E5EFF]">TIKKIT X</Link>
        <Link href="/auth/login" className="text-sm font-medium hover:text-[#1E5EFF] transition-colors">Start for free</Link>
      </header>

      <section className="w-full max-w-5xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center rounded-full border border-[#1E5EFF]/20 bg-[#1E5EFF]/5 px-3 py-1 text-sm font-medium text-[#1E5EFF] mb-8">
          The Modern Alternative
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
          Why Organizers are switching from {compName} to <span className="text-[#1E5EFF]">Tikkit</span>.
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl leading-relaxed mb-10">
          Stop settling for {compWeakness}. Tikkit X is built specifically for modern event organizers in Pakistan who demand instant payouts, dynamic QR security, and a premium guest experience.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/how-it-works"
            className="rounded-full bg-[#1E5EFF] px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2"
          >
            See how Tikkit works
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
  )
}
