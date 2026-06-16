import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vendor X — Run Your Event Services Business',
  description: 'CRM, invoicing, cross-hires and analytics built for event vendors. Join Vendor X by Tikkit.',
}

const C = {
  bg:      '#06080F',
  surface: '#0C0F1A',
  card:    '#10142000',
  blue:    '#1E5EFF',
  purple:  '#8B5CF6',
  text:    '#F0F2FF',
  muted:   'rgba(240,242,255,0.45)',
  border:  'rgba(255,255,255,0.07)',
}

const FEATURES = [
  { icon: '📋', title: 'Deal Pipeline',    body: 'Track every event enquiry from first contact to final payment. Never lose a lead again.' },
  { icon: '🧾', title: 'Professional Invoicing', body: 'Generate branded invoices with line items, tax, and payment tracking built in.' },
  { icon: '🤝', title: 'Cross-Hire Network', body: 'Source crew and equipment from trusted vendors in your network. Split costs automatically.' },
  { icon: '📊', title: 'P&L Analytics',    body: 'See your revenue, expenses, and margins per deal at a glance. Know your most profitable event types.' },
  { icon: '📦', title: 'Inventory Manager', body: 'Track your kit, assign it to events, and know what\'s available before you say yes.' },
  { icon: '⭐', title: 'Verified Reviews',  body: 'Build credibility with organiser reviews on your public profile. Let your work speak for itself.' },
]

const STEPS = [
  { n: '01', title: 'Apply for access',    body: 'Vendor X is invite-only. Get in touch and our team onboards you within 48 hours.' },
  { n: '02', title: 'Set up your profile', body: 'Add your services, coverage area, and team. Your public profile goes live immediately.' },
  { n: '03', title: 'Start winning deals', body: 'Receive enquiries from organisers, manage your pipeline, and get paid faster.' },
]

export default function VendorHomePage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; color: ${C.text}; font-family: var(--font-body, 'DM Sans', sans-serif); -webkit-font-smoothing: antialiased; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .fade-up-2 { animation: fadeUp 0.7s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, ${C.blue}, ${C.purple});
          color: #fff; font-weight: 700; font-size: 15px;
          padding: 14px 32px; border-radius: 12px; text-decoration: none;
          transition: opacity 0.2s, transform 0.2s;
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.06); color: ${C.muted};
          font-weight: 600; font-size: 15px;
          padding: 14px 28px; border-radius: 12px; text-decoration: none;
          border: 1px solid ${C.border};
          transition: background 0.2s, color 0.2s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.1); color: ${C.text}; }
        .feature-card {
          background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px;
          padding: 28px; transition: border-color 0.2s, transform 0.2s;
        }
        .feature-card:hover { border-color: rgba(30,94,255,0.3); transform: translateY(-2px); }
      `}</style>

      <div style={{ minHeight: '100vh' }}>

        {/* ── Nav ── */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: `${C.bg}e8`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>V</div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>Vendor <span style={{ color: C.blue }}>X</span></span>
            <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>by Tikkit</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/auth/login" className="btn-ghost" style={{ padding: '9px 20px', fontSize: 14 }}>Sign In</Link>
            <Link href="mailto:hello@tikkitx.com?subject=Vendor X Access" className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }}>Get Access →</Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ padding: '100px 40px 80px', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${C.blue}14`, border: `1px solid ${C.blue}30`, borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ✦ Invite-Only Beta
          </div>
          <h1 className="fade-up" style={{ fontFamily: 'var(--font-display, inherit)', fontSize: 'clamp(38px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24 }}>
            Run your event vendor{' '}
            <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              business smarter
            </span>
          </h1>
          <p className="fade-up-2" style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, marginBottom: 44 }}>
            Vendor X is the all-in-one CRM for sound engineers, lighting crews, caterers, photographers and every other vendor that powers live events. Pipeline, invoices, inventory, analytics — all in one place.
          </p>
          <div className="fade-up-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="mailto:hello@tikkitx.com?subject=Vendor X Access" className="btn-primary">Request Access →</Link>
            <Link href="/auth/login" className="btn-ghost">Sign In</Link>
          </div>
        </section>

        {/* ── Dashboard preview strip ── */}
        <div style={{ padding: '0 40px 80px', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', padding: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Active Deals',    value: '12',    color: C.blue   },
                { label: 'Revenue MTD',     value: '₨ 840K', color: C.purple },
                { label: 'Pending Invoices', value: '5',    color: '#F59E0B' },
                { label: 'Open Cross-Hires', value: '3',   color: '#22C55E' },
              ].map(s => (
                <div key={s.label} style={{ background: `${s.color}0e`, border: `1px solid ${s.color}20`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color, letterSpacing: '-1px', marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: C.border, marginBottom: 20 }} />
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Recent Deals</div>
            {[
              { name: 'Sound — Lahore Polo Club', date: 'Jun 28', value: '₨ 180K', status: 'Negotiating', c: '#F59E0B' },
              { name: 'Lighting — Alhamra Arts Council', date: 'Jul 4', value: '₨ 95K', status: 'Confirmed', c: '#22C55E' },
              { name: 'AV Rig — PC Hotel Banquet', date: 'Jul 12', value: '₨ 240K', status: 'Invoiced', c: C.blue },
            ].map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{d.date}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{d.value}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${d.c}18`, border: `1px solid ${d.c}30`, color: d.c }}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Features ── */}
        <section style={{ padding: '0 40px 100px', maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-1px', textAlign: 'center', marginBottom: 12 }}>Everything you need to run your business</h2>
          <p style={{ textAlign: 'center', color: C.muted, fontSize: 16, marginBottom: 56 }}>Built specifically for event vendors. No bloat, no complexity.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ padding: '0 40px 100px', maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, letterSpacing: '-1px', textAlign: 'center', marginBottom: 56 }}>How it works</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${C.blue}22, ${C.purple}22)`, border: `1px solid ${C.blue}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display, inherit)', fontSize: 13, fontWeight: 900, color: C.blue, flexShrink: 0 }}>{s.n}</div>
                <div style={{ paddingTop: 10 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding: '0 40px 120px', textAlign: 'center' }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '64px 40px', maxWidth: 680, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>Ready to grow your business?</h2>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.65, marginBottom: 36 }}>Vendor X is currently in invite-only beta. Get in touch and we'll onboard your team within 48 hours.</p>
            <Link href="mailto:hello@tikkitx.com?subject=Vendor X Access" className="btn-primary" style={{ fontSize: 16, padding: '16px 40px' }}>Request Access →</Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: C.muted }}>© 2026 Tikkit X · Vendor X</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="https://tikkitx.com" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>tikkitx.com</Link>
            <Link href="/auth/login" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>Sign In</Link>
            <Link href="mailto:hello@tikkitx.com" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>Contact</Link>
          </div>
        </footer>
      </div>
    </>
  )
}
