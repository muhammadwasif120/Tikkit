'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CalendarDays, QrCode, WifiOff, CreditCard,
  BarChart2, CheckCircle, Heart, ChevronRight,
  Mountain, BookOpen, Compass, Award, ArrowRight,
  Menu, X, Star, Sparkles, Leaf, MapPin, Users,
} from 'lucide-react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCountUp(target: number, inView: boolean, duration = 1600) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(eased * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target, duration])
  return count
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: CalendarDays,
    color: '#6B8F71', bg: 'rgba(107,143,113,0.12)',
    title: 'One Link. Every Location.',
    desc: 'Open, curated, or approval-based registration. Share a single link — participants register, pay, and receive their TIKKIT X QR pass without a single DM from you.',
  },
  {
    icon: MapPin,
    color: '#C2785C', bg: 'rgba(194,120,92,0.12)',
    title: 'Your Practice Travels With You',
    desc: "Host in a borrowed studio, a mountain lodge, a client's garden, a rooftop in DHA. Pulse is tied to you — not to a fixed address. No permanent venue required.",
  },
  {
    icon: WifiOff,
    color: '#6B8F71', bg: 'rgba(107,143,113,0.12)',
    title: 'The Mountains Don\'t Have WiFi. That\'s Fine.',
    desc: 'QR check-in works completely offline. Download your list before you leave, scan on arrival, sync when you\'re back in range. Built for Murree, Hunza, Swat, and anywhere the signal drops.',
  },
  {
    icon: CreditCard,
    color: '#C2785C', bg: 'rgba(194,120,92,0.12)',
    title: 'No More Screenshot Chaos',
    desc: 'JazzCash, EasyPaisa, bank transfer — all accepted, all tracked automatically. Your dashboard knows who\'s paid. You don\'t have to.',
  },
  {
    icon: CheckCircle,
    color: '#6B8F71', bg: 'rgba(107,143,113,0.12)',
    title: 'Attendance That Actually Means Something',
    desc: 'Every scan creates a verified record — the foundation for certificates, CPD credentials, and community trust. Not a spreadsheet. Proof.',
  },
  {
    icon: BarChart2,
    color: '#C2785C', bg: 'rgba(194,120,92,0.12)',
    title: 'Know Your Community',
    desc: 'Who keeps coming back. What formats fill fastest. Where your people are. Understanding your participants is how you grow the practice you actually want.',
  },
]

const practitioners = [
  {
    icon: Mountain,
    title: 'The Retreat Facilitator',
    desc: 'You curate multi-day experiences in rented venues — mountain lodges, farmhouses, borrowed studios. Pulse handles logistics so you can hold space instead of chasing confirmations.',
  },
  {
    icon: Compass,
    title: 'The Travelling Practitioner',
    desc: "Islamabad this week, Murree next weekend, Karachi in a month. Your schedule moves. Your booking system should too — without rebuilding it from scratch every time.",
  },
  {
    icon: BookOpen,
    title: 'The Independent Teacher',
    desc: 'You teach wherever the group gathers — a park, a studio you rent by the hour, a client\'s home. Pulse makes you look as established as any institution.',
  },
  {
    icon: Award,
    title: 'The Knowledge Creator',
    desc: 'Workshops, masterclasses, CPD programmes. Your expertise is the product. Verified attendance records make your certificates worth something — and your participants know it.',
  },
]

const steps = [
  { n: '1', title: 'Set Up Your Practice',  desc: 'Create your session in minutes. Set capacity, pricing, location, and requirements — as intimate or as open as you want.', color: '#6B8F71' },
  { n: '2', title: 'Share One Link',         desc: 'Post it on Instagram or drop it in WhatsApp. Participants register, pay, and get their TIKKIT X pass — no follow-up needed.', color: '#C2785C' },
  { n: '3', title: 'Arrive. Be Present.',    desc: 'Scan at the door. Your dashboard handles the rest. Review who came, grow the next session, build the community.', color: '#D4A574' },
]

const practitionerTypes = [
  'Yoga Teacher', 'Sound Healer', 'Breathwork Facilitator', 'Retreat Host',
  'Meditation Guide', 'Movement Coach', 'Art Therapist', 'Nature Guide',
  'Cacao Ceremonialist', 'Workshop Facilitator', 'Life Coach', 'Nutritionist',
]

const heroCards = [
  { label: 'OPEN',     title: 'Mountain Yoga Retreat',    sub: 'Murree · 12 spots left',    spots: 12, total: 24, color: '#6B8F71' },
  { label: 'UPCOMING', title: 'Sound Bath & Cacao Circle', sub: 'DHA Karachi · Sat 5 Apr',   spots: 18, total: 20, color: '#C2785C' },
]

const testimonials = [
  { name: 'Sana M.',  role: 'Retreat Facilitator',    text: 'Registration used to take me hours. Now it literally handles itself. I actually showed up rested.' },
  { name: 'Zara K.',  role: 'Yoga Teacher',            text: 'My participants love getting the pass on the TIKKIT X app. It feels real and professional — which it should, because what I do is.' },
  { name: 'Bilal A.', role: 'Breathwork Facilitator',  text: 'Finally someone built for the practitioner, not just the venue. This is the difference.' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatItem({ target, suffix, label, prefix = '' }: { target: number; suffix: string; label: string; prefix?: string }) {
  const { ref, inView } = useInView(0.3)
  const count = useCountUp(target, inView)
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 800, color: '#3D3D3D', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {prefix}{count}{suffix}
      </div>
      <p style={{ color: '#7A7A7A', fontSize: 14, marginTop: 8, fontWeight: 500 }}>{label}</p>
    </div>
  )
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const { ref, inView } = useInView()
  const [hovered, setHovered] = useState(false)
  const Icon = feature.icon
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(107,143,113,0.03)' : '#fff',
        border: `1px solid ${hovered ? feature.color + '50' : '#E8E2DA'}`,
        borderRadius: 20, padding: '28px 26px', cursor: 'default',
        transition: 'all 0.35s ease',
        boxShadow: hovered ? `0 8px 32px rgba(107,143,113,0.12)` : '0 1px 4px rgba(0,0,0,0.04)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${index * 0.07}s`,
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: feature.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginBottom: 18,
        transition: 'transform 0.3s ease',
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
      }}>
        <Icon size={22} color={feature.color} />
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#2D2D2D', marginBottom: 8 }}>{feature.title}</h3>
      <p style={{ fontSize: 14, color: '#7A7A7A', lineHeight: 1.75 }}>{feature.desc}</p>
    </div>
  )
}

function HeroCard({ card, delay }: { card: typeof heroCards[0]; delay: number }) {
  const pct = Math.round(((card.total - card.spots) / card.total) * 100)
  return (
    <div style={{
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0,0,0,0.08)', borderRadius: 20, padding: '20px 22px',
      animation: `pulseFloat ${3.5 + delay}s ease-in-out ${delay}s infinite alternate`,
      minWidth: 250, boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: card.color, animation: 'pulseDot 2s ease infinite', flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: card.color, letterSpacing: '0.1em' }}>{card.label}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#2D2D2D', marginBottom: 4 }}>{card.title}</p>
      <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>{card.sub}</p>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>Capacity</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: card.color }}>{card.total - card.spots}/{card.total} registered</span>
        </div>
        <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${card.color}, ${card.color}99)`, borderRadius: 3, transition: 'width 1.5s ease' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <QrCode size={11} color="#9CA3AF" />
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>TIKKIT X pass</span>
        </div>
        <span style={{ fontSize: 11, color: card.color, fontWeight: 600 }}>{card.spots} spots left</span>
      </div>
    </div>
  )
}

function TestimonialCard({ t, index }: { t: typeof testimonials[0]; index: number }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} style={{
      background: '#fff', borderRadius: 20, padding: '28px 24px',
      border: '1px solid #E8E2DA', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.55s ease ${index * 0.12}s, transform 0.55s ease ${index * 0.12}s`,
    }}>
      <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
        {[0,1,2,3,4].map(i => <Star key={i} size={14} color="#D4A574" fill="#D4A574" />)}
      </div>
      <p style={{ fontSize: 14, color: '#5A5A5A', lineHeight: 1.8, marginBottom: 20, fontStyle: 'italic' }}>"{t.text}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6B8F71, #C2785C)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.name[0]}</span>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2D2D2D' }}>{t.name}</p>
          <p style={{ fontSize: 11, color: '#9CA3AF' }}>{t.role}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PulsePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const statsSection = useInView(0.2)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const marqueeItems = [...practitionerTypes, ...practitionerTypes]

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        body {
          background: #FAF8F5;
          color: #3D3D3D;
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        :root {
          --pulse-bg:    #FAF8F5;
          --pulse-warm:  #F5F0EB;
          --pulse-green: #EDF2EE;
          --pulse-sage:  #6B8F71;
          --pulse-terra: #C2785C;
          --pulse-gold:  #D4A574;
          --pulse-text:  #2D2D2D;
          --pulse-muted: #7A7A7A;
          --pulse-border:#E8E2DA;
        }

        @keyframes pulseFloat {
          from { transform: translateY(0px); }
          to   { transform: translateY(-14px); }
        }
        @keyframes pulseMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes pulseFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.4); opacity: 0.6; }
        }
        @keyframes pulseOrb {
          0%, 100% { transform: scale(1) translate(0, 0); }
          33%       { transform: scale(1.1) translate(3%, -2%); }
          66%       { transform: scale(0.95) translate(-2%, 3%); }
        }

        .pulse-nav-link {
          font-size: 14px; font-weight: 500; color: #7A7A7A;
          text-decoration: none; transition: color 0.2s; cursor: pointer;
        }
        .pulse-nav-link:hover { color: #3D3D3D; }

        .pulse-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 30px; border-radius: 100px; font-weight: 700;
          font-size: 14px; cursor: pointer; text-decoration: none;
          background: #C2785C; color: #fff; border: none;
          transition: all 0.25s; font-family: var(--font-body);
          box-shadow: 0 4px 14px rgba(194,120,92,0.35);
        }
        .pulse-btn-primary:hover { background: #A86449; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(194,120,92,0.4); }

        .pulse-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 30px; border-radius: 100px; font-weight: 600;
          font-size: 14px; cursor: pointer; text-decoration: none;
          background: transparent; color: #6B8F71;
          border: 1.5px solid #C5D9C8;
          transition: all 0.25s; font-family: var(--font-body);
        }
        .pulse-btn-ghost:hover { background: rgba(107,143,113,0.06); border-color: #6B8F71; }

        .pulse-label {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #6B8F71;
          padding: 6px 14px; border-radius: 100px;
          background: #EDF2EE; border: 1px solid #C5D9C8;
          margin-bottom: 20px;
        }

        .pulse-marquee-wrap {
          overflow: hidden; position: relative;
          mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
        }
        .pulse-marquee-track {
          display: flex; gap: 0;
          animation: pulseMarquee 36s linear infinite;
          width: max-content;
        }

        .pulse-step {
          background: #fff; border-radius: 20px; padding: 36px 30px;
          border: 1px solid #E8E2DA;
          transition: box-shadow 0.3s, transform 0.3s;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .pulse-step:hover {
          box-shadow: 0 12px 40px rgba(107,143,113,0.12);
          transform: translateY(-4px);
        }

        .pulse-practitioner-card {
          background: #fff; border-radius: 20px; padding: 30px 26px;
          border: 1px solid #E8E2DA;
          transition: all 0.3s; cursor: default;
          box-shadow: 0 1px 4px rgba(0,0,0,0.03);
        }
        .pulse-practitioner-card:hover {
          border-color: #C5D9C8;
          box-shadow: 0 8px 28px rgba(107,143,113,0.1);
          transform: translateY(-3px);
        }

        @media (max-width: 768px) {
          .pulse-hide-mobile { display: none !important; }
          .pulse-hero-cards  { display: none !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(250,248,245,0.94)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: `1px solid ${scrolled ? '#E8E2DA' : 'transparent'}`,
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TikkitXLogo size="sm" />
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 100, background: '#EDF2EE', color: '#6B8F71', letterSpacing: '0.08em', textTransform: 'uppercase' as const, border: '1px solid #C5D9C8' }}>Pulse</span>
          </div>
          <nav className="pulse-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {['Features', 'How It Works', 'For Practitioners'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="pulse-nav-link">{l}</a>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="mailto:pulse@tikkitx.com" className="pulse-btn-primary pulse-hide-mobile" style={{ padding: '11px 24px', fontSize: 13 }}>Start Hosting</a>
            <button onClick={() => setMenuOpen(v => !v)} style={{ background: 'none', border: 'none', color: '#7A7A7A', cursor: 'pointer', padding: 8 }}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div style={{ background: '#FAF8F5', borderTop: '1px solid #E8E2DA', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['Features', 'How It Works', 'For Practitioners'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="pulse-nav-link" onClick={() => setMenuOpen(false)}>{l}</a>
            ))}
            <a href="mailto:pulse@tikkitx.com" className="pulse-btn-primary" style={{ justifyContent: 'center' }}>Start Hosting</a>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden', paddingTop: 68,
        background: 'linear-gradient(160deg, #EDF2EE 0%, #FAF8F5 45%, #F5F0EB 100%)',
      }}>
        <div style={{ position: 'absolute', top: '8%', right: '12%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,143,113,0.18) 0%, transparent 65%)', animation: 'pulseOrb 9s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(194,120,92,0.13) 0%, transparent 65%)', animation: 'pulseOrb 12s ease-in-out 3s infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, #6B8F71 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', display: 'flex', alignItems: 'center', gap: 64, width: '100%' }}>
          {/* Left */}
          <div style={{ flex: 1, animation: 'pulseFadeUp 0.7s ease both' }}>
            <div className="pulse-label">
              <Leaf size={11} /> For the Practitioner. Not the Platform.
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 300, lineHeight: 1.08,
              fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', color: '#2D2D2D',
              letterSpacing: '-0.02em', marginBottom: 28,
            }}>
              Your practice.<br />
              <span style={{ color: '#6B8F71', fontWeight: 700 }}>Any room.<br />Every time.</span>
            </h1>
            <p style={{ fontSize: 18, color: '#7A7A7A', lineHeight: 1.8, marginBottom: 40, maxWidth: 480 }}>
              You're not running a venue. You're running a practice — and it should travel as easily as you do. Pulse handles registration, payment, QR passes, and attendance so you can be fully present for the people who show up.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="mailto:pulse@tikkitx.com" className="pulse-btn-primary" style={{ fontSize: 15, padding: '16px 36px' }}>
                Start Hosting <ArrowRight size={17} />
              </a>
              <a href="#features" className="pulse-btn-ghost" style={{ fontSize: 15, padding: '16px 32px' }}>
                See What's Possible
              </a>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 36 }}>
              {['No permanent venue needed', 'Works without WiFi', 'Attendees get the TIKKIT X app', 'Built for practitioners'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7A7A7A', padding: '5px 12px', borderRadius: 100, background: '#fff', border: '1px solid #E8E2DA', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <CheckCircle size={11} color="#6B8F71" /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating cards */}
          <div className="pulse-hero-cards" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, animation: 'pulseFadeUp 0.7s ease 0.25s both' }}>
            {heroCards.map((card, i) => <HeroCard key={card.title} card={card} delay={i * 1.0} />)}
            <div style={{
              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, padding: '18px 20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
              animation: 'pulseFloat 5s ease-in-out 2s infinite alternate',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircle size={14} color="#6B8F71" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6B8F71' }}>Registration Confirmed</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2D2D2D', marginBottom: 2 }}>Zara K. — Sound Bath</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 14 }}>Sat 5 Apr · 7:00 PM · DHA Karachi</p>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', background: '#FAF8F5', borderRadius: 10, border: '1px solid #E8E2DA' }}>
                <QrCode size={40} color="#6B8F71" opacity={0.7} />
              </div>
              <p style={{ fontSize: 10, color: '#C5D9C8', textAlign: 'center', marginTop: 8 }}>Verified · Scan at entry via TIKKIT X</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRACTITIONER MARQUEE ── */}
      <div style={{ background: '#EDF2EE', borderTop: '1px solid #C5D9C8', borderBottom: '1px solid #C5D9C8', padding: '16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ padding: '0 32px', fontSize: 11, fontWeight: 700, color: '#6B8F71', letterSpacing: '0.1em', textTransform: 'uppercase' as const, flexShrink: 0, whiteSpace: 'nowrap' as const }}>
            Practitioners
          </div>
          <div className="pulse-marquee-wrap" style={{ flex: 1 }}>
            <div className="pulse-marquee-track">
              {marqueeItems.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0 28px', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6B8F71', whiteSpace: 'nowrap' as const }}>{t}</span>
                  <span style={{ marginLeft: 28, width: 5, height: 5, borderRadius: '50%', background: '#C2785C', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <section ref={statsSection.ref} style={{ padding: '80px 24px', background: '#FAF8F5', borderBottom: '1px solid #E8E2DA' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
          <StatItem target={300}  suffix="+"   label="Sessions hosted" />
          <StatItem target={8000} suffix="+"   label="Participants registered" />
          <StatItem target={4}    suffix=".9★" label="Average host rating" />
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ padding: '80px 24px', background: '#F5F0EB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 300, color: '#2D2D2D', letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.2 }}>
              You Don't Need a Studio.<br />
              <span style={{ color: '#6B8F71', fontWeight: 700 }}>You Need a System.</span>
            </h2>
            <p style={{ fontSize: 17, color: '#7A7A7A', maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
              Practitioners who travel, teach across multiple spaces, and host in rented venues shouldn't have to rebuild their admin from scratch every time.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { icon: CalendarDays, title: 'Signups in Five Different Places',      body: "Instagram DMs, WhatsApp voice notes, Google Forms, bank transfers. You have no idea who's confirmed until the morning of — and the morning of is when you need to be grounded, not chasing." },
              { icon: Award,        title: 'They Showed Up. There\'s No Record.',   body: 'Three days in the mountains. Something real happened. They leave with nothing official — no verified record, no certificate, no proof it was real. Just a memory and a group chat.' },
              { icon: BarChart2,    title: 'Sunday Night. Reconciling Screenshots.', body: "Your retreat ended six hours ago. You're matching payment screenshots to names in your Notes app. You became a practitioner for the work. This is not the work." },
            ].map(({ icon: Icon, title, body }) => {
              const { ref, inView } = useInView()
              return (
                <div key={title} ref={ref} style={{
                  padding: '30px 26px', borderRadius: 20, background: '#FAF8F5',
                  border: '1px solid #E8E2DA',
                  opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: '#EDF2EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <Icon size={22} color="#6B8F71" />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#2D2D2D', marginBottom: 10 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#7A7A7A', lineHeight: 1.8 }}>{body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '96px 24px', background: '#EDF2EE', borderTop: '1px solid #C5D9C8', borderBottom: '1px solid #C5D9C8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="pulse-label"><Sparkles size={11} /> Platform</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 300, color: '#2D2D2D', letterSpacing: '-0.02em', marginBottom: 16 }}>
              The Infrastructure That Gets Out of Your Way
            </h2>
            <p style={{ fontSize: 17, color: '#7A7A7A', maxWidth: 480, margin: '0 auto', lineHeight: 1.8 }}>
              Everything that needs to run — running. So you can be present for the part that matters.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {features.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '96px 24px', background: '#FAF8F5' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="pulse-label"><Heart size={11} /> Process</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 300, color: '#2D2D2D', letterSpacing: '-0.02em' }}>
              Three Steps. Then You&apos;re Present.
            </h2>
            <p style={{ fontSize: 16, color: '#7A7A7A', marginTop: 14, maxWidth: 400, margin: '14px auto 0', lineHeight: 1.8 }}>
              Solo facilitator or multi-day retreat — the setup is the same. Fast, clear, done.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {steps.map((step, i) => {
              const { ref, inView } = useInView()
              return (
                <div key={step.n} ref={ref} className="pulse-step" style={{
                  opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)',
                  transition: `opacity 0.55s ease ${i * 0.13}s, transform 0.55s ease ${i * 0.13}s`,
                  textAlign: 'center',
                }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: step.color + '18', border: `2px solid ${step.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 300, color: step.color }}>
                    {step.n}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#2D2D2D', marginBottom: 12 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: '#7A7A7A', lineHeight: 1.8 }}>{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FOR PRACTITIONERS ── */}
      <section id="for-practitioners" style={{ padding: '96px 24px', background: '#F5F0EB', borderTop: '1px solid #E8E2DA' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="pulse-label"><Users size={11} /> Who It's For</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 300, color: '#2D2D2D', letterSpacing: '-0.02em' }}>
              The Practice Is You.<br />
              <span style={{ fontWeight: 700, color: '#6B8F71' }}>Not the Room.</span>
            </h2>
            <p style={{ fontSize: 17, color: '#7A7A7A', maxWidth: 480, margin: '16px auto 0', lineHeight: 1.8 }}>
              Pulse is for practitioners whose work doesn't live in one place — it lives in them.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {practitioners.map(({ icon: Icon, title, desc }) => {
              const { ref, inView } = useInView()
              return (
                <div key={title} ref={ref} className="pulse-practitioner-card" style={{
                  opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: '#EDF2EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Icon size={24} color="#6B8F71" />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#2D2D2D', marginBottom: 10 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#7A7A7A', lineHeight: 1.75 }}>{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '96px 24px', background: '#FAF8F5' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="pulse-label"><Star size={11} /> From Creators</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 300, color: '#2D2D2D', letterSpacing: '-0.02em' }}>
              From Practitioners Who Did It the Hard Way First
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {testimonials.map((t, i) => <TestimonialCard key={t.name} t={t} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── MANIFESTO ── */}
      <section style={{ padding: '80px 24px 96px', background: '#EDF2EE', borderTop: '1px solid #C5D9C8', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="pulse-label" style={{ margin: '0 auto 24px' }}><Heart size={11} /> A Movement, Not a Feature</div>
          <p style={{ fontSize: 18, color: '#5A5A5A', lineHeight: 1.9 }}>
            Pulse exists for people who believe the best things still happen in a room — and that the practitioner standing in it deserves infrastructure as serious as their work. Presence is the point. Everything else should be invisible.
          </p>
          <div style={{ margin: '40px auto 0', width: 48, height: 2, background: 'linear-gradient(90deg, transparent, #6B8F71, transparent)' }} />
        </div>
      </section>

      {/* ── GEO SECTION ── */}
      <section style={{ padding: '96px 24px', background: '#F5F0EB', borderTop: '1px solid #E8E2DA' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="pulse-label"><Mountain size={11} /> Where Pakistan&apos;s Practitioners Go</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 300, color: '#2D2D2D', letterSpacing: '-0.02em', marginBottom: 16 }}>
              From the Mountains to the City.<br />
              <span style={{ fontWeight: 700, color: '#6B8F71' }}>Pulse Goes With You.</span>
            </h2>
            <p style={{ fontSize: 17, color: '#7A7A7A', maxWidth: 480, margin: '0 auto', lineHeight: 1.8 }}>
              Practitioners across Pakistan — from mountain retreat hosts to urban studio teachers — host on Pulse because the admin works wherever they do.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              {
                place: 'Murree & Nathia Gali', icon: '⛰️',
                desc: "Pakistan's most popular retreat corridor. 90 minutes from Islamabad, misty pine forests, mountain lodges. Pulse's offline check-in was built for hosts here — where WiFi is a luxury and your guest list can't wait for signal.",
                types: ['Yoga Retreats', 'Digital Detox', 'Women\'s Circles'],
              },
              {
                place: 'Hunza Valley', icon: '🏔️',
                desc: "For the practitioner who doesn't compromise on setting. Karakoram backdrop, glacial air, and participants who flew in specifically to be here. Pulse handles the logistics so you can focus on what they came for.",
                types: ['Multi-Day Retreats', 'Mindfulness Programmes', 'Adventure Wellness'],
              },
              {
                place: 'Islamabad', icon: '🌿',
                desc: "Pakistan's wellness capital. The Margalla Hills, rented studios, and farmhouse spaces within 45 minutes of the city. A concentrated audience of professionals who invest in experiences. Day sessions and weekend programmes thrive here.",
                types: ['Sound Healing', 'Women\'s Wellness', 'Breathwork Circles'],
              },
              {
                place: 'Lahore & Karachi', icon: '🏙️',
                desc: "Urban wellness is growing fast. Boutique sessions in private venues, sound baths in DHA, workshops in borrowed lofts. Pakistan's two largest cities have an audience that's ready — and Pulse handles everything so you just show up.",
                types: ['Studio Sessions', 'Workshops', 'Community Circles'],
              },
            ].map(({ place, icon, desc, types }) => (
              <div key={place} style={{ background: '#fff', border: '1px solid #E8E2DA', borderRadius: 20, padding: '28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#2D2D2D', marginBottom: 12 }}>{place}</h3>
                <p style={{ fontSize: 14, color: '#7A7A7A', lineHeight: 1.75, marginBottom: 18 }}>{desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {types.map(type => (
                    <span key={type} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: '#EDF2EE', color: '#6B8F71', border: '1px solid #C5D9C8' }}>{type}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 24px', background: '#FAF8F5', borderTop: '1px solid #E8E2DA' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 300, color: '#2D2D2D', letterSpacing: '-0.02em' }}>
              Questions From Practitioners
            </h2>
          </div>
          {[
            {
              q: 'Do my participants need to download anything?',
              a: 'Yes — and that\'s a feature, not a limitation. Participants receive their QR pass inside the TIKKIT X app. It means they have their pass on their phone, you can scan them in instantly, and they stay connected to your future sessions in the app.',
            },
            {
              q: 'How does offline check-in work at mountain venues?',
              a: 'Download your participant list before you leave. Pulse works completely offline — scan QR codes without internet, all check-ins sync when you\'re back in range. Built for Murree, Hunza, Swat, and anywhere the signal goes.',
            },
            {
              q: 'I don\'t have a fixed studio. Can I still use Pulse?',
              a: "Absolutely — Pulse is designed for exactly this. You set the location per session, not per account. Host in a borrowed studio one week, a mountain lodge the next, a client's garden after that. The admin travels with you.",
            },
            {
              q: 'Can I issue certificates of attendance?',
              a: "Yes. Every scan creates a verified attendance record. Export the confirmed list and generate certificates for those who checked in — your certificates are based on real data, not a spreadsheet guess.",
            },
            {
              q: 'How do I accept payments in Pakistan?',
              a: 'JazzCash, EasyPaisa, bank transfer, and card — all accepted, all tracked automatically. Your dashboard knows who\'s paid. You don\'t have to.',
            },
          ].map(({ q, a }, i) => (
            <details key={i} style={{ borderBottom: '1px solid #E8E2DA', padding: '20px 0' }}>
              <summary style={{ fontSize: 16, fontWeight: 700, color: '#2D2D2D', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {q}
                <ChevronRight size={18} color="#6B8F71" style={{ flexShrink: 0, marginLeft: 16 }} />
              </summary>
              <p style={{ fontSize: 14, color: '#7A7A7A', lineHeight: 1.8, marginTop: 14 }}>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '96px 24px', background: 'linear-gradient(160deg, #6B8F71 0%, #5a7d60 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '60%', height: '200%', background: 'rgba(255,255,255,0.06)', transform: 'rotate(20deg)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 300, color: '#fff', letterSpacing: '-0.025em', marginBottom: 20 }}>
            Stop Running Your Practice on Vibes and Voice Notes.
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', marginBottom: 44, lineHeight: 1.8 }}>
            Your work deserves infrastructure that takes it as seriously as you do. Join practitioners across Pakistan who made the switch.
          </p>
          <a href="mailto:pulse@tikkitx.com" className="pulse-btn-primary" style={{ fontSize: 16, padding: '18px 44px', background: '#C2785C', boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>
            Start Hosting on Pulse <ChevronRight size={18} />
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#EDF2EE', borderTop: '1px solid #C5D9C8', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TikkitXLogo size="sm" />
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 100, background: '#FAF8F5', color: '#6B8F71', letterSpacing: '0.08em', textTransform: 'uppercase' as const, border: '1px solid #C5D9C8' }}>Pulse</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {[['Terms & Conditions', '/terms'], ['Privacy Policy', '/privacy'], ['Contact', 'mailto:pulse@tikkitx.com']].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: 13, color: '#7A7A7A', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#3D3D3D')}
                onMouseLeave={e => (e.currentTarget.style.color = '#7A7A7A')}
              >{label}</a>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>A product of <span style={{ color: '#5A5A5A', fontWeight: 600 }}>Two Bit Digital</span></p>
        </div>
      </footer>
    </>
  )
}
