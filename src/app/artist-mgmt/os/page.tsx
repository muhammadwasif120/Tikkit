import Link from 'next/link'

export const metadata = { title: 'Artist Management — Coming Soon' }

export default function ArtistMgmtOsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #00E5FF, #CC00FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 28 }}>🎤</div>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-1px', marginBottom: 12 }}>Artist Management Portal</h1>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, maxWidth: 420, marginBottom: 40 }}>
        You&rsquo;re in. The full artist management dashboard is launching very soon — we&rsquo;ll email you the moment it&rsquo;s ready.
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 999, padding: '6px 16px', fontSize: 13, color: '#00E5FF', fontWeight: 700, marginBottom: 40 }}>
        ⏳ Launching soon
      </div>
      <Link href="/auth/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>Sign out</Link>
    </div>
  )
}
