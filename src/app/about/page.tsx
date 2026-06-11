import type { Metadata } from 'next'
import Link from 'next/link'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

export const metadata: Metadata = {
  title: 'About',
  description: 'Tikkit X is built by Two Bit Digital Ltd — a Karachi-based team on a mission to give Pakistani event organisers the tools global platforms take for granted. Free. Local. Reliable.',
  alternates: { canonical: 'https://www.tikkitx.com/about' },
  robots: { index: true, follow: true },
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Tikkit X',
  legalName: 'Two Bit Digital Ltd',
  url: 'https://www.tikkitx.com',
  logo: 'https://www.tikkitx.com/og-image.png',
  foundingDate: '2024',
  foundingLocation: {
    '@type': 'Place',
    name: 'Karachi, Pakistan',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Pakistan',
  },
  description: 'Tikkit X is a Pakistani event management and ticketing platform built by Two Bit Digital Ltd. It gives organisers guest lists, QR check-in, JazzCash and EasyPaisa payment collection, and vendor finance tools — all free.',
  founder: {
    '@type': 'Person',
    name: 'Muhammad Wasif',
    jobTitle: 'Founder & CEO',
    worksFor: { '@type': 'Organization', name: 'Two Bit Digital Ltd' },
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    availableLanguage: ['English', 'Urdu'],
    contactOption: 'TollFree',
  },
  sameAs: [
    'https://www.tikkitx.com',
  ],
}

const timeline = [
  {
    year: '2024',
    title: 'The problem becomes obvious',
    body: 'Every Pakistani organiser we knew was running events on WhatsApp threads, Google Sheets, and cash-at-the-door. International tools didn\'t accept JazzCash. Local alternatives didn\'t exist. We decided to fix it.',
  },
  {
    year: '2024',
    title: 'First version ships',
    body: 'Tikkit X launches with guest lists, QR check-in, and payment receipt verification. The first events go live in Karachi within weeks.',
  },
  {
    year: '2025',
    title: 'Payments go native',
    body: 'JazzCash and EasyPaisa confirmation flows built directly into the platform. Organisers start collecting money before doors open — no middleman, no delay.',
  },
  {
    year: '2025',
    title: 'Full organiser stack',
    body: 'Vendor management, finance tracking, expression of interest flows, and a complete analytics dashboard. Everything an organiser needs in one place.',
  },
  {
    year: '2026',
    title: 'Growing across Pakistan',
    body: 'Events running in Karachi, Lahore, and Islamabad. Music nights, corporate dinners, tech meetups, wellness retreats. Tikkit X is the platform Pakistani events run on.',
  },
]

const values = [
  {
    icon: '🇵🇰',
    title: 'Pakistan-native',
    body: 'JazzCash, EasyPaisa, Urdu — we build for Pakistan first, not as an afterthought. Every product decision starts with what actually works here.',
  },
  {
    icon: '⚡',
    title: 'Organisers first',
    body: 'We don\'t take a cut of your revenue. We don\'t upsell features you don\'t need. Our job is to make you look good and your event run smoothly.',
  },
  {
    icon: '🔒',
    title: 'Trust at the door',
    body: 'A cryptographically signed QR ticket that works offline. No fake screenshots. No clipboards. Your guests walk in, scan, done.',
  },
  {
    icon: '🛠',
    title: 'Ship, don\'t talk',
    body: 'We\'re a small team that moves fast. When organisers tell us what\'s broken, we fix it. When they need a new feature, we build it.',
  },
]

export default function AboutPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #080A10)',
      color: '#F0F2FF',
      fontFamily: 'var(--font-body)',
    }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      <style>{`
        .about-link { transition: color .2s; }
        .about-link:hover { color: #F0F2FF !important; }
        .cta-btn { transition: opacity .2s, transform .2s; }
        .cta-btn:hover { opacity: .88; transform: translateY(-2px); }
        .val-card { transition: border-color .2s; }
        .val-card:hover { border-color: rgba(255,255,255,0.14) !important; }
        @media (max-width: 680px) {
          .values-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Nav */}
      <header style={{
        padding: '20px 28px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <TikkitXLogo size="md" />
        </Link>
        <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <Link href="/how-it-works" className="about-link" style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>How it works</Link>
          <Link href="/pricing" className="about-link" style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>Pricing</Link>
          <Link href="/auth/login?flow=organizer-signup" className="cta-btn" style={{
            fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none',
            background: '#1E5EFF', padding: '8px 20px', borderRadius: 22,
          }}>
            Get started
          </Link>
        </nav>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '72px 24px 100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 72 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#1E5EFF', marginBottom: 20,
            display: 'inline-block',
            background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.2)',
            borderRadius: 20, padding: '5px 14px',
          }}>
            Two Bit Digital Ltd · Karachi, Pakistan
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800, letterSpacing: '0',
            color: '#F0F2FF', marginBottom: 24, lineHeight: 1.08,
          }}>
            We got tired of watching Pakistani organisers run events on WhatsApp.
          </h1>
          <p style={{ fontSize: 18, color: '#6B7280', lineHeight: 1.8, marginBottom: 20 }}>
            Every event organiser we knew was juggling guest lists in spreadsheets,
            chasing payments on WhatsApp, and managing check-in with a printed piece of paper.
            The tools that exist globally — they don&apos;t accept JazzCash. They don&apos;t
            understand the Pakistani market. They weren&apos;t built for us.
          </p>
          <p style={{ fontSize: 18, color: '#6B7280', lineHeight: 1.8 }}>
            So we built Tikkit X. A platform where a Pakistani organiser can go from blank page
            to live event in two minutes. Guest list, QR tickets, JazzCash and EasyPaisa
            payments, vendors, finances — all in one place. And completely free.
          </p>
        </div>

        {/* Founder */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '36px 32px',
          marginBottom: 72,
          display: 'flex', gap: 28, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, #1E5EFF, #A855F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff',
          }}>
            MW
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Muhammad Wasif</div>
            <div style={{ fontSize: 13, color: '#1E5EFF', fontWeight: 600, marginBottom: 12 }}>Founder & CEO · Two Bit Digital Ltd</div>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>
              Muhammad has spent years watching Pakistan&apos;s event scene grow without the infrastructure to match it.
              Tikkit X is his answer — a platform built from the ground up for Pakistani organisers,
              with Pakistani payment rails, and a team that replies on WhatsApp.
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
            letterSpacing: '0', marginBottom: 40,
          }}>
            How we got here
          </h2>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 47, top: 0, bottom: 0, width: 1,
              background: 'rgba(255,255,255,0.06)',
            }} />
            {timeline.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 24, marginBottom: 40, position: 'relative' }}>
                <div style={{
                  width: 48, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#1E5EFF',
                    border: '2px solid rgba(30,94,255,0.3)',
                    marginTop: 6, position: 'relative', zIndex: 1,
                    boxShadow: '0 0 10px rgba(30,94,255,0.5)',
                  }} />
                </div>
                <div style={{ paddingBottom: i < timeline.length - 1 ? 0 : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1E5EFF', letterSpacing: '0.08em', marginBottom: 6 }}>
                    {t.year}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#E5E7EB' }}>
                    {t.title}
                  </div>
                  <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>
                    {t.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
            letterSpacing: '0', marginBottom: 32,
          }}>
            What we believe
          </h2>
          <div className="values-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
          }}>
            {values.map((v) => (
              <div key={v.title} className="val-card" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '24px 24px',
              }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{v.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#E5E7EB' }}>
                  {v.title}
                </div>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Company info */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: '28px 28px',
          marginBottom: 72,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24,
        }}>
          {[
            { label: 'Company',  value: 'Two Bit Digital Ltd' },
            { label: 'Founded',  value: '2024' },
            { label: 'Based in', value: 'Karachi, Pakistan' },
            { label: 'Contact',  value: 'hello@tikkitx.com' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4B5563', marginBottom: 6 }}>
                {label}
              </div>
              <div style={{ fontSize: 14, color: '#D1D5DB', fontWeight: 500 }}>
                {label === 'Contact'
                  ? <a href="mailto:hello@tikkitx.com" style={{ color: '#D1D5DB', textDecoration: 'none' }}>{value}</a>
                  : value}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          textAlign: 'center',
          background: 'rgba(30,94,255,0.06)',
          border: '1px solid rgba(30,94,255,0.2)',
          borderRadius: 24, padding: '52px 32px',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800,
            letterSpacing: '0', marginBottom: 14,
          }}>
            Ready to run your next event?
          </h2>
          <p style={{ fontSize: 16, color: '#6B7280', marginBottom: 32 }}>
            Free to start. Live in two minutes. We&apos;re on WhatsApp if you need us.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/login?flow=organizer-signup" className="cta-btn" style={{
              background: '#1E5EFF', color: '#fff',
              borderRadius: 12, padding: '14px 32px',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              textDecoration: 'none',
            }}>
              Create your account →
            </Link>
            <Link href="/contact" style={{
              border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF',
              borderRadius: 12, padding: '14px 32px',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              textDecoration: 'none',
            }}>
              Talk to us
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#374151', marginTop: 56, lineHeight: 1.6 }}>
          © {new Date().getFullYear()} Two Bit Digital Ltd ·{' '}
          <Link href="/privacy" style={{ color: '#4B5563', textDecoration: 'none' }}>Privacy</Link>
          {' · '}
          <Link href="/terms" style={{ color: '#4B5563', textDecoration: 'none' }}>Terms</Link>
          {' · '}
          <Link href="/contact" style={{ color: '#4B5563', textDecoration: 'none' }}>Contact</Link>
        </p>
      </main>
    </div>
  )
}
