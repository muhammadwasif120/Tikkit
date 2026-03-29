'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ShieldCheck, BarChart2, QrCode, Users, Briefcase, FileText,
  CheckCircle, Building2, CalendarDays, Globe, Lock, Database,
  ChevronRight, ArrowRight, Menu, X, Zap, TrendingUp, Clock,
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
  { icon: Users,        color: '#4A90D9', glow: 'rgba(74,144,217,0.3)',  title: 'Smart Invitations',       desc: 'Invite-only, open registration, or approval-based. Manage every guest list with precision — from board dinners to town halls.' },
  { icon: QrCode,       color: '#64B5F6', glow: 'rgba(100,181,246,0.3)', title: 'QR Verified Check-In',    desc: 'Cryptographically signed QR codes that work without WiFi. Know exactly who arrived and when. No paper lists, ever.' },
  { icon: BarChart2,    color: '#4A90D9', glow: 'rgba(74,144,217,0.3)',  title: 'Live Analytics Dashboard',desc: 'Attendance velocity, capacity monitoring, demographic breakdowns — all updating in real time while your event runs.' },
  { icon: Briefcase,    color: '#64B5F6', glow: 'rgba(100,181,246,0.3)', title: 'Vendor Coordination',     desc: 'Book photographers, AV, catering, and security through one platform. Invoices, payments, and performance tracked centrally.' },
  { icon: ShieldCheck,  color: '#4A90D9', glow: 'rgba(74,144,217,0.3)',  title: 'Identity Verification',   desc: 'CNIC-verified guest lists ensure only authorised attendees enter. Eliminate gatecrashers at high-stakes corporate functions.' },
  { icon: FileText,     color: '#64B5F6', glow: 'rgba(100,181,246,0.3)', title: 'Post-Event Reports',      desc: 'Attendance summaries, dwell time, vendor reviews, and financials — exported in one click for your leadership team.' },
]

const securityPoints = [
  { icon: Database,    text: 'Row Level Security on every database table' },
  { icon: QrCode,      text: 'Cryptographic QR — no data transmitted during check-in' },
  { icon: ShieldCheck, text: 'CNIC identity verification to prevent impersonation' },
  { icon: Lock,        text: 'Immutable audit logs with cryptographic chaining' },
  { icon: Globe,       text: 'Data encrypted in transit (TLS) and at rest (AES-256)' },
  { icon: CheckCircle, text: 'Hosted on SOC 2 compliant Vercel + Supabase infrastructure' },
]

const useCases = [
  { icon: CalendarDays, title: 'Annual Dinners & Galas',       desc: 'Tiered seating, VIP management, and full vendor coordination for flagship events.' },
  { icon: Building2,    title: 'Team Retreats & Offsites',     desc: 'Multi-day scheduling, activity sign-ups, and headcount tracking in one dashboard.' },
  { icon: Users,        title: 'Conferences & Seminars',       desc: 'Speaker management, session registration, and verified CPD attendance certificates.' },
  { icon: Briefcase,    title: 'Product Launches & Roadshows', desc: 'Branded invitations, approval-based access, and post-event engagement analytics.' },
]

const steps = [
  { n: '01', title: 'Create your event',   desc: 'Set registration mode, capacity, ticket tiers, and add vendors. Two minutes from blank to published.' },
  { n: '02', title: 'Invite your guests',  desc: 'Share your event link. Guests register and receive cryptographically verified QR tickets.' },
  { n: '03', title: 'Run and analyse',     desc: 'Check in guests with one scan. Monitor live. Export detailed analytics for leadership after.' },
]

const companyTypes = [
  'Banking & Finance', 'Telecom', 'FMCG', 'Law Firms', 'NGOs', 'Media Houses',
  'Tech Companies', 'Real Estate', 'Pharma', 'Consulting', 'Government', 'Retail',
]

const heroCards = [
  { label: 'LIVE', title: 'Board Summit 2026', sub: 'Avari Towers, Karachi', checkins: 98,  total: 120, color: '#4A90D9' },
  { label: 'OPEN', title: 'Annual Leadership Gala', sub: 'PC Hotel, Lahore',   checkins: 214, total: 350, color: '#64B5F6' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatItem({ target, suffix, label, prefix = '' }: { target: number; suffix: string; label: string; prefix?: string }) {
  const { ref, inView } = useInView(0.3)
  const count = useCountUp(target, inView)
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {prefix}{count}{suffix}
      </div>
      <p style={{ color: '#64748B', fontSize: 14, marginTop: 8, fontWeight: 500 }}>{label}</p>
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
        background: hovered ? 'rgba(74,144,217,0.06)' : '#1A2332',
        border: `1px solid ${hovered ? 'rgba(74,144,217,0.35)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 16,
        padding: '28px 24px',
        cursor: 'default',
        transition: 'all 0.3s ease',
        boxShadow: hovered ? `0 0 32px ${feature.glow}` : 'none',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${index * 0.07}s`,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `rgba(${feature.color === '#4A90D9' ? '74,144,217' : '100,181,246'},0.12)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        boxShadow: hovered ? `0 0 20px ${feature.glow}` : 'none',
        transition: 'box-shadow 0.3s ease',
      }}>
        <Icon size={22} color={feature.color} />
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{feature.title}</h3>
      <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{feature.desc}</p>
    </div>
  )
}

function HeroCard({ card, delay }: { card: typeof heroCards[0]; delay: number }) {
  const pct = Math.round((card.checkins / card.total) * 100)
  return (
    <div style={{
      background: 'rgba(26,35,50,0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '20px 22px',
      animation: `corpFloat ${3 + delay}s ease-in-out ${delay}s infinite alternate`,
      minWidth: 260,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: card.color, boxShadow: `0 0 8px ${card.color}`, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: card.color, letterSpacing: '0.1em' }}>{card.label}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{card.title}</p>
      <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>{card.sub}</p>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>Check-ins</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: card.color }}>{card.checkins} / {card.total}</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${card.color}, #64B5F6)`, borderRadius: 2, transition: 'width 1.5s ease' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 11, color: '#475569' }}>QR verified</span>
        <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>{pct}% capacity</span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CorporatePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const statsSection = useInView(0.2)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const marqueeItems = [...companyTypes, ...companyTypes]

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        body {
          background: #0F1724;
          color: #CBD5E1;
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        :root {
          --corp-bg: #0F1724;
          --corp-surface: #1A2332;
          --corp-surface-2: #243447;
          --corp-blue: #4A90D9;
          --corp-blue-light: #64B5F6;
          --corp-border: rgba(255,255,255,0.07);
          --corp-text: #E2E8F0;
          --corp-muted: #64748B;
        }

        @keyframes corpFloat {
          from { transform: translateY(0px); }
          to   { transform: translateY(-12px); }
        }

        @keyframes corpMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @keyframes corpFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes corpGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(74,144,217,0.2); }
          50%       { box-shadow: 0 0 40px rgba(74,144,217,0.45); }
        }

        @keyframes corpPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }

        @keyframes corpGridShift {
          0%   { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }

        .corp-nav-link {
          font-size: 14px; font-weight: 500; color: #94A3B8;
          text-decoration: none; transition: color 0.2s; cursor: pointer;
        }
        .corp-nav-link:hover { color: #fff; }

        .corp-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 10px; font-weight: 700;
          font-size: 14px; cursor: pointer; text-decoration: none;
          background: #4A90D9; color: #fff; border: none;
          transition: all 0.2s; font-family: var(--font-body);
        }
        .corp-btn-primary:hover { background: #3A7BC8; box-shadow: 0 0 24px rgba(74,144,217,0.4); transform: translateY(-1px); }

        .corp-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 10px; font-weight: 600;
          font-size: 14px; cursor: pointer; text-decoration: none;
          background: rgba(255,255,255,0.05); color: #CBD5E1;
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.2s; font-family: var(--font-body);
        }
        .corp-btn-ghost:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.2); }

        .corp-section-label {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 800; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--corp-blue);
          padding: 6px 14px; border-radius: 100px;
          background: rgba(74,144,217,0.1); border: 1px solid rgba(74,144,217,0.25);
          margin-bottom: 20px;
        }

        .corp-step-card {
          padding: 32px; border-radius: 16px;
          background: #1A2332; border: 1px solid rgba(255,255,255,0.07);
          position: relative; overflow: hidden;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .corp-step-card:hover {
          border-color: rgba(74,144,217,0.3);
          box-shadow: 0 0 32px rgba(74,144,217,0.08);
        }

        .corp-use-card {
          padding: 28px; border-radius: 14px;
          background: #1A2332; border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.3s; cursor: default;
        }
        .corp-use-card:hover {
          border-color: rgba(74,144,217,0.3);
          background: rgba(74,144,217,0.04);
          transform: translateY(-2px);
        }

        .corp-security-badge {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 18px 20px; border-radius: 12px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.25s;
        }
        .corp-security-badge:hover {
          background: rgba(74,144,217,0.06); border-color: rgba(74,144,217,0.25);
        }

        .corp-marquee-wrap {
          overflow: hidden; position: relative;
          mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
        }
        .corp-marquee-track {
          display: flex; gap: 0;
          animation: corpMarquee 28s linear infinite;
          width: max-content;
        }

        .corp-grid-bg {
          background-image: linear-gradient(rgba(74,144,217,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(74,144,217,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        @media (max-width: 768px) {
          .corp-hide-mobile { display: none !important; }
          .corp-hero-cards  { display: none !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'background 0.3s, border-color 0.3s',
        background: scrolled ? 'rgba(15,23,36,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TikkitXLogo size="sm" />
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'rgba(74,144,217,0.15)', color: '#4A90D9', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Corporate</span>
          </div>
          <nav className="corp-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {['Features', 'How It Works', 'Security', 'Use Cases'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="corp-nav-link">{l}</a>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="mailto:corporate@tikkitx.com" className="corp-btn-primary corp-hide-mobile">Book a Demo <ChevronRight size={16} /></a>
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 8, display: 'none' }}
              className="corp-show-mobile"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div style={{ background: '#1A2332', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['Features', 'How It Works', 'Security', 'Use Cases'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="corp-nav-link" onClick={() => setMenuOpen(false)}>{l}</a>
            ))}
            <a href="mailto:corporate@tikkitx.com" className="corp-btn-primary" style={{ justifyContent: 'center' }}>Book a Demo</a>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="corp-grid-bg" style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden', paddingTop: 68,
      }}>
        {/* Gradient orbs */}
        <div style={{ position: 'absolute', top: '15%', left: '55%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,144,217,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,181,246,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', display: 'flex', alignItems: 'center', gap: 60, width: '100%' }}>
          {/* Left */}
          <div style={{ flex: 1, animation: 'corpFadeUp 0.7s ease both' }}>
            <div className="corp-section-label">
              <Zap size={11} />
              Enterprise Event Management
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.08,
              fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', color: '#fff',
              letterSpacing: '-0.025em', marginBottom: 24,
            }}>
              Corporate Events,<br />
              <span style={{ color: '#4A90D9' }}>Managed</span><br />
              Intelligently.
            </h1>
            <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.75, marginBottom: 40, maxWidth: 480 }}>
              From team retreats to annual conferences — verified check-in, live analytics, and enterprise-grade security. One platform for the events that matter.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="mailto:corporate@tikkitx.com" className="corp-btn-primary" style={{ fontSize: 15, padding: '15px 32px' }}>
                Book a Demo <ArrowRight size={17} />
              </a>
              <a href="#features" className="corp-btn-ghost" style={{ fontSize: 15, padding: '15px 32px' }}>
                See Features
              </a>
            </div>
            {/* Trust chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 36 }}>
              {['Verified Check-In', 'Offline QR', 'Real-Time Analytics', 'SOC 2 Infrastructure'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', padding: '5px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <CheckCircle size={11} color="#22C55E" /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating cards */}
          <div className="corp-hero-cards" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, animation: 'corpFadeUp 0.7s ease 0.2s both' }}>
            {heroCards.map((card, i) => <HeroCard key={card.title} card={card} delay={i * 0.8} />)}
            {/* Mini analytics card */}
            <div style={{
              background: 'rgba(26,35,50,0.9)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 22px',
              animation: 'corpFloat 4.2s ease-in-out 1.6s infinite alternate',
            }}>
              <p style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>Attendance Rate</p>
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 40 }}>
                {[55, 72, 64, 88, 95, 82, 98].map((h, i) => (
                  <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', background: `rgba(74,144,217,${0.3 + (h / 100) * 0.7})`, height: `${h}%`, transition: 'height 1s ease' }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: 11, color: '#64748B' }}>Last 7 events</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#22C55E' }}>↑ 98%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPANY MARQUEE ── */}
      <div style={{ background: '#1A2332', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '18px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 0 }}>
          <div style={{ padding: '0 32px', fontSize: 11, fontWeight: 700, color: '#4A90D9', letterSpacing: '0.1em', textTransform: 'uppercase' as const, flexShrink: 0, whiteSpace: 'nowrap' as const }}>
            Trusted by
          </div>
          <div className="corp-marquee-wrap" style={{ flex: 1, overflow: 'hidden' }}>
            <div className="corp-marquee-track">
              {marqueeItems.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0 32px', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' as const }}>{t}</span>
                  <span style={{ marginLeft: 32, width: 4, height: 4, borderRadius: '50%', background: '#4A90D9', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <section ref={statsSection.ref} style={{ padding: '80px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
          <StatItem target={500}  suffix="+"    label="Corporate events managed" />
          <StatItem target={99}   suffix=".2%"  label="Check-in accuracy rate" />
          <StatItem target={40}   suffix="+"    label="Enterprise clients" />
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
              Corporate Events Deserve Better<br />Than Spreadsheets
            </h2>
            <p style={{ fontSize: 17, color: '#64748B', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              The way most organisations manage events hasn't changed in decades. That ends here.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { icon: FileText,  title: 'Manual Guest Lists',   body: 'RSVPs across email threads and WhatsApp groups. No single source of truth. No way to verify who actually showed up.' },
              { icon: BarChart2, title: 'No Check-In Data',     body: 'Events end with no record of who attended, when they arrived, or how long they stayed. Leadership asks — you guess.' },
              { icon: Users,     title: 'Vendor Chaos',         body: 'Coordinating photographers, caterers, and AV through scattered messages. No accountability, no audit trail.' },
            ].map(({ icon: Icon, title, body }) => {
              const { ref, inView } = useInView()
              return (
                <div key={title} ref={ref} style={{
                  padding: '28px 24px', borderRadius: 16, background: '#1A2332',
                  border: '1px solid rgba(255,255,255,0.07)',
                  opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(74,144,217,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Icon size={20} color="#4A90D9" />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: '#1A2332', padding: '96px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="corp-section-label"><TrendingUp size={11} /> Platform Features</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
              Everything Your Events Team Needs
            </h2>
            <p style={{ fontSize: 17, color: '#64748B', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              One platform covering every stage of your corporate event lifecycle.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {features.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="corp-section-label"><Clock size={11} /> Process</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
              Three Steps to a Smarter Event
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, position: 'relative' }}>
            {steps.map((step, i) => {
              const { ref, inView } = useInView()
              return (
                <div key={step.n} ref={ref} className="corp-step-card" style={{
                  opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)',
                  transition: `opacity 0.55s ease ${i * 0.12}s, transform 0.55s ease ${i * 0.12}s`,
                }}>
                  {/* Step number */}
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900, color: 'rgba(74,144,217,0.15)', lineHeight: 1, marginBottom: 16, letterSpacing: '-0.04em' }}>{step.n}</div>
                  {/* Glow line */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, #4A90D9, transparent)`, borderRadius: '16px 16px 0 0', opacity: 0.6 }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section id="security" style={{ background: '#0B1220', padding: '96px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="corp-section-label"><ShieldCheck size={11} /> Enterprise Security</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
              Built for Your Security Team
            </h2>
            <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.7 }}>
              Your employee data deserves the same rigour as your core business systems.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12 }}>
            {securityPoints.map(({ icon: Icon, text }) => {
              const { ref, inView } = useInView()
              return (
                <div key={text} ref={ref} className="corp-security-badge" style={{
                  opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(16px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Icon size={16} color="#22C55E" />
                  </div>
                  <span style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>{text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section id="use-cases" style={{ background: '#1A2332', padding: '96px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 14 }}>
              Built for Every Corporate Event
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {useCases.map(({ icon: Icon, title, desc }) => {
              const { ref, inView } = useInView()
              return (
                <div key={title} ref={ref} className="corp-use-card" style={{
                  opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#0F1724', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, border: '1px solid rgba(74,144,217,0.2)' }}>
                    <Icon size={22} color="#4A90D9" />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 8 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.65 }}>{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(74,144,217,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div className="corp-section-label" style={{ margin: '0 auto 24px' }}>
            <Zap size={11} /> Get Started
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4.5vw,3.2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', marginBottom: 20 }}>
            Ready to Upgrade Your Corporate Events?
          </h2>
          <p style={{ fontSize: 18, color: '#64748B', marginBottom: 40, lineHeight: 1.7 }}>
            Join organisations that have moved beyond spreadsheets and WhatsApp groups.
          </p>
          <a href="mailto:corporate@tikkitx.com" className="corp-btn-primary" style={{ fontSize: 16, padding: '17px 40px', animation: 'corpGlow 3s ease infinite' }}>
            Book a Demo <ArrowRight size={18} />
          </a>
          <p style={{ marginTop: 20, fontSize: 14, color: '#475569' }}>
            Or email us at{' '}
            <a href="mailto:corporate@tikkitx.com" style={{ color: '#4A90D9', textDecoration: 'none' }}>corporate@tikkitx.com</a>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0B1220', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TikkitXLogo size="sm" />
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'rgba(74,144,217,0.15)', color: '#4A90D9', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Corporate</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {[['Terms & Conditions', '/terms'], ['Privacy Policy', '/privacy'], ['Contact', 'mailto:corporate@tikkitx.com']].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: 13, color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#94A3B8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
              >{label}</a>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#334155' }}>A product of <span style={{ color: '#475569', fontWeight: 600 }}>Two Bit Digital</span></p>
        </div>
      </footer>
    </>
  )
}
