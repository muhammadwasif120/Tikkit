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
  { icon: Users,        color: '#4A90D9', glow: 'rgba(74,144,217,0.3)',  title: 'Invitations That Mean It',      desc: 'Invite-only, open, or approval-based. From board dinners to 500-person town halls — every guest list managed with precision.' },
  { icon: QrCode,       color: '#64B5F6', glow: 'rgba(100,181,246,0.3)', title: 'Check-In Without the Clipboard', desc: 'Cryptographic QR codes that work offline. Know exactly who arrived and when. No paper, no guessing, no gatecrashers.' },
  { icon: BarChart2,    color: '#4A90D9', glow: 'rgba(74,144,217,0.3)',  title: 'The Room, Live',                desc: 'Attendance velocity, capacity, demographic breakdowns — updating in real time as your event runs. Your team always knows the score.' },
  { icon: Briefcase,    color: '#64B5F6', glow: 'rgba(100,181,246,0.3)', title: 'Every Vendor. One Dashboard.',  desc: 'Photographers, AV, catering, security. Invoices, payments, performance — tracked centrally. No missed calls, no lost receipts.' },
  { icon: ShieldCheck,  color: '#4A90D9', glow: 'rgba(74,144,217,0.3)',  title: 'Only the Right People Get In',  desc: 'CNIC-verified guest lists for high-stakes functions. Gatecrashers are not a possibility when identity is verified at registration.' },
  { icon: FileText,     color: '#64B5F6', glow: 'rgba(100,181,246,0.3)', title: 'The Report That Writes Itself', desc: 'Attendance, dwell time, vendor scores, financials — one click, PDF ready for leadership the same night.' },
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
  { icon: CalendarDays, title: 'Annual Dinners & Galas',       desc: 'Tiered seating, VIP access tiers, full vendor coordination. The night that defines the year — done properly.' },
  { icon: Building2,    title: 'Team Retreats & Offsites',     desc: 'Multi-day scheduling, activity sign-ups, headcount tracking. Everyone accounted for, every step of the way.' },
  { icon: Users,        title: 'Conferences & Seminars',       desc: 'Session registration, speaker management, verified CPD records. Serious events run on serious infrastructure.' },
  { icon: Briefcase,    title: 'Product Launches & Roadshows', desc: 'Approval-only access, branded invitations, post-launch analytics. Make the launch match the product.' },
]

const steps = [
  { n: '01', title: 'Build the event',         desc: 'Registration type, capacity, tiers, vendors. Two minutes from blank screen to live event.' },
  { n: '02', title: 'Send the invitations',    desc: 'One link. Guests register and receive their verified QR ticket. Works for 20 or 2,000.' },
  { n: '03', title: 'Run it. Then review it.', desc: 'One scan per guest. Monitor live. Export the analytics report for leadership the same night.' },
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
          background: #0F1724 !important;
          color: #CBD5E1 !important;
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
              Corporate Events.<br />
              <span style={{ color: '#4A90D9' }}>Executed</span><br />
              Flawlessly.
            </h1>
            <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.75, marginBottom: 40, maxWidth: 480 }}>
              Town halls. Leadership galas. Annual conferences. When the room matters, the details can&apos;t slip. One platform that makes sure they don&apos;t.
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
              Your Events Represent the Organisation.<br />Your Tools Should Too.
            </h2>
            <p style={{ fontSize: 17, color: '#64748B', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              The board dinner is flawless on the night. The chaos that got it there shouldn&apos;t exist.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { icon: FileText,  title: 'Guest Lists Built in Threads',       body: 'RSVPs scattered across email and WhatsApp. No master list. No way to know who\'s confirmed, who\'s a maybe, or who just walked in.' },
              { icon: BarChart2, title: 'The Event Ends. The Data Doesn\'t Exist.', body: 'You ran a 400-person gala. Leadership asks for the report. You have a signup sheet and a vague feeling.' },
              { icon: Users,     title: 'Vendors on WhatsApp. Bills in the Inbox.', body: 'Photographers, catering, AV — all coordinated through scattered messages. No paper trail. No accountability.' },
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
              One Platform. From Invite to Export.
            </h2>
            <p style={{ fontSize: 17, color: '#64748B', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              From the first guest invite to the post-event leadership report — everything runs in one place.
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
              From Brief to Report. In Three Steps.
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
              Your IT Team Already Has Questions.<br />Here Are the Answers.
            </h2>
            <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.7 }}>
              We built this knowing your security team would push back. Every answer is already in the platform.
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
              Whatever the Brief, We&apos;ve Handled It.
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

      {/* ── GEO SECTION ── */}
      <section style={{ padding: '96px 24px', background: '#0F1724', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="corp-section-label"><Globe size={11} /> Corporate Events Across Pakistan</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
              Wherever the Brief Takes You.
            </h2>
            <p style={{ fontSize: 17, color: '#64748B', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Tikkit is built for Pakistan's corporate event circuit — from Karachi boardrooms to Islamabad summits to Lahore galas.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {[
              {
                city: 'Lahore',
                desc: 'DHA, Gulberg, and Johar Town host Pakistan\'s most active corporate event calendar. Annual dinners at five-star ballrooms, tech summits in co-working hubs, and product launches for the country\'s largest consumer brands. Tikkit manages the full guest experience — from digital invitation to post-event report.',
                tags: ['Annual Dinners', 'Tech Summits', 'Product Launches'],
              },
              {
                city: 'Karachi',
                desc: 'Pakistan\'s business capital runs the country\'s largest events. Expo Centre conferences, Clifton gala dinners, PECHS board retreats. Karachi\'s corporate events demand production quality and airtight guest management. Tikkit delivers both — at any scale, with verified check-in and real-time analytics.',
                tags: ['Conferences', 'Corporate Galas', 'Financial Sector Events'],
              },
              {
                city: 'Islamabad',
                desc: 'Government agencies, multinationals, UN bodies, and embassies run Islamabad\'s event calendar. Protocol-aware, security-conscious, and formal. Verified guest lists are a professional expectation, not optional. Tikkit\'s CNIC-verified registration and offline check-in are built for exactly this environment.',
                tags: ['Government Events', 'Diplomatic Functions', 'NGO Conferences'],
              },
            ].map(({ city, desc, tags }) => (
              <div key={city} style={{
                background: '#1A2332',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: '32px 28px',
              }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 14 }}>{city}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.75, marginBottom: 20 }}>{desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100,
                      background: 'rgba(74,144,217,0.1)', color: '#4A90D9',
                      border: '1px solid rgba(74,144,217,0.2)',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 24px', background: '#1A2332', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Frequently Asked Questions
            </h2>
          </div>
          {[
            {
              q: 'How do I manage a guest list for a large corporate event in Pakistan?',
              a: 'Use Tikkit\'s digital registration system — every guest gets a unique QR code, your team scans at the door, and the dashboard updates in real time. No spreadsheets, no printed lists. The full attendance record exports automatically after the event.',
            },
            {
              q: 'Can Tikkit handle offline check-in at venues without WiFi?',
              a: 'Yes. Download the guest list before the event and scan QR codes completely offline. All data syncs when connectivity returns — essential for Islamabad venues, farmhouses, and large hotel ballrooms with unreliable internet.',
            },
            {
              q: 'How do I generate a post-event report for leadership?',
              a: 'Tikkit generates your report automatically. After the event, click Reports in your dashboard. Download attendance data, check-in rate, no-shows, and ticket breakdown as PDF or CSV — ready within minutes of the event ending.',
            },
            {
              q: 'Does Tikkit support CNIC verification for high-security events?',
              a: 'Yes. Verified organisers on Tikkit have completed CNIC identity confirmation. For events requiring verified guest lists — board dinners, government functions, diplomatic events — this creates an accountable, secure guest management environment.',
            },
            {
              q: 'What ticket tiers can I set up for a corporate event?',
              a: 'Unlimited tiers — General Admission, VIP, Press, Speaker, Staff, Early Bird, and any custom tier you need. Each tier has its own capacity, price (including free), and check-in flow. VIP guests can be directed to a separate entrance automatically.',
            },
          ].map(({ q, a }, i) => (
            <details key={i} style={{
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              padding: '20px 0',
            }}>
              <summary style={{
                fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer',
                listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                {q}
                <ChevronRight size={18} color="#4A90D9" style={{ flexShrink: 0, marginLeft: 16 }} />
              </summary>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.75, marginTop: 14 }}>{a}</p>
            </details>
          ))}
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
            Your Next Event Should Be the Best One Yet.
          </h2>
          <p style={{ fontSize: 18, color: '#64748B', marginBottom: 40, lineHeight: 1.7 }}>
            Corporate teams across Pakistan are running events on Tikkit. Time to see what a proper platform feels like.
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
