import type { Metadata } from 'next'
import Link from 'next/link'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Tikkit team. We reply within a few hours, 7 days a week.',
  alternates: { canonical: 'https://www.tikkitx.com/contact' },
  robots: { index: true, follow: true },
}

const WA_NUMBER = '923322028451'
const WA_ORGANISER = `https://wa.me/${WA_NUMBER}?text=Hi%20Tikkit%20%E2%80%94%20I%20want%20to%20run%20an%20event`
const WA_GENERAL   = `https://wa.me/${WA_NUMBER}?text=Hi%20Tikkit%20%E2%80%94%20I%20have%20a%20question`
const EMAIL        = 'hello@tikkitx.com'

export default function ContactPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #080A10)',
      color: '#F0F2FF',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        .wa-primary { transition: opacity .2s, transform .2s; }
        .wa-primary:hover { opacity: .9; transform: translateY(-2px); }
        .wa-secondary { transition: border-color .2s; }
        .wa-secondary:hover { border-color: rgba(37,211,102,.45) !important; }
        .wa-email:hover { border-color: rgba(255,255,255,.15) !important; }
      `}</style>

      {/* Nav */}
      <header style={{
        padding: '20px 28px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <TikkitXLogo size="md" />
        </Link>
        <Link href="/how-it-works" style={{
          fontSize: 14, color: '#6B7280', textDecoration: 'none', fontWeight: 500,
        }}>
          How it works →
        </Link>
      </header>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: 640, margin: '0 auto', padding: '72px 24px 80px', width: '100%' }}>

        {/* Hero */}
        <div style={{ marginBottom: 56, textAlign: 'center' }}>
          {/* WhatsApp icon circle */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(37,211,102,0.12)',
            border: '1px solid rgba(37,211,102,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.549 4.104 1.508 5.836L.057 23.07a.75.75 0 0 0 .92.921l5.233-1.451A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.956 0-3.793-.497-5.388-1.371l-.371-.209-3.849 1.068 1.067-3.847-.217-.383A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 800,
            letterSpacing: '0',
            color: '#F0F2FF',
            marginBottom: 16,
            lineHeight: 1.1,
          }}>
            Talk to us.
          </h1>
          <p style={{ fontSize: 18, color: '#6B7280', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
            We reply within a few hours, 7 days a week.<br />
            WhatsApp is the fastest way to reach us.
          </p>
        </div>

        {/* Primary CTA — Organiser */}
        <a
          href={WA_ORGANISER}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: '#25D366',
            color: '#000',
            borderRadius: 16,
            padding: '20px 28px',
            textDecoration: 'none',
            marginBottom: 12,
            fontFamily: 'var(--font-display)',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.549 4.104 1.508 5.836L.057 23.07a.75.75 0 0 0 .92.921l5.233-1.451A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.956 0-3.793-.497-5.388-1.371l-.371-.209-3.849 1.068 1.067-3.847-.217-.383A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>I want to run an event</div>
            <div style={{ fontSize: 13, opacity: 0.7, fontFamily: 'var(--font-body)' }}>WhatsApp · Opens a chat instantly</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>

        {/* Secondary CTA — General */}
        <a
          href={WA_GENERAL}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'rgba(37,211,102,0.08)',
            border: '1px solid rgba(37,211,102,0.2)',
            color: '#F0F2FF',
            borderRadius: 16,
            padding: '20px 28px',
            textDecoration: 'none',
            marginBottom: 40,
            fontFamily: 'var(--font-display)',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(37,211,102,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>I have a question</div>
            <div style={{ fontSize: 13, color: '#6B7280', fontFamily: 'var(--font-body)' }}>WhatsApp · For attendees & general enquiries</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, color: '#374151',
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Email */}
        <a
          href={`mailto:${EMAIL}`}
          className="wa-email"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#9CA3AF',
            borderRadius: 16,
            padding: '18px 28px',
            textDecoration: 'none',
            fontFamily: 'var(--font-display)',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2, color: '#E5E7EB' }}>{EMAIL}</div>
            <div style={{ fontSize: 13, color: '#4B5563', fontFamily: 'var(--font-body)' }}>For formal enquiries — we respond within 24 hours</div>
          </div>
        </a>

        {/* Footer note */}
        <p style={{
          textAlign: 'center', fontSize: 13, color: '#374151',
          marginTop: 56, lineHeight: 1.6,
        }}>
          Built in Pakistan 🇵🇰 · Two Bit Digital Ltd ·{' '}
          <Link href="/privacy" style={{ color: '#4B5563', textDecoration: 'none' }}>Privacy</Link>
          {' · '}
          <Link href="/terms" style={{ color: '#4B5563', textDecoration: 'none' }}>Terms</Link>
        </p>
      </main>
    </div>
  )
}
