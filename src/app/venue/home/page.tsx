import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Venues & Experiences — List Your Space on Tikkit X',
  description: 'Get discovered by thousands of event organisers. List your venue, manage availability, and fill every date.',
}

const C = {
  bg:      '#0A0C0F',
  surface: '#0F1218',
  gold:    '#D4AF37',
  teal:    '#0D9488',
  text:    '#F5F0E8',
  muted:   'rgba(245,240,232,0.45)',
  border:  'rgba(245,240,232,0.08)',
}

const FEATURES = [
  { icon: '🏛️', title: 'Venue Profile',     body: 'Showcase your space with a gallery, capacity details, amenities, and pricing. Be found by the right organisers.' },
  { icon: '📅', title: 'Live Availability', body: 'Keep your calendar up to date. Organisers see your open dates in real time and enquire instantly.' },
  { icon: '✉️', title: 'Enquiry Management', body: 'Receive, track and respond to enquiries from a single inbox. No more lost emails.' },
  { icon: '🎯', title: 'Targeted Discovery', body: 'Surface in category and city searches relevant to your venue type — conferences, weddings, concerts and more.' },
  { icon: '📸', title: 'Photo & Video Gallery', body: 'Upload up to 24 photos and a walkthrough video. First impressions book events.' },
  { icon: '📈', title: 'Booking Analytics',  body: 'See enquiry volume, conversion rates, and peak seasons so you can optimise your pricing.' },
]

const VENUE_TYPES = ['Conference Centres', 'Banquet Halls', 'Rooftop Terraces', 'Open-Air Grounds', 'Art Galleries', 'Hotel Ballrooms', 'Intimate Lofts', 'Historic Buildings']

export default function VenueHomePage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; color: ${C.text}; font-family: var(--font-body, 'DM Sans', sans-serif); -webkit-font-smoothing: antialiased; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up  { animation: fadeUp 0.7s ease both; }
        .fade-up-2 { animation: fadeUp 0.7s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, ${C.gold}, #B8960C);
          color: #0A0C0F; font-weight: 800; font-size: 15px;
          padding: 14px 32px; border-radius: 12px; text-decoration: none;
          transition: opacity 0.2s, transform 0.2s;
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(245,240,232,0.06); color: ${C.muted};
          font-weight: 600; font-size: 15px;
          padding: 14px 28px; border-radius: 12px; text-decoration: none;
          border: 1px solid ${C.border};
          transition: background 0.2s, color 0.2s;
        }
        .btn-ghost:hover { background: rgba(245,240,232,0.1); color: ${C.text}; }
        .feature-card {
          background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px;
          padding: 28px; transition: border-color 0.2s, transform 0.2s;
        }
        .feature-card:hover { border-color: rgba(212,175,55,0.3); transform: translateY(-2px); }
        .type-chip {
          padding: 7px 16px; border-radius: 999px; font-size: 13px; font-weight: 600;
          background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.18);
          color: ${C.gold};
        }
      `}</style>

      <div style={{ minHeight: '100vh' }}>

        {/* ── Nav ── */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: `${C.bg}e8`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.gold}, #B8960C)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#0A0C0F' }}>V</div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>Venues <span style={{ color: C.gold }}>&</span> Experiences</span>
            <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>by Tikkit X</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/auth/login" className="btn-ghost" style={{ padding: '9px 20px', fontSize: 14 }}>Sign In</Link>
            <Link href="mailto:hello@tikkitx.com?subject=List My Venue" className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }}>List Your Venue →</Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ padding: '100px 40px 80px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${C.gold}14`, border: `1px solid ${C.gold}30`, borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ✦ Now Onboarding Venues
          </div>
          <h1 className="fade-up" style={{ fontFamily: 'var(--font-display, inherit)', fontSize: 'clamp(38px, 6vw, 66px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24 }}>
            Your venue,{' '}
            <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.teal})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              seen by every organiser
            </span>
          </h1>
          <p className="fade-up-2" style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, marginBottom: 44 }}>
            Venues & Experiences connects your space directly with event organisers on the Tikkit platform. List once, fill your calendar all year.
          </p>
          <div className="fade-up-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="mailto:hello@tikkitx.com?subject=List My Venue" className="btn-primary">List Your Venue →</Link>
            <Link href="/auth/login" className="btn-ghost">Sign In</Link>
          </div>
        </section>

        {/* ── Venue type chips ── */}
        <section style={{ padding: '0 40px 80px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>We list every kind of space</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {VENUE_TYPES.map(t => <span key={t} className="type-chip">{t}</span>)}
          </div>
        </section>

        {/* ── Stats ── */}
        <section style={{ padding: '0 40px 80px', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { value: '10K+', label: 'Active Organisers', sub: 'browsing venues monthly' },
              { value: '48h',  label: 'Onboarding Time',   sub: 'from signup to live listing' },
              { value: '0%',   label: 'Commission',         sub: 'all bookings are direct' },
            ].map(s => (
              <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.gold, letterSpacing: '-1.5px', marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ padding: '0 40px 100px', maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1px', textAlign: 'center', marginBottom: 12 }}>Built for venue managers</h2>
          <p style={{ textAlign: 'center', color: C.muted, fontSize: 16, marginBottom: 56 }}>Everything you need to manage enquiries and fill your calendar.</p>
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

        {/* ── CTA ── */}
        <section style={{ padding: '0 40px 120px', textAlign: 'center' }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '64px 40px', maxWidth: 680, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>Start filling your calendar today</h2>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.65, marginBottom: 36 }}>Contact our team and we'll have your venue live on the platform within 48 hours. No setup fee, no commission.</p>
            <Link href="mailto:hello@tikkitx.com?subject=List My Venue" className="btn-primary" style={{ fontSize: 16, padding: '16px 40px' }}>List Your Venue →</Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: C.muted }}>© 2026 Tikkit X · Venues & Experiences</span>
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
