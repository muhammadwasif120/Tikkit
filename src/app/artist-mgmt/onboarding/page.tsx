import Link from 'next/link'
import { Mic2 } from 'lucide-react'

const C = { black: '#050508', cyan: '#00E5FF', magenta: '#CC00FF', surface: '#0D1117', border: 'rgba(0,229,255,0.08)', muted: 'rgba(255,255,255,0.4)', text: '#FFFFFF' }

export default function OnboardingPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.black, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body, "DM Sans", sans-serif)', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Mic2 size={28} color={C.black} strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-1px' }}>Artist Management</h1>
        <p style={{ fontSize: 15, color: C.muted, margin: '0 0 32px', lineHeight: 1.65 }}>
          This account doesn't have a management profile yet. To get access, contact the Tikkit X team to set up your management account.
        </p>
        <div style={{ padding: '20px 24px', borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 8px' }}>Questions? Reach us at</p>
          <a href="mailto:hello@tikkitx.com" style={{ fontSize: 15, fontWeight: 700, color: C.cyan, textDecoration: 'none' }}>hello@tikkitx.com</a>
        </div>
        <Link href="/" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>← Back to Tikkit</Link>
      </div>
    </div>
  )
}
