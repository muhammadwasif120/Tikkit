'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Ticket, QrCode, Users, CreditCard, BarChart3,
  Building2, CheckCircle, ArrowRight, Zap, Shield,
  Star, ChevronDown, ScanLine, Bell, ClipboardCheck,
  Menu, X,
} from 'lucide-react'

// ─── Helpers ───────────────────────────────────────────────────────────────

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

// ─── Data ───────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Users,
    color: '#1E5EFF',
    glow: 'rgba(30,94,255,0.3)',
    title: 'Guest List Management',
    desc: 'Add guests manually or let them self-register. Track RSVPs, gender ratios, waitlists and approvals — all in one place.',
  },
  {
    icon: QrCode,
    color: '#A855F7',
    glow: 'rgba(168,85,247,0.3)',
    title: 'QR Check-In',
    desc: 'Every guest gets a unique QR code. Scan at the door for instant entry — no paper lists, no confusion, no drama.',
  },
  {
    icon: CreditCard,
    color: '#22C55E',
    glow: 'rgba(34,197,94,0.3)',
    title: 'Upfront Payment Collection',
    desc: 'Collect ticket payments via JazzCash, EasyPaisa, or bank transfer before the event. Screenshot verification with one-tap approval.',
  },
  {
    icon: ClipboardCheck,
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.3)',
    title: 'Smart Approvals',
    desc: 'Run expression-of-interest events — guests request a spot, you approve or decline. Full control over who walks through the door.',
  },
  {
    icon: Building2,
    color: '#EC4899',
    glow: 'rgba(236,72,153,0.3)',
    title: 'Vendor Payments',
    desc: 'Track every vendor, invoice, and payment in one dashboard. Know exactly where your event budget is going, always.',
  },
  {
    icon: Bell,
    color: '#06B6D4',
    glow: 'rgba(6,182,212,0.3)',
    title: 'Realtime Notifications',
    desc: 'Get notified the moment a guest signs up, checks in, or cancels. Stay on top of your event without refreshing a page.',
  },
  {
    icon: Shield,
    color: '#8B5CF6',
    glow: 'rgba(139,92,246,0.3)',
    title: 'Team Access Control',
    desc: 'Invite staff with a shareable link. They get scanner access only — your data stays yours. Organizer links give full dashboard access.',
  },
  {
    icon: BarChart3,
    color: '#F97316',
    glow: 'rgba(249,115,22,0.3)',
    title: 'Analytics & Insights',
    desc: 'Attendance rates, revenue breakdown, check-in timelines. Every number you need to run a better event next time.',
  },
]

const eventTypes = [
  { label: 'Private Parties', emoji: '🎉' },
  { label: 'Corporate Events', emoji: '🏢' },
  { label: 'Concerts', emoji: '🎵' },
  { label: 'Weddings', emoji: '💍' },
  { label: 'Brand Activations', emoji: '⚡' },
  { label: 'Rooftop Nights', emoji: '🌙' },
  { label: 'Art Shows', emoji: '🎨' },
  { label: 'Networking Events', emoji: '🤝' },
]

const steps = [
  { n: '01', title: 'Create your event', desc: 'Set the date, venue, capacity, ticket price, and registration mode. Takes 2 minutes.' },
  { n: '02', title: 'Share the link', desc: 'One link for guests to register. Collect payments upfront or approve applications manually.' },
  { n: '03', title: 'Scan at the door', desc: 'Your team scans QR codes on their phones. Real-time check-in, zero chaos.' },
  { n: '04', title: 'Review & repeat', desc: 'See who came, what you earned, how it went. Then do it better next time.' },
]

// ─── Components ─────────────────────────────────────────────────────────────

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const { ref, inView } = useInView()
  const Icon = feature.icon
  return (
    <div
      ref={ref}
      className="feature-card"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.6s ease ${index * 0.08}s, transform 0.6s ease ${index * 0.08}s`,
      }}
    >
      <div className="feature-icon" style={{ background: `${feature.glow}`, boxShadow: `0 0 20px ${feature.glow}` }}>
        <Icon className="w-5 h-5" style={{ color: feature.color }} />
      </div>
      <h3 className="feature-title">{feature.title}</h3>
      <p className="feature-desc">{feature.desc}</p>
    </div>
  )
}

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className="step-card"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 0.12}s, transform 0.5s ease ${index * 0.12}s`,
      }}
    >
      <span className="step-number">{step.n}</span>
      <h3 className="step-title">{step.title}</h3>
      <p className="step-desc">{step.desc}</p>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{`
        :root {
          --blue: #1E5EFF;
          --blue-dim: rgba(30,94,255,0.15);
          --blue-glow: rgba(30,94,255,0.4);
          --bg: #0A0C12;
          --surface: #0F1117;
          --card: #13151E;
          --border: rgba(255,255,255,0.07);
          --text: #F0F2FF;
          --muted: #6B7280;
          --subtle: #374151;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Nav ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; height: 64px;
          transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
        }
        .nav.scrolled {
          background: rgba(10,12,18,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px; text-decoration: none;
        }
        .nav-logo-icon {
          width: 32px; height: 32px; background: var(--blue); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .nav-logo-text {
          font-size: 20px; font-weight: 800; color: var(--text);
          font-family: 'Poppins', sans-serif; letter-spacing: -0.5px;
        }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-link {
          font-size: 14px; color: var(--muted); text-decoration: none;
          transition: color 0.2s; font-weight: 500;
        }
        .nav-link:hover { color: var(--text); }
        .nav-actions { display: flex; align-items: center; gap: 10px; }
        .btn-ghost {
          padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;
          color: var(--muted); text-decoration: none; transition: color 0.2s;
        }
        .btn-ghost:hover { color: var(--text); }
        .btn-primary {
          padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;
          background: var(--blue); color: white; text-decoration: none;
          transition: opacity 0.2s, transform 0.2s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary-lg {
          padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700;
          background: var(--blue); color: white; text-decoration: none;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          display: inline-flex; align-items: center; gap: 8px;
          box-shadow: 0 0 40px var(--blue-glow);
        }
        .btn-primary-lg:hover { opacity: 0.92; transform: translateY(-2px); box-shadow: 0 0 60px var(--blue-glow); }
        .btn-outline-lg {
          padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 600;
          border: 1px solid var(--border); color: var(--muted); text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-outline-lg:hover { border-color: rgba(255,255,255,0.2); color: var(--text); }
        .nav-hamburger {
          display: none; background: none; border: none; color: var(--muted);
          cursor: pointer; padding: 4px;
        }

        /* ── Hero ── */
        .hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 120px 24px 80px; text-align: center; position: relative; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0; pointer-events: none; overflow: hidden;
        }
        .hero-glow-1 {
          position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
          width: 800px; height: 600px;
          background: radial-gradient(ellipse, rgba(30,94,255,0.18) 0%, transparent 70%);
        }
        .hero-glow-2 {
          position: absolute; top: 30%; left: 10%;
          width: 400px; height: 400px;
          background: radial-gradient(ellipse, rgba(168,85,247,0.08) 0%, transparent 70%);
        }
        .hero-glow-3 {
          position: absolute; top: 20%; right: 5%;
          width: 400px; height: 400px;
          background: radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 70%);
        }
        /* Animated grid */
        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 100%);
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 100px;
          border: 1px solid rgba(30,94,255,0.3);
          background: rgba(30,94,255,0.08);
          font-size: 12px; font-weight: 600; color: #7BA7FF;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 28px;
          animation: fadeUp 0.8s ease both;
        }
        .hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #1E5EFF;
          box-shadow: 0 0 8px #1E5EFF;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        .hero-heading {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(40px, 7vw, 80px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -2px;
          color: var(--text);
          max-width: 900px;
          animation: fadeUp 0.8s ease 0.1s both;
        }
        .hero-heading .accent {
          background: linear-gradient(135deg, #4F8AFF, #1E5EFF, #7C3AED);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          margin-top: 24px;
          font-size: clamp(16px, 2vw, 20px);
          color: var(--muted); max-width: 580px;
          line-height: 1.7;
          animation: fadeUp 0.8s ease 0.2s both;
        }
        .hero-sub .highlight { color: #9CA3AF; font-weight: 500; }
        .hero-cta {
          display: flex; gap: 12px; margin-top: 40px; flex-wrap: wrap; justify-content: center;
          animation: fadeUp 0.8s ease 0.3s both;
        }
        .hero-scroll {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          margin-top: 80px; color: var(--subtle); font-size: 12px;
          animation: fadeUp 0.8s ease 0.5s both;
        }
        .hero-scroll-line {
          width: 1px; height: 40px;
          background: linear-gradient(transparent, var(--subtle));
          animation: scrollLine 2s ease infinite;
        }
        @keyframes scrollLine {
          0%, 100% { transform: scaleY(0.4) translateY(-20px); opacity: 0.3; }
          50% { transform: scaleY(1) translateY(0); opacity: 1; }
        }

        /* ── Event types ticker ── */
        .ticker-section {
          padding: 40px 0; overflow: hidden;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: linear-gradient(to right, var(--bg) 0%, transparent 10%, transparent 90%, var(--bg) 100%);
          position: relative;
        }
        .ticker-track {
          display: flex; gap: 12px;
          animation: ticker 25s linear infinite;
          width: max-content;
        }
        .ticker-track:hover { animation-play-state: paused; }
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ticker-item {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 20px; border-radius: 100px;
          border: 1px solid var(--border);
          background: var(--card);
          font-size: 14px; font-weight: 600; color: var(--muted);
          white-space: nowrap; cursor: default;
          transition: border-color 0.2s, color 0.2s;
        }
        .ticker-item:hover { border-color: rgba(255,255,255,0.15); color: var(--text); }

        /* ── Sections ── */
        .section { padding: 100px 24px; max-width: 1200px; margin: 0 auto; }
        .section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--blue);
          margin-bottom: 16px;
        }
        .section-heading {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 800; letter-spacing: -1px;
          color: var(--text); line-height: 1.1;
          max-width: 640px;
        }
        .section-sub {
          margin-top: 16px; font-size: 17px;
          color: var(--muted); max-width: 520px; line-height: 1.7;
        }

        /* ── Features grid ── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px; margin-top: 56px;
        }
        .feature-card {
          padding: 28px; border-radius: 16px;
          background: var(--card);
          border: 1px solid var(--border);
          transition: border-color 0.3s, transform 0.3s;
          cursor: default;
        }
        .feature-card:hover {
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-4px);
        }
        .feature-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }
        .feature-title {
          font-family: 'Poppins', sans-serif;
          font-size: 16px; font-weight: 700;
          color: var(--text); margin-bottom: 10px;
        }
        .feature-desc { font-size: 14px; color: var(--muted); line-height: 1.65; }

        /* ── How it works ── */
        .steps-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 2px; margin-top: 56px; position: relative;
        }
        .step-card {
          padding: 32px 28px;
          background: var(--card); border: 1px solid var(--border);
          position: relative; overflow: hidden;
        }
        .step-card:first-child { border-radius: 16px 0 0 16px; }
        .step-card:last-child  { border-radius: 0 16px 16px 0; }
        .step-number {
          font-family: 'Poppins', sans-serif;
          font-size: 48px; font-weight: 800;
          color: rgba(30,94,255,0.12); line-height: 1;
          display: block; margin-bottom: 24px;
        }
        .step-title {
          font-family: 'Poppins', sans-serif;
          font-size: 16px; font-weight: 700; color: var(--text);
          margin-bottom: 10px;
        }
        .step-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }

        /* ── Stats band ── */
        .stats-band {
          padding: 60px 24px;
          background: var(--card);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .stats-inner {
          max-width: 900px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 48px; text-align: center;
        }
        .stat-value {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(36px, 5vw, 56px); font-weight: 800;
          color: var(--text); line-height: 1;
        }
        .stat-value .unit { color: var(--blue); }
        .stat-label { font-size: 14px; color: var(--muted); margin-top: 8px; }

        /* ── CTA section ── */
        .cta-section {
          padding: 120px 24px; text-align: center;
          position: relative; overflow: hidden;
        }
        .cta-glow {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 600px; height: 400px;
          background: radial-gradient(ellipse, rgba(30,94,255,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-heading {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(32px, 5vw, 60px);
          font-weight: 800; letter-spacing: -1.5px;
          color: var(--text); max-width: 700px; margin: 0 auto;
          line-height: 1.05;
        }
        .cta-sub {
          margin-top: 20px; font-size: 18px;
          color: var(--muted); max-width: 460px; margin: 20px auto 0;
        }
        .cta-actions {
          display: flex; gap: 12px; justify-content: center;
          flex-wrap: wrap; margin-top: 40px;
        }
        .cta-note {
          margin-top: 16px; font-size: 13px; color: var(--subtle);
        }

        /* ── Footer ── */
        .footer {
          padding: 40px 24px;
          border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
          max-width: 1200px; margin: 0 auto;
        }
        .footer-brand {
          display: flex; align-items: center; gap: 10px;
        }
        .footer-icon {
          width: 28px; height: 28px; background: var(--blue); border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
        }
        .footer-text {
          font-size: 15px; font-weight: 800; color: var(--text);
          font-family: 'Poppins', sans-serif;
        }
        .footer-copy { font-size: 13px; color: var(--subtle); }

        /* ── Mobile menu ── */
        .mobile-menu {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(10,12,18,0.97);
          backdrop-filter: blur(20px);
          display: flex; flex-direction: column;
          padding: 24px;
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }
        .mobile-menu.open { transform: translateX(0); }
        .mobile-menu-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 48px;
        }
        .mobile-nav-link {
          font-size: 24px; font-weight: 700; color: var(--muted);
          text-decoration: none; font-family: 'Poppins', sans-serif;
          padding: 12px 0; border-bottom: 1px solid var(--border);
          transition: color 0.2s; display: block;
        }
        .mobile-nav-link:hover { color: var(--text); }
        .mobile-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 40px; }
        .btn-primary-full {
          padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 700;
          background: var(--blue); color: white; text-decoration: none;
          display: block; text-align: center;
          box-shadow: 0 0 30px var(--blue-glow);
        }
        .btn-outline-full {
          padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600;
          border: 1px solid var(--border); color: var(--muted); text-decoration: none;
          display: block; text-align: center;
        }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
          .step-card:first-child { border-radius: 16px 0 0 0; }
          .step-card:nth-child(2) { border-radius: 0 16px 0 0; }
          .step-card:nth-child(3) { border-radius: 0 0 0 16px; }
          .step-card:last-child  { border-radius: 0 0 16px 0; }
        }
        @media (max-width: 768px) {
          .nav-links, .nav-actions { display: none; }
          .nav-hamburger { display: block; }
          .hero { padding: 100px 20px 60px; }
          .hero-heading { letter-spacing: -1px; }
          .stats-inner { grid-template-columns: 1fr; gap: 32px; }
          .steps-grid { grid-template-columns: 1fr; }
          .step-card:first-child, .step-card:nth-child(2),
          .step-card:nth-child(3), .step-card:last-child {
            border-radius: 0;
          }
          .step-card:first-child { border-radius: 16px 16px 0 0; }
          .step-card:last-child  { border-radius: 0 0 16px 16px; }
          .section { padding: 64px 20px; }
          .features-grid { grid-template-columns: 1fr; }
          .footer { flex-direction: column; text-align: center; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <Link href="/" className="nav-logo">
          <div className="nav-logo-icon">
            <Ticket size={16} color="white" />
          </div>
          <span className="nav-logo-text">Tikkit</span>
        </Link>

        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </div>

        <div className="nav-actions">
          <Link href="/auth/login" className="btn-ghost">Log in</Link>
          <Link href="/auth/register" className="btn-primary">
            Get started <ArrowRight size={14} />
          </Link>
        </div>

        <button className="nav-hamburger" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </nav>

      {/* ── Mobile Menu ── */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="nav-logo">
            <div className="nav-logo-icon">
              <Ticket size={16} color="white" />
            </div>
            <span className="nav-logo-text">Tikkit</span>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
            onClick={() => setMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <a href="#features" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
        <a href="#how-it-works" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>How it works</a>
        <a href="#pricing" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
        <div className="mobile-actions">
          <Link href="/auth/register" className="btn-primary-full">Get started free</Link>
          <Link href="/auth/login" className="btn-outline-full">Log in</Link>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-glow-1" />
          <div className="hero-glow-2" />
          <div className="hero-glow-3" />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Pakistan's first event management platform
          </div>

          <h1 className="hero-heading">
            Run events like<br />
            <span className="accent">you mean it.</span>
          </h1>

          <p className="hero-sub">
            Guest lists. Ticket payments. QR check-in. Vendor tracking.{' '}
            <span className="highlight">Tikkit</span> handles every moving part so you can
            actually enjoy the event you planned.
          </p>

          <div className="hero-cta">
            <Link href="/auth/register" className="btn-primary-lg">
              Start for free <ArrowRight size={16} />
            </Link>
            <Link href="/auth/login" className="btn-outline-lg">
              Log in
            </Link>
          </div>

          <div className="hero-scroll">
            <div className="hero-scroll-line" />
            <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>scroll</span>
          </div>
        </div>
      </section>

      {/* ── Event type ticker ── */}
      <div className="ticker-section">
        <div className="ticker-track">
          {[...eventTypes, ...eventTypes, ...eventTypes].map((type, i) => (
            <div key={i} className="ticker-item">
              <span>{type.emoji}</span> {type.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-band">
        <div className="stats-inner">
          <div>
            <div className="stat-value">100<span className="unit">%</span></div>
            <div className="stat-label">Built for the Pakistani market — PKR, local wallets, local needs</div>
          </div>
          <div>
            <div className="stat-value">2<span className="unit">min</span></div>
            <div className="stat-label">Average time to create and publish your first event</div>
          </div>
          <div>
            <div className="stat-value">0<span className="unit"> chaos</span></div>
            <div className="stat-label">At the door. QR scanning means no lists, no confusion</div>
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <section className="section" id="features">
        <div className="section-label">Everything you need</div>
        <h2 className="section-heading">One platform. Every part of your event.</h2>
        <p className="section-sub">
          Stop stitching together WhatsApp groups, spreadsheets, and bank transfers.
          Tikkit is the single tool that covers it all.
        </p>

        <div className="features-grid">
          {features.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section" id="how-it-works" style={{ paddingTop: 0 }}>
        <div className="section-label">The process</div>
        <h2 className="section-heading">Zero learning curve. Maximum control.</h2>
        <p className="section-sub">
          From idea to check-in in four steps. No training required.
        </p>

        <div className="steps-grid">
          {steps.map((s, i) => <StepCard key={s.n} step={s} index={i} />)}
        </div>
      </section>

      {/* ── Why Pakistan needs this ── */}
      <section style={{ padding: '0 24px 100px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          padding: '60px', borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(30,94,255,0.08) 0%, rgba(124,58,237,0.05) 100%)',
          border: '1px solid rgba(30,94,255,0.15)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center',
        }}
          className="why-card"
        >
          <style>{`
            @media (max-width: 768px) {
              .why-card { grid-template-columns: 1fr !important; gap: 32px !important; padding: 32px !important; }
            }
          `}</style>
          <div>
            <div className="section-label">Why Tikkit</div>
            <h2 style={{
              fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text)',
              lineHeight: 1.15, marginBottom: 16,
            }}>
              Pakistan's event scene is booming. The tools haven't caught up. Until now.
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, fontSize: 16 }}>
              From rooftop parties in DHA to corporate galas in Karachi,
              event organizers have been managing hundreds of guests over WhatsApp
              threads and Google Sheets. Tikkit ends that era.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: CheckCircle, color: '#22C55E', text: 'JazzCash & EasyPaisa built right in' },
              { icon: CheckCircle, color: '#22C55E', text: 'Designed for private, boutique events' },
              { icon: CheckCircle, color: '#22C55E', text: 'Works on every phone, no app download' },
              { icon: CheckCircle, color: '#22C55E', text: 'Staff access via shareable links — no accounts needed' },
              { icon: CheckCircle, color: '#22C55E', text: 'Built by people who throw events in Pakistan' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon size={18} color={item.color} style={{ shrink: 0 }} />
                  <span style={{ color: '#D1D5DB', fontSize: 15 }}>{item.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" id="pricing">
        <div className="cta-glow" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-badge" style={{ margin: '0 auto 24px' }}>
            <Zap size={12} color="#1E5EFF" />
            Free to start. No credit card.
          </div>
          <h2 className="cta-heading">
            Your next event deserves better than a spreadsheet.
          </h2>
          <p className="cta-sub">
            Create your first event in two minutes. It's free.
          </p>
          <div className="cta-actions">
            <Link href="/auth/register" className="btn-primary-lg">
              Create your first event <ArrowRight size={16} />
            </Link>
            <Link href="/auth/login" className="btn-outline-lg">
              Log in
            </Link>
          </div>
          <p className="cta-note">No credit card required · Works on mobile · Made in Pakistan 🇵🇰</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer>
        <div className="footer">
          <div className="footer-brand">
            <div className="footer-icon">
              <Ticket size={14} color="white" />
            </div>
            <span className="footer-text">Tikkit</span>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} Tikkit. Built in Pakistan 🇵🇰</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/auth/login" style={{ color: 'var(--subtle)', fontSize: 13, textDecoration: 'none' }}>Log in</Link>
            <Link href="/auth/register" style={{ color: 'var(--subtle)', fontSize: 13, textDecoration: 'none' }}>Sign up</Link>
          </div>
        </div>
      </footer>
    </>
  )
}