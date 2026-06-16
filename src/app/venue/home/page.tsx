import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Venues & Experiences — Run Your Space on TIKKIT X',
  description: 'Publish programmes, take slot bookings, manage enquiries, and get discovered by guests — all from one place. The venue OS for studios, courts, galleries, and beyond.',
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
  {
    icon: '📋',
    title: 'Publish Programmes',
    body: 'List your regular classes, workshops, and retreats with recurring schedules. Guests browse, register, and receive QR passes — no back-and-forth required.',
  },
  {
    icon: '🗓️',
    title: 'Slot Bookings',
    body: 'Let guests book your courts, studios, desks, and rooms by the hour or day. Conflict detection, instant confirmation, QR pass on every booking.',
  },
  {
    icon: '✉️',
    title: 'Enquiry Inbox',
    body: 'Custom event requests land in a single inbox. Track status from new → replied → confirmed without losing anything in email.',
  },
  {
    icon: '🔍',
    title: 'Guest Discovery',
    body: 'Your programmes and spaces surface in the TIKKIT X explore feed alongside events — reaching an audience already looking for things to do.',
  },
  {
    icon: '📲',
    title: 'QR Check-in',
    body: 'Every registration and booking generates a unique QR pass. Scan at the door — no app required for guests, no manual lists for you.',
  },
  {
    icon: '📊',
    title: 'Venue Analytics',
    body: 'See enquiry pipeline, booking rates, and peak slots. Know what\'s filling and what needs a push — without pulling data from three places.',
  },
]

const VENUE_TYPES = [
  'Yoga & Wellness Studios', 'Martial Arts Academies', 'Sports Courts',
  'Creative Workshops', 'Art Galleries', 'Music Studios',
  'Dance Studios', 'Co-working Spaces', 'Retreat Centres',
  'Private Dining Rooms', 'Rooftop Spaces', 'Community Halls',
]

export default function VenueHomePage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; color: ${C.text}; font-family: var(--font-body, 'DM Sans', sans-serif); -webkit-font-smoothing: antialiased; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up   { animation: fadeUp 0.7s ease both; }
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
        .how-step {
          display: flex; gap: 20px; align-items: flex-start;
          padding: 24px; background: ${C.surface};
          border: 1px solid ${C.border}; border-radius: 16px;
        }
        .how-num {
          flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, ${C.gold}22, ${C.gold}0a);
          border: 1px solid ${C.gold}33;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 15px; color: ${C.gold};
        }
      `}</style>

      <div style={{ minHeight: '100vh' }}>

        {/* ── Nav ── */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: `${C.bg}e8`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.gold}, #B8960C)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#0A0C0F' }}>V</div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>Venues <span style={{ color: C.gold }}>&</span> Experiences</span>
            <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>by TIKKIT X</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/auth/login" className="btn-ghost" style={{ padding: '9px 20px', fontSize: 14 }}>Sign In</Link>
            <Link href="mailto:hello@tikkitx.com?subject=List My Venue" className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }}>Get Started →</Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ padding: '100px 40px 80px', textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
          <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${C.gold}14`, border: `1px solid ${C.gold}30`, borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ✦ Now Onboarding Venues
          </div>

          <h1 className="fade-up" style={{ fontFamily: 'var(--font-display, inherit)', fontSize: 'clamp(38px, 6vw, 66px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24 }}>
            Your space.{' '}
            <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.teal})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Your programmes.
            </span>
            <br />Your community.
          </h1>

          <p className="fade-up-2" style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, marginBottom: 44, maxWidth: 640, margin: '0 auto 44px' }}>
            TIKKIT X gives venues a complete operating system — publish recurring classes, open your spaces for hourly bookings, manage enquiries, and get discovered by guests looking for exactly what you offer.
          </p>

          <div className="fade-up-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="mailto:hello@tikkitx.com?subject=List My Venue" className="btn-primary">Get Your Venue Live →</Link>
            <Link href="/venues" className="btn-ghost">Browse Venues</Link>
          </div>
        </section>

        {/* ── Venue type chips ── */}
        <section style={{ padding: '0 40px 80px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Built for every kind of active space</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {VENUE_TYPES.map(t => <span key={t} className="type-chip">{t}</span>)}
          </div>
        </section>

        {/* ── Stats ── */}
        <section style={{ padding: '0 40px 80px', maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { value: '3',    label: 'Revenue Streams',     sub: 'programmes · slot bookings · enquiries' },
              { value: '48h',  label: 'From Signup to Live', sub: 'onboarding takes under two days' },
              { value: '0%',   label: 'Commission',           sub: 'all payments stay between you and your guests' },
            ].map(s => (
              <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.gold, letterSpacing: '-1.5px', marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ padding: '0 40px 100px', maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1px', textAlign: 'center', marginBottom: 12 }}>How it works</h2>
          <p style={{ textAlign: 'center', color: C.muted, fontSize: 16, marginBottom: 48 }}>Three ways to earn from your space — run all of them or just what fits.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                n: '1',
                title: 'Publish a Programme',
                body: 'Create a recurring class or workshop — yoga, BJJ, pottery, coding bootcamp. Set the schedule, price, and capacity. Guests browse and register directly from the explore page.',
              },
              {
                n: '2',
                title: 'Open a Bookable Space',
                body: 'Got a court, studio, or private room sitting idle? Open it for hourly or daily bookings. You set the times, guests pick a slot, and the system handles conflict detection.',
              },
              {
                n: '3',
                title: 'Receive Enquiries',
                body: 'For custom requests — a private event, a corporate shoot, a one-off workshop — guests send an enquiry through the app. You reply, agree terms, and handle payment directly.',
              },
            ].map(step => (
              <div key={step.n} className="how-step">
                <div className="how-num">{step.n}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{step.body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ padding: '0 40px 100px', maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1px', textAlign: 'center', marginBottom: 12 }}>Everything in one place</h2>
          <p style={{ textAlign: 'center', color: C.muted, fontSize: 16, marginBottom: 56 }}>No extra tools. No calendar gymnastics. No chasing WhatsApp messages.</p>
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
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>✦ Ready to go live?</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>Stop leaving your space empty</h2>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.65, marginBottom: 36 }}>
              Drop us a message and we'll have you live within 48 hours. No setup fee, no commission — ever.
            </p>
            <Link href="mailto:hello@tikkitx.com?subject=List My Venue" className="btn-primary" style={{ fontSize: 16, padding: '16px 40px' }}>Get Your Venue Live →</Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: C.muted }}>© 2026 TIKKIT X · Venues & Experiences</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="https://tikkitx.com" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>tikkitx.com</Link>
            <Link href="/venues" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>Browse Venues</Link>
            <Link href="/auth/login" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>Sign In</Link>
            <Link href="mailto:hello@tikkitx.com" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>Contact</Link>
          </div>
        </footer>

      </div>
    </>
  )
}
