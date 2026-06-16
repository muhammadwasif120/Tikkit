import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

const C = { black: '#050508', cyan: '#00E5FF', magenta: '#CC00FF', surface: '#0D1117', border: 'rgba(0,229,255,0.08)', muted: 'rgba(255,255,255,0.4)', text: '#FFFFFF' }

export default function SuspendedPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.black, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body, "DM Sans", sans-serif)', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <AlertCircle size={28} color="#FC8181" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-1px' }}>Account Suspended</h1>
        <p style={{ fontSize: 15, color: C.muted, margin: '0 0 32px', lineHeight: 1.65 }}>
          Your management account has been suspended. Please contact the Tikkit X team to resolve this.
        </p>
        <a href="mailto:hello@tikkitx.com" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 12, background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', color: '#FC8181', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 16 }}>
          Contact Support
        </a>
        <br />
        <Link href="/" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>← Back to Tikkit</Link>
      </div>
    </div>
  )
}
