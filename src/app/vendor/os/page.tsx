import Link from 'next/link'

export const metadata = { title: 'Vendor X — Coming Soon' }

export default function VendorOsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#06080F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #1E5EFF, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 28 }}>V</div>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: '#F0F2FF', letterSpacing: '-1px', marginBottom: 12 }}>Vendor X Portal</h1>
      <p style={{ fontSize: 16, color: 'rgba(240,242,255,0.5)', lineHeight: 1.65, maxWidth: 420, marginBottom: 40 }}>
        You&rsquo;re in. The full Vendor X dashboard is launching very soon — we&rsquo;ll email you the moment it&rsquo;s ready.
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.2)', borderRadius: 999, padding: '6px 16px', fontSize: 13, color: '#1E5EFF', fontWeight: 700, marginBottom: 40 }}>
        ⏳ Launching soon
      </div>
      <Link href="/auth/login" style={{ fontSize: 13, color: 'rgba(240,242,255,0.35)', textDecoration: 'none' }}>Sign out</Link>
    </div>
  )
}
