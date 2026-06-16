import Link from 'next/link'
import { Mic2 } from 'lucide-react'

const C = { black: '#050508', cyan: '#00E5FF', magenta: '#CC00FF', surface: '#0D1117', border: 'rgba(0,229,255,0.08)', muted: 'rgba(255,255,255,0.4)', text: '#FFFFFF', green: '#25D366' }

const WA_URL = 'https://wa.me/13074434195?text=' + encodeURIComponent('Hi TIKKIT X — I want to set up an Artist Management account')

export default function OnboardingPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.black, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body, "DM Sans", sans-serif)', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Mic2 size={28} color={C.black} strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-1px' }}>Artist Management</h1>
        <p style={{ fontSize: 15, color: C.muted, margin: '0 0 32px', lineHeight: 1.65 }}>
          This account doesn't have a management profile yet. Message us on WhatsApp and we'll get you set up within 30 minutes.
        </p>

        {/* Primary: WhatsApp CTA */}
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '15px 24px', borderRadius: 14, marginBottom: 12,
            background: C.green, color: '#000',
            fontSize: 15, fontWeight: 800, textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(37,211,102,0.35)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.549 4.104 1.508 5.836L.057 23.07a.75.75 0 0 0 .92.921l5.233-1.451A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.956 0-3.793-.497-5.388-1.371l-.371-.209-3.849 1.068 1.067-3.847-.217-.383A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          Message us on WhatsApp
        </a>

        <p style={{ fontSize: 11, color: C.muted, margin: '0 0 24px' }}>
          ⚡ Typical response under 30 mins · +1 (307) 443-4195
        </p>

        <Link href="/" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>← Back to Tikkit</Link>
      </div>
    </div>
  )
}
