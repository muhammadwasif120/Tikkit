import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Artist Management — Grow Your Roster on Tikkit X',
  description: 'Manage your artist roster, receive booking enquiries from verified organisers, and grow your bookings with Tikkit X.',
}

const C = {
  bg:      '#050508',
  surface: '#0D1117',
  cyan:    '#00E5FF',
  magenta: '#CC00FF',
  text:    '#FFFFFF',
  muted:   'rgba(255,255,255,0.45)',
  border:  'rgba(0,229,255,0.08)',
}

const FEATURES = [
  { icon: '🎤', title: 'Artist Profiles',     body: 'Create rich profiles with bio, photo gallery, media embeds, and press kit. Your artists, showcased professionally.' },
  { icon: '📥', title: 'Enquiry Inbox',        body: 'Receive booking requests from verified event organisers in a structured inbox. No cold calls, no spam.' },
  { icon: '🔒', title: 'Verified Organisers Only', body: 'Every enquiry comes from an ID-verified organiser on the Tikkit platform. No time-wasters.' },
  { icon: '🎯', title: 'Category Discovery',   body: 'Artists are listed under DJs, Musicians, and Comedians — surfaced to organisers looking for exactly what you offer.' },
  { icon: '📋', title: 'Booking Pipeline',     body: 'Track each enquiry from submitted to booked. Respond, negotiate, and confirm — all in one place.' },
  { icon: '✅', title: 'Tikkit X Verified Badge', body: 'Our team reviews and publishes every profile. The verified badge on your artists signals quality to every organiser.' },
]

const ARTIST_TYPES = ['DJs', 'Live Bands', 'Solo Musicians', 'Stand-up Comedians', 'Classical Ensembles', 'Electronic Artists', 'Jazz Quartets', 'Spoken Word']

export default function ArtistMgmtHomePage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; color: ${C.text}; font-family: var(--font-body, 'DM Sans', sans-serif); -webkit-font-smoothing: antialiased; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .fade-up  { animation: fadeUp 0.7s ease both; }
        .fade-up-2 { animation: fadeUp 0.7s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, ${C.cyan}, ${C.magenta});
          color: #050508; font-weight: 800; font-size: 15px;
          padding: 14px 32px; border-radius: 12px; text-decoration: none;
          transition: opacity 0.2s, transform 0.2s;
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(0,229,255,0.06); color: ${C.muted};
          font-weight: 600; font-size: 15px;
          padding: 14px 28px; border-radius: 12px; text-decoration: none;
          border: 1px solid ${C.border};
          transition: background 0.2s, color 0.2s;
        }
        .btn-ghost:hover { background: rgba(0,229,255,0.1); color: ${C.text}; }
        .feature-card {
          background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px;
          padding: 28px; transition: border-color 0.2s, transform 0.2s;
        }
        .feature-card:hover { border-color: rgba(0,229,255,0.25); transform: translateY(-2px); }
        .type-chip {
          padding: 7px 16px; border-radius: 999px; font-size: 13px; font-weight: 600;
          background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.15);
          color: ${C.cyan};
        }
      `}</style>

      <div style={{ minHeight: '100vh' }}>

        {/* ── Nav ── */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: `${C.bg}e8`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎤</div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>Artist <span style={{ color: C.cyan }}>Management</span></span>
            <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>by Tikkit X</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/auth/login" className="btn-ghost" style={{ padding: '9px 20px', fontSize: 14 }}>Sign In</Link>
            <Link href="mailto:hello@tikkitx.com?subject=Artist Management Access" className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }}>Get Access →</Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ padding: '100px 40px 80px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${C.cyan}12`, border: `1px solid ${C.cyan}28`, borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: C.cyan, marginBottom: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ✦ For Management Companies
          </div>
          <h1 className="fade-up" style={{ fontFamily: 'var(--font-display, inherit)', fontSize: 'clamp(38px, 6vw, 66px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24 }}>
            Manage your roster.{' '}
            <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Grow your bookings.
            </span>
          </h1>
          <p className="fade-up-2" style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, marginBottom: 44 }}>
            Tikkit X Artist Management is built for management companies and agencies. Create verified profiles for your artists, receive structured booking enquiries from organisers, and manage your entire pipeline in one place.
          </p>
          <div className="fade-up-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="mailto:hello@tikkitx.com?subject=Artist Management Access" className="btn-primary">Request Access →</Link>
            <Link href="/auth/login" className="btn-ghost">Sign In</Link>
          </div>
        </section>

        {/* ── Artist type chips ── */}
        <section style={{ padding: '0 40px 80px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>We list every kind of performer</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {ARTIST_TYPES.map(t => <span key={t} className="type-chip">{t}</span>)}
          </div>
        </section>

        {/* ── Mock artist cards ── */}
        <section style={{ padding: '0 40px 80px', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { name: 'DJ Camo',       cat: 'DJ',       city: 'Karachi',  avail: 'Accepting', ac: C.cyan    },
              { name: 'The Brass Co.', cat: 'Musician', city: 'Lahore',   avail: 'Limited',   ac: '#F6C90E' },
              { name: 'Zara Matin',    cat: 'Comedian', city: 'Islamabad', avail: 'Accepting', ac: C.cyan    },
              { name: 'Echo Ensemble', cat: 'Musician', city: 'Karachi',  avail: 'Accepting', ac: C.cyan    },
            ].map(a => (
              <div key={a.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ height: 100, background: `linear-gradient(135deg, ${C.cyan}18, ${C.magenta}18)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 36, opacity: 0.3 }}>{a.name[0]}</span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{a.name}</span>
                    <span style={{ fontSize: 10, color: C.cyan }}>✓</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.cyan, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{a.cat} · {a.city}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: a.ac }} />
                    <span style={{ fontSize: 11, color: a.ac, fontWeight: 600 }}>{a.avail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ padding: '0 40px 100px', maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1px', textAlign: 'center', marginBottom: 12 }}>Everything a management company needs</h2>
          <p style={{ textAlign: 'center', color: C.muted, fontSize: 16, marginBottom: 56 }}>No agent fees. No commission. Just direct enquiries from real organisers.</p>
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
            {[
              { n: '01', title: 'Contact us for access',    body: 'Artist Management is for verified management companies and agencies. Email us and we\'ll onboard you within 48 hours.' },
              { n: '02', title: 'Add your artists',          body: 'Create profiles for each artist on your roster. Our team reviews and publishes each one with a verified badge.' },
              { n: '03', title: 'Receive enquiries',         body: 'Verified organisers on Tikkit send structured booking requests. You respond, negotiate, and confirm — all in your inbox.' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${C.cyan}10`, border: `1px solid ${C.cyan}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display, inherit)', fontSize: 13, fontWeight: 900, color: C.cyan, flexShrink: 0 }}>{s.n}</div>
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
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '64px 40px', maxWidth: 680, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: `${C.cyan}06`, filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: -80, left: -80, width: 240, height: 240, borderRadius: '50%', background: `${C.magenta}06`, filter: 'blur(40px)' }} />
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16, position: 'relative' }}>Ready to bring your roster online?</h2>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.65, marginBottom: 36, position: 'relative' }}>Get your management company set up on Tikkit X. Direct enquiries from verified organisers, zero commission.</p>
            <Link href="mailto:hello@tikkitx.com?subject=Artist Management Access" className="btn-primary" style={{ fontSize: 16, padding: '16px 40px', position: 'relative' }}>Request Access →</Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: C.muted }}>© 2026 Tikkit X · Artist Management</span>
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
