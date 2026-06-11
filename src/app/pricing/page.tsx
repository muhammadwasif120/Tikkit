import type { Metadata } from 'next'
import Link from 'next/link'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Tikkit is free. Run unlimited events, manage your guest list, collect payments, and scan QR tickets — no platform fee, ever. Corporate plans available.',
  alternates: { canonical: 'https://www.tikkitx.com/pricing' },
  robots: { index: true, follow: true },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is Tikkit really free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Creating events, managing your guest list, scanning QR tickets, and collecting payments directly from guests — all free. We do not take a percentage of your ticket revenue.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Tikkit make money?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We offer a Corporate plan for organisations running high-volume or recurring events that need dedicated support, white-labelling, and enterprise features. Individual event organisers always stay on the free plan.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are there any hidden fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Tikkit does not charge listing fees, processing fees, or percentage cuts. Guests pay you directly via JazzCash, EasyPaisa, or bank transfer — money goes straight to you.',
      },
    },
    {
      '@type': 'Question',
      name: 'What payment methods can I collect?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'JazzCash, EasyPaisa, and bank transfer. Guests confirm with a screenshot of their transfer receipt, which you verify with one tap from your dashboard.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the Corporate plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Corporate plan is built for companies, agencies, and institutions running large-scale or frequent events. It includes a dedicated account manager, branded event pages, priority support, and custom integrations. Get in touch to discuss your needs.',
      },
    },
  ],
}

const CHECK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const DASH = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const freeRows: [string, boolean, boolean][] = [
  ['Unlimited events',            true,  true],
  ['Unlimited guest capacity',    true,  true],
  ['QR code check-in at the door',true,  true],
  ['Guest list & RSVP management',true,  true],
  ['JazzCash / EasyPaisa / Bank', true,  true],
  ['Payment receipt verification',true,  true],
  ['Waitlist & expression of interest', true, true],
  ['Vendor & finance tracking',   true,  true],
  ['Event analytics dashboard',   true,  true],
  ['Platform fee on tickets',     false, false],
  ['Dedicated account manager',   false, true],
  ['White-label / custom domain', false, true],
  ['Priority support (< 2hr SLA)',false, true],
  ['Bulk import & CRM integration',false,true],
  ['Custom contract & invoicing', false, true],
]

export default function PricingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #080A10)',
      color: '#F0F2FF',
      fontFamily: 'var(--font-body)',
    }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <style>{`
        .price-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 36px 32px;
          flex: 1 1 0;
          min-width: 0;
        }
        .price-card.featured {
          background: rgba(30,94,255,0.07);
          border-color: rgba(30,94,255,0.35);
        }
        .compare-row td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
        .compare-row:last-child td { border-bottom: none; }
        .cta-btn { transition: opacity .2s, transform .2s; }
        .cta-btn:hover { opacity: .88; transform: translateY(-2px); }
        .cta-ghost { transition: border-color .2s; }
        .cta-ghost:hover { border-color: rgba(255,255,255,0.25) !important; }
        @media (max-width: 700px) {
          .tier-grid { flex-direction: column !important; }
          .compare-table { font-size: 13px; }
          .compare-table td:first-child { max-width: 160px; }
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
        <Link href="/auth/login?flow=organizer-signup" style={{
          fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none',
          background: '#1E5EFF', padding: '8px 20px', borderRadius: 22,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }} className="cta-btn">
          Get started free
        </Link>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '72px 24px 100px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            display: 'inline-block',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#22C55E', marginBottom: 20,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 20, padding: '5px 14px',
          }}>
            No platform fee. Ever.
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6vw, 64px)',
            fontWeight: 800, letterSpacing: '-2px',
            color: '#F0F2FF', marginBottom: 20, lineHeight: 1.05,
          }}>
            Free. Seriously.
          </h1>
          <p style={{ fontSize: 18, color: '#6B7280', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            Every feature. Unlimited events. No cut of your ticket revenue.
            Run your events on Tikkit and keep every rupee.
          </p>
        </div>

        {/* Tier cards */}
        <div className="tier-grid" style={{ display: 'flex', gap: 20, marginBottom: 72, alignItems: 'stretch' }}>

          {/* Free */}
          <div className="price-card featured">
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1E5EFF', marginBottom: 12 }}>
                Free forever
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, marginBottom: 8 }}>
                PKR 0
              </div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>per event · per ticket · per year</div>
            </div>
            <div style={{ borderTop: '1px solid rgba(30,94,255,0.2)', paddingTop: 24, marginBottom: 28 }}>
              {[
                'Unlimited events & guests',
                'QR check-in at the door',
                'JazzCash, EasyPaisa & bank transfer',
                'Guest list, RSVP, waitlist',
                'Vendor & finance tracking',
                'Analytics dashboard',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {CHECK}
                  <span style={{ fontSize: 14, color: '#D1D5DB' }}>{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/auth/login?flow=organizer-signup"
              className="cta-btn"
              style={{
                display: 'block', textAlign: 'center',
                background: '#1E5EFF', color: '#fff',
                borderRadius: 12, padding: '14px 24px',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
              }}
            >
              Start for free →
            </Link>
          </div>

          {/* Corporate */}
          <div className="price-card">
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12 }}>
                Corporate
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, marginBottom: 8 }}>
                Custom
              </div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>tailored to your organisation</div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, marginBottom: 28 }}>
              {[
                'Everything in Free',
                'Dedicated account manager',
                'White-label & custom domain',
                'Priority support (< 2hr SLA)',
                'Bulk import & CRM integration',
                'Custom contract & invoicing',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {CHECK}
                  <span style={{ fontSize: 14, color: '#D1D5DB' }}>{f}</span>
                </div>
              ))}
            </div>
            <a
              href="https://wa.me/923322028451?text=Hi%20Tikkit%20%E2%80%94%20I%27m%20interested%20in%20the%20Corporate%20plan"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-ghost"
              style={{
                display: 'block', textAlign: 'center',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#F0F2FF',
                borderRadius: 12, padding: '14px 24px',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
              }}
            >
              Talk to us →
            </a>
          </div>
        </div>

        {/* Comparison table */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
            letterSpacing: '-0.5px', marginBottom: 32, textAlign: 'center',
          }}>
            Full comparison
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="compare-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '55%' }} />
                <col style={{ width: '22.5%' }} />
                <col style={{ width: '22.5%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Feature</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#1E5EFF', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Free</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#9CA3AF', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Corporate</th>
                </tr>
              </thead>
              <tbody>
                {freeRows.map(([label, free, corp]) => (
                  <tr key={label} className="compare-row">
                    <td style={{ fontSize: 14, color: label === 'Platform fee on tickets' ? '#EF4444' : '#D1D5DB' }}>
                      {label === 'Platform fee on tickets' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {label}
                          <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.12)', color: '#22C55E', borderRadius: 6, padding: '2px 7px', fontWeight: 600 }}>None</span>
                        </span>
                      ) : label}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {label === 'Platform fee on tickets'
                        ? <span style={{ fontSize: 13, fontWeight: 700, color: '#22C55E' }}>None</span>
                        : free ? CHECK : DASH}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {label === 'Platform fee on tickets'
                        ? <span style={{ fontSize: 13, fontWeight: 700, color: '#22C55E' }}>None</span>
                        : corp ? CHECK : DASH}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
            letterSpacing: '-0.5px', marginBottom: 32, textAlign: 'center',
          }}>
            Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {faqSchema.mainEntity.map((q) => (
              <details key={q.name} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <summary style={{
                  padding: '18px 24px',
                  fontSize: 15, fontWeight: 600, color: '#E5E7EB',
                  cursor: 'pointer', listStyle: 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  {q.name}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: 12 }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <div style={{ padding: '0 24px 18px', fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
                  {q.acceptedAnswer.text}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{
          marginTop: 80, textAlign: 'center',
          background: 'rgba(30,94,255,0.06)',
          border: '1px solid rgba(30,94,255,0.2)',
          borderRadius: 24, padding: '52px 32px',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800,
            letterSpacing: '-1px', marginBottom: 16,
          }}>
            Start running events today.
          </h2>
          <p style={{ fontSize: 16, color: '#6B7280', marginBottom: 32 }}>
            Free forever. No card required. Live in two minutes.
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
            <Link href="/how-it-works" className="cta-ghost" style={{
              border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF',
              borderRadius: 12, padding: '14px 32px',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              textDecoration: 'none',
            }}>
              See how it works
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 13, color: '#374151', marginTop: 56, lineHeight: 1.6 }}>
          Built in Pakistan 🇵🇰 · Two Bit Digital Ltd ·{' '}
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
