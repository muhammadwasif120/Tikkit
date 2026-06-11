import type { Metadata } from 'next'
import Link from 'next/link'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

export const metadata: Metadata = {
  title: 'Security',
  description: 'How Tikkit X protects your event from fake tickets, duplicate entries, and payment fraud. Cryptographically signed QR codes, receipt verification, and offline check-in — built for Pakistani organisers.',
  alternates: { canonical: 'https://www.tikkitx.com/security' },
  robots: { index: true, follow: true },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Can someone screenshot a QR ticket and share it?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Every Tikkit QR code is cryptographically signed and single-use. The moment a ticket is scanned at the door, it is marked as used in real time. Any subsequent scan of the same code — screenshot or original — is instantly rejected.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if the internet goes down at check-in?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Tikkit check-in scanner works offline. Your guest list is downloaded to the device before the event. Scans are recorded locally and synced when connectivity returns — no internet required at the door.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Tikkit verify JazzCash and EasyPaisa payments?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Guests upload a screenshot of their transfer receipt when registering. You verify it with one tap from your dashboard. Tikkit flags duplicate transaction IDs automatically so the same receipt cannot be used to register twice.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I see who has and has not checked in during the event?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Your dashboard shows real-time check-in status for every guest. You can see exactly who is inside, who has not arrived yet, and who was turned away at the door.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is guest data stored securely?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All guest data is stored in an encrypted Postgres database with row-level security. Only you and your authorised team members can access your event\'s guest list. Tikkit staff cannot view guest data without explicit permission.',
      },
    },
  ],
}

const pillars = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E5EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    color: '#1E5EFF',
    glow: 'rgba(30,94,255,0.15)',
    title: 'Signed QR tickets',
    body: 'Every ticket carries a cryptographic signature tied to the guest\'s name, email, and event ID. You cannot forge it. You cannot duplicate it. The scanner verifies the signature in milliseconds — no server round-trip needed.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    color: '#A855F7',
    glow: 'rgba(168,85,247,0.15)',
    title: 'Single-use enforcement',
    body: 'The first scan marks a ticket as used — in real time, across all devices. Any attempt to scan the same code again shows a clear red rejection screen. No confusion, no arguments at the door.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.32h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9c1.05 1.84 2.25 3.04 4.09 4.09l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.04z"/>
      </svg>
    ),
    color: '#22C55E',
    glow: 'rgba(34,197,94,0.15)',
    title: 'Receipt de-duplication',
    body: 'When guests pay via JazzCash or EasyPaisa and upload their receipt, Tikkit extracts and hashes the transaction ID. The same receipt cannot be submitted twice — even if guests share screenshots with each other.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.15)',
    title: 'Offline-capable check-in',
    body: 'Your guest list is cached on the scanning device before the event starts. If Wi-Fi drops at the venue, scanning continues without interruption. Entries sync automatically when the connection returns.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: '#EC4899',
    glow: 'rgba(236,72,153,0.15)',
    title: 'Row-level data access',
    body: 'Guest lists are protected with row-level security at the database layer. Your guests\' data is only accessible to you and team members you explicitly authorise. No cross-event data leakage is possible by design.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    color: '#06B6D4',
    glow: 'rgba(6,182,212,0.15)',
    title: 'Real-time audit log',
    body: 'Every check-in scan — successful or rejected — is time-stamped and recorded against the team member who performed it. You have a complete, tamper-evident record of exactly what happened at the door.',
  },
]

export default function SecurityPage() {
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
        .sec-link { transition: color .2s; }
        .sec-link:hover { color: #F0F2FF !important; }
        .cta-btn { transition: opacity .2s, transform .2s; }
        .cta-btn:hover { opacity: .88; transform: translateY(-2px); }
        .pillar-card { transition: border-color .2s, box-shadow .2s; }
        .pillar-card:hover { border-color: rgba(255,255,255,0.14) !important; }
        @media (max-width: 700px) {
          .pillars-grid { grid-template-columns: 1fr !important; }
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
          <Link href="/how-it-works" className="sec-link" style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>How it works</Link>
          <Link href="/pricing" className="sec-link" style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>Pricing</Link>
          <Link href="/auth/login?flow=organizer-signup" className="cta-btn" style={{
            fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none',
            background: '#1E5EFF', padding: '8px 20px', borderRadius: 22,
          }}>
            Get started
          </Link>
        </nav>
      </header>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '72px 24px 100px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'rgba(30,94,255,0.1)',
            border: '1px solid rgba(30,94,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1E5EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800, letterSpacing: '0',
            color: '#F0F2FF', marginBottom: 20, lineHeight: 1.08,
          }}>
            No fake tickets.<br />No duplicate entries.<br />No surprises at the door.
          </h1>
          <p style={{ fontSize: 18, color: '#6B7280', lineHeight: 1.8, maxWidth: 560, margin: '0 auto' }}>
            Tikkit X is built from the ground up so Pakistani organisers never have to
            worry about whether the person at the door is legitimate. Here is exactly how we do it.
          </p>
        </div>

        {/* Security pillars */}
        <div className="pillars-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 80,
        }}>
          {pillars.map((p) => (
            <div key={p.title} className="pillar-card" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 18, padding: '28px 26px',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: p.glow,
                border: `1px solid ${p.color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                {p.icon}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700,
                color: '#E5E7EB', marginBottom: 10,
              }}>
                {p.title}
              </div>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.75, margin: 0 }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>

        {/* What happens at the door — visual walkthrough */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
            letterSpacing: '0', marginBottom: 8, textAlign: 'center',
          }}>
            What happens at the door
          </h2>
          <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 15, marginBottom: 40 }}>
            Every check-in is a four-step verification in under a second.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { n: '01', color: '#1E5EFF', title: 'Guest opens their ticket', body: 'Tikkit sends a unique QR code to the guest\'s email or phone. It is tied to their name, email, and this event only.' },
              { n: '02', color: '#A855F7', title: 'Your team scans the QR', body: 'The Tikkit scanner app (web or mobile) reads the code and verifies the cryptographic signature locally — no server call needed.' },
              { n: '03', color: '#22C55E', title: 'Valid → green light', body: 'If the ticket is genuine and unused, the screen turns green and shows the guest\'s name. The ticket is marked used across all devices instantly.' },
              { n: '04', color: '#EF4444', title: 'Duplicate → red rejection', body: 'If the ticket has already been scanned — screenshot or otherwise — the screen turns red immediately. No entry. No exceptions.' },
            ].map((s) => (
              <div key={s.n} style={{
                display: 'flex', gap: 20, alignItems: 'flex-start',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '22px 24px',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: `${s.color}18`,
                  border: `1px solid ${s.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: s.color,
                }}>
                  {s.n}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#E5E7EB', marginBottom: 6 }}>
                    {s.title}
                  </div>
                  <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
            letterSpacing: '0', marginBottom: 32, textAlign: 'center',
          }}>
            Common questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {faqSchema.mainEntity.map((q) => (
              <details key={q.name} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                <summary style={{
                  padding: '18px 24px', fontSize: 15, fontWeight: 600, color: '#E5E7EB',
                  cursor: 'pointer', listStyle: 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  {q.name}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: 12 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </summary>
                <div style={{ padding: '0 24px 18px', fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
                  {q.acceptedAnswer.text}
                </div>
              </details>
            ))}
          </div>
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
            Run a tight door. Every time.
          </h2>
          <p style={{ fontSize: 16, color: '#6B7280', marginBottom: 32 }}>
            Free to start. No setup fees. Your first event live in two minutes.
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
            <Link href="/how-it-works" style={{
              border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF',
              borderRadius: 12, padding: '14px 32px',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              textDecoration: 'none',
            }}>
              See how it works
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
