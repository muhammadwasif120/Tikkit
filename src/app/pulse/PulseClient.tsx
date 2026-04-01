'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CalendarDays, QrCode, WifiOff, CreditCard, Store, BarChart2,
  Leaf, CheckCircle, Signal, Heart, ChevronRight, Mountain,
  BookOpen, Compass, Award, ArrowRight, Menu, X, Star, Sparkles,
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
  { icon: CalendarDays, color: '#6B8F71', bg: 'rgba(107,143,113,0.12)', title: 'One Link. Done.',                  desc: 'Open, curated, or approval-based. Guests register, pay, and get their QR pass — all through a single link you share anywhere.' },
  { icon: CheckCircle,  color: '#6B8F71', bg: 'rgba(107,143,113,0.12)', title: 'Attendance That Counts',           desc: 'Every scan creates a verified attendance record — the foundation for certificates, credentials, and community tracking.' },
  { icon: WifiOff,      color: '#C2785C', bg: 'rgba(194,120,92,0.12)',  title: 'The Mountains Don\'t Have WiFi. That\'s Fine.', desc: 'Your check-in works without signal and syncs when you\'re back online. Built for retreats that go off the grid.' },
  { icon: CreditCard,   color: '#C2785C', bg: 'rgba(194,120,92,0.12)',  title: 'No More Screenshot Chaos',         desc: 'JazzCash, EasyPaisa, bank transfer — all accepted, all tracked. Your dashboard is the only place you need to look.' },
  { icon: Store,        color: '#6B8F71', bg: 'rgba(107,143,113,0.12)', title: 'Verified Partners, Not Blind Luck', desc: 'Find photographers, caterers, and venue partners with verified event histories. Tikkit vets them so you don\'t have to.' },
  { icon: BarChart2,    color: '#C2785C', bg: 'rgba(194,120,92,0.12)',  title: 'Know Your Community',              desc: 'Who comes back. What they love. How the numbers move. Understanding your participants is how you grow them.' },
]

const useCases = [
  { icon: Mountain,  title: 'Yoga & Wellness Retreats',     desc: 'Multi-day retreats, dietary preferences, offline check-in for mountain venues. Everything a wellness host needs.' },
  { icon: BookOpen,  title: 'Workshops & Masterclasses',    desc: 'Skills sessions, attendance records, the foundation for CPD certificates. Your knowledge deserves a proper home.' },
  { icon: Compass,   title: 'Travel & Adventure Trips',     desc: 'Group trips, activity slots, participant tracking that works in the middle of nowhere. Your adventure, managed.' },
  { icon: Award,     title: 'Professional Development',     desc: 'Training sessions, CPD tracking, verified records. The administrative backbone for serious learning.' },
]

const steps = [
  { n: '1', title: 'Build the Space',    desc: 'Create your retreat in minutes. Set capacity, pricing, requirements. As open or as curated as you want.', color: '#6B8F71' },
  { n: '2', title: 'Open the Door',      desc: 'Drop your link on Instagram or WhatsApp. Participants register, pay, and get their QR pass — no friction.', color: '#C2785C' },
  { n: '3', title: 'Arrive. Breathe. Begin.', desc: 'Scan at the door. Your dashboard handles everything else. Review insights and grow your community after.', color: '#D4A574' },
]

const experienceTypes = [
  'Yoga Retreat', 'Sound Bath', 'Art Workshop', 'Nature Hike', 'Meditation', 'Pottery Class',
  'Breathwork', 'Journaling', 'Cacao Ceremony', 'Masterclass', 'Book Club', 'Dance Workshop',
]

const heroCards = [
  { label: 'OPEN',     title: 'Mountain Yoga Retreat',   sub: 'Muree · 12 spots left', spots: 12, total: 24, color: '#6B8F71' },
  { label: 'UPCOMING', title: 'Sound Bath & Cacao Circle', sub: 'DHA Karachi · Sat 5 Apr', spots: 18, total: 20, color: '#C2785C' },
]

const testimonials = [
  { name: 'Sana M.',    role: 'Retreat Host',        text: 'Registration used to take me hours. Now it literally handles itself.' },
  { name: 'Zara K.',    role: 'Yoga Instructor',     text: 'My participants love getting the QR pass. It feels professional and legit.' },
  { name: 'Bilal A.',   role: 'Workshop Facilitator', text: 'Finally someone built something for us. Not for conferences. For this.' },
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
        background: hovered ? 'rgba(107,143,113,0.04)' : '#fff',
        border: `1px solid ${hovered ? feature.color + '50' : '#E8E2DA'}`,
        borderRadius: 20,
        padding: '28px 26px',
        cursor: 'default',
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
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 20,
      padding: '20px 22px',
      animation: `pulseFloat ${3.5 + delay}s ease-in-out ${delay}s infinite alternate`,
      minWidth: 250,
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
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
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>QR included</span>
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
      border: '1px solid #E8E2DA',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
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

  const marqueeItems = [...experienceTypes, ...experienceTypes]

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

        @keyframes pulseWave {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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
          animation: pulseMarquee 32s linear infinite;
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

        .pulse-use-card {
          background: #fff; border-radius: 20px; padding: 30px 26px;
          border: 1px solid #E8E2DA;
          transition: all 0.3s; cursor: default;
          box-shadow: 0 1px 4px rgba(0,0,0,0.03);
        }
        .pulse-use-card:hover {
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
            {['Features', 'How It Works', 'Use Cases'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="pulse-nav-link">{l}</a>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="mailto:pulse@tikkitx.com" className="pulse-btn-primary pulse-hide-mobile" style={{ padding: '11px 24px', fontSize: 13 }}>Start Hosting</a>
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{ background: 'none', border: 'none', color: '#7A7A7A', cursor: 'pointer', padding: 8 }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div style={{ background: '#FAF8F5', borderTop: '1px solid #E8E2DA', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['Features', 'How It Works', 'Use Cases'].map(l => (
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
        {/* Animated orbs */}
        <div style={{ position: 'absolute', top: '8%', right: '12%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,143,113,0.18) 0%, transparent 65%)', animation: 'pulseOrb 9s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(194,120,92,0.13) 0%, transparent 65%)', animation: 'pulseOrb 12s ease-in-out 3s infinite', pointerEvents: 'none' }} />
        {/* Dot texture */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, #6B8F71 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', display: 'flex', alignItems: 'center', gap: 64, width: '100%' }}>
          {/* Left */}
          <div style={{ flex: 1, animation: 'pulseFadeUp 0.7s ease both' }}>
            <div className="pulse-label">
              <Leaf size={11} /> For Hosts Who Lead with Intention
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 300, lineHeight: 1.05,
              fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', color: '#2D2D2D',
              letterSpacing: '-0.03em', marginBottom: 28,
            }}>
              Experiences<br />
              <span style={{ color: '#6B8F71', fontWeight: 700 }}>Worth Showing<br />Up For</span>
            </h1>
            <p style={{ fontSize: 18, color: '#7A7A7A', lineHeight: 1.8, marginBottom: 40, maxWidth: 460 }}>
              Your retreat shouldn&apos;t run on Instagram DMs and spreadsheet tabs. You built something worth showing up for — the admin should match.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="mailto:pulse@tikkitx.com" className="pulse-btn-primary" style={{ fontSize: 15, padding: '16px 36px' }}>
                Start Hosting <ArrowRight size={17} />
              </a>
              <a href="#features" className="pulse-btn-ghost" style={{ fontSize: 15, padding: '16px 32px' }}>
                See What's Possible
              </a>
            </div>
            {/* Trust chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 36 }}>
              {['Registration That Disappears', 'Works in the Mountains', 'Attendance That\'s Real', 'Built for Creators'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7A7A7A', padding: '5px 12px', borderRadius: 100, background: '#fff', border: '1px solid #E8E2DA', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <CheckCircle size={11} color="#6B8F71" /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating cards */}
          <div className="pulse-hero-cards" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, animation: 'pulseFadeUp 0.7s ease 0.25s both' }}>
            {heroCards.map((card, i) => <HeroCard key={card.title} card={card} delay={i * 1.0} />)}
            {/* Mini receipt card */}
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
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 14 }}>Sat 5 Apr · 7:00 PM</p>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', background: '#FAF8F5', borderRadius: 10, border: '1px solid #E8E2DA' }}>
                <QrCode size={40} color="#6B8F71" opacity={0.7} />
              </div>
              <p style={{ fontSize: 10, color: '#C5D9C8', textAlign: 'center', marginTop: 8 }}>Verified · Scan at entry</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE MARQUEE ── */}
      <div style={{ background: '#EDF2EE', borderTop: '1px solid #C5D9C8', borderBottom: '1px solid #C5D9C8', padding: '16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ padding: '0 32px', fontSize: 11, fontWeight: 700, color: '#6B8F71', letterSpacing: '0.1em', textTransform: 'uppercase' as const, flexShrink: 0, whiteSpace: 'nowrap' as const }}>
            Experiences
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
          <StatItem target={300}  suffix="+"   label="Experiences hosted" />
          <StatItem target={8000} suffix="+"   label="Participants registered" />
          <StatItem target={4}    suffix=".9★" label="Average host rating" />
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ padding: '80px 24px', background: '#F5F0EB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 300, color: '#2D2D2D', letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.2 }}>
              You Create Transformative Experiences.<br />
              <span style={{ color: '#6B8F71', fontWeight: 700 }}>Your Tools Should Keep Up.</span>
            </h2>
            <p style={{ fontSize: 17, color: '#7A7A7A', maxWidth: 480, margin: '0 auto', lineHeight: 1.8 }}>
              The admin burden of running a retreat shouldn't outweigh the joy of hosting one.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { icon: CalendarDays, title: 'Scattered Signups',     body: "Managing registrations across Instagram DMs, WhatsApp, and Google Forms. No unified view of who's coming." },
              { icon: Award,        title: 'No Proof of Attendance',body: 'Participants complete a 3-day retreat and leave with nothing to show for it. No verified record, no credential.' },
              { icon: BarChart2,    title: 'Admin Overload',        body: 'You became a retreat host to change lives, not to spend evenings reconciling payment screenshots.' },
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
              Tools That Let You Focus on the Experience
            </h2>
            <p style={{ fontSize: 17, color: '#7A7A7A', maxWidth: 460, margin: '0 auto', lineHeight: 1.8 }}>Everything you need to run a seamless experience — nothing you don't.</p>
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
              Hosting Made Human
            </h2>
            <p style={{ fontSize: 16, color: '#7A7A7A', marginTop: 14, maxWidth: 400, margin: '14px auto 0', lineHeight: 1.8 }}>
              Simple enough for a solo facilitator. Powerful enough for a multi-day retreat.
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

      {/* ── USE CASES ── */}
      <section id="use-cases" style={{ padding: '96px 24px', background: '#F5F0EB', borderTop: '1px solid #E8E2DA' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 300, color: '#2D2D2D', letterSpacing: '-0.02em' }}>
              For Every Kind of Experience
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {useCases.map(({ icon: Icon, title, desc }) => {
              const { ref, inView } = useInView()
              return (
                <div key={title} ref={ref} className="pulse-use-card" style={{
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
              Hosts Who've Made the Switch
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {testimonials.map((t, i) => <TestimonialCard key={t.name} t={t} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY ── */}
      <section style={{ padding: '80px 24px 96px', background: '#EDF2EE', borderTop: '1px solid #C5D9C8', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="pulse-label" style={{ margin: '0 auto 24px' }}><Heart size={11} /> Built for the Experience Economy</div>
          <p style={{ fontSize: 18, color: '#5A5A5A', lineHeight: 1.9 }}>
            TIKKIT X Pulse is for the people who believe that real learning happens in person. That the best connections are made face to face. That showing up matters. We're building the infrastructure to make those experiences easier to create, easier to manage, and easier to grow.
          </p>
          <div style={{ margin: '40px auto 0', width: 48, height: 2, background: 'linear-gradient(90deg, transparent, #6B8F71, transparent)' }} />
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '96px 24px', background: 'linear-gradient(160deg, #6B8F71 0%, #5a7d60 100%)', position: 'relative', overflow: 'hidden' }}>
        {/* Shimmer */}
        <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '60%', height: '200%', background: 'rgba(255,255,255,0.06)', transform: 'rotate(20deg)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 300, color: '#fff', letterSpacing: '-0.025em', marginBottom: 20 }}>
            Your Next Experience Starts Here
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', marginBottom: 44, lineHeight: 1.8 }}>
            Join retreat hosts and workshop creators who've moved beyond DMs and spreadsheets.
          </p>
          <a href="mailto:pulse@tikkitx.com" className="pulse-btn-primary" style={{ fontSize: 16, padding: '18px 44px', background: '#C2785C', boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>
            Start Hosting on Pulse <ChevronRight size={18} />
          </a>
          <p style={{ marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            Questions?{' '}
            <a href="mailto:pulse@tikkitx.com" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'underline' }}>pulse@tikkitx.com</a>
          </p>
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
