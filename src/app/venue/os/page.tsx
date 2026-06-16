import Link from 'next/link'

export const metadata = { title: 'Venues & Experiences — Coming Soon' }

export default function VenueOsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0C0F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #D4AF37, #0D9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#0A0C0F', marginBottom: 28 }}>V</div>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: '#F5F0E8', letterSpacing: '-1px', marginBottom: 12 }}>Venues & Experiences Portal</h1>
      <p style={{ fontSize: 16, color: 'rgba(245,240,232,0.5)', lineHeight: 1.65, maxWidth: 420, marginBottom: 40 }}>
        You&rsquo;re in. The full venue management dashboard is launching very soon — we&rsquo;ll email you the moment it&rsquo;s ready.
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 999, padding: '6px 16px', fontSize: 13, color: '#D4AF37', fontWeight: 700, marginBottom: 40 }}>
        ⏳ Launching soon
      </div>
      <Link href="/auth/login" style={{ fontSize: 13, color: 'rgba(245,240,232,0.35)', textDecoration: 'none' }}>Sign out</Link>
    </div>
  )
}
