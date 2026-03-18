'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Ticket, QrCode, Users, CreditCard, BarChart3,
  Building2, CheckCircle, ArrowRight, Zap, Shield,
  Bell, ClipboardCheck, Menu, X, MapPin, Calendar,
} from 'lucide-react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

// ─── Hooks ──────────────────────────────────────────────────────────────────

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

function useCountUp(target: number, inView: boolean, duration = 1400) {
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

// ─── Data ───────────────────────────────────────────────────────────────────

const features = [
  { icon: Users,         color: '#1E5EFF', glow: 'rgba(30,94,255,0.3)',   title: 'Guest Lists',           desc: 'Add guests manually or let them self-register. RSVPs, gender ratios, waitlists — all in one place.' },
  { icon: QrCode,        color: '#A855F7', glow: 'rgba(168,85,247,0.3)',  title: 'QR Check-In',           desc: 'Every guest gets a unique QR code. Scan at the door — no paper lists, no confusion, no drama.' },
  { icon: CreditCard,    color: '#22C55E', glow: 'rgba(34,197,94,0.3)',   title: 'Upfront Payments',      desc: 'Collect via JazzCash, EasyPaisa, or bank transfer. Screenshot verification with one-tap approval.' },
  { icon: ClipboardCheck,color: '#F59E0B', glow: 'rgba(245,158,11,0.3)', title: 'Smart Approvals',       desc: 'Run expression-of-interest events. Guests apply, you decide who walks in. Full control, always.' },
  { icon: Building2,     color: '#EC4899', glow: 'rgba(236,72,153,0.3)', title: 'Vendor Tracking',       desc: 'Every vendor, invoice, and payment in one dashboard. Know exactly where your budget is going.' },
  { icon: Bell,          color: '#06B6D4', glow: 'rgba(6,182,212,0.3)',   title: 'Real-Time Alerts',      desc: 'Notified the moment a guest registers, checks in, or cancels. Stay across your event effortlessly.' },
  { icon: Shield,        color: '#8B5CF6', glow: 'rgba(139,92,246,0.3)', title: 'Team Access',           desc: 'Invite staff via shareable link. Scanner-only access — your data and settings stay locked.' },
  { icon: BarChart3,     color: '#F97316', glow: 'rgba(249,115,22,0.3)', title: 'Event Analytics',       desc: 'Attendance rates, revenue breakdown, check-in timelines. Every number to run a better next event.' },
]

const eventTypes = [
  'Private Parties', 'Corporate Events', 'Concerts', 'Weddings',
  'Brand Activations', 'Rooftop Nights', 'Art Shows', 'Networking Events',
  'Product Launches', 'Sports Nights', 'Fashion Shows', 'Pop-Up Markets',
]

const steps = [
  { n: '01', title: 'Create your event', desc: 'Set the date, venue, capacity, ticket price, and registration mode. Two minutes, done.' },
  { n: '02', title: 'Share the link',    desc: 'One link for guests. Collect payments upfront or approve applications yourself.' },
  { n: '03', title: 'Scan at the door',  desc: 'Your team scans QR codes on their phones. Real-time check-in, zero chaos at the door.' },
  { n: '04', title: 'Review and repeat', desc: 'See who came, what you earned, how it went. Use the data to do it better next time.' },
]

const heroCards = [
  { name: 'Rooftop Night Karachi', date: 'Sat 22 Mar', location: 'DHA Phase 5', count: 84,  color: '#1E5EFF', status: 'Live'   },
  { name: 'Brand Launch — Lahore',  date: 'Fri 28 Mar', location: 'Gulberg III',  count: 127, color: '#22C55E', status: 'Open'   },
]

const whyList = [
  'JazzCash & EasyPaisa built right in',
  'Designed for private, boutique events',
  'Works on every phone — no app download',
  'Staff access via shareable links, no accounts',
  'Built by people who throw events in Pakistan',
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function FloatingCard({
  card, wrapClass, innerClass,
}: { card: typeof heroCards[0]; wrapClass: string; innerClass: string }) {
  return (
    <div className={wrapClass}>
      <div className={innerClass}>
        <div className="fcard">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: card.color, boxShadow: `0 0 10px ${card.color}`, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: card.color, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{card.status}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#F0F2FF', marginBottom: 6, lineHeight: 1.25 }}>{card.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280', marginBottom: 14 }}>
            <Calendar size={11} /><span>{card.date}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <MapPin size={11} /><span>{card.location}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex' }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: `hsl(${200 + i * 40},60%,55%)`, border: '2px solid #13151E', marginLeft: i > 0 ? -7 : 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{card.count} going</span>
            </div>
            <QrCode size={18} color="rgba(255,255,255,0.18)" />
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const { ref, inView } = useInView()
  const Icon = feature.icon
  return (
    <div
      ref={ref}
      className="feat-card"
      style={{
        '--glow': feature.glow,
        '--color': feature.color,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.97)',
        transition: `opacity 0.55s ease ${index * 0.06}s, transform 0.55s ease ${index * 0.06}s`,
      } as React.CSSProperties}
    >
      <div className="feat-icon">
        <Icon size={20} color={feature.color} />
      </div>
      <h3 className="feat-title">{feature.title}</h3>
      <p className="feat-desc">{feature.desc}</p>
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
        transition: `opacity 0.55s ease ${index * 0.1}s, transform 0.55s ease ${index * 0.1}s`,
      }}
    >
      <span className="step-num">{step.n}</span>
      <h3 className="step-title">{step.title}</h3>
      <p className="step-desc">{step.desc}</p>
    </div>
  )
}

function StatItem({ target, unit, label, prefix = '' }: { target: number; unit: string; label: string; prefix?: string }) {
  const { ref, inView } = useInView(0.3)
  const count = useCountUp(target, inView)
  return (
    <div ref={ref} className="stat-item">
      <div className="stat-val">
        {prefix && <span style={{ fontSize: '0.6em', marginRight: 2 }}>{prefix}</span>}
        {count}
        <span className="stat-unit">{unit}</span>
      </div>
      <p className="stat-label">{label}</p>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <style>{`
        /* ── Reset & tokens ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        body {
          background: #080A10;
          color: #F0F2FF;
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        :root {
          --blue:      #1E5EFF;
          --blue-dim:  rgba(30,94,255,0.12);
          --blue-glow: rgba(30,94,255,0.45);
          --gold:      #FFC745;
          --gold-dim:  rgba(255,199,69,0.12);
          --bg:        #080A10;
          --surface:   #0C0E16;
          --card:      #0F1119;
          --border:    rgba(255,255,255,0.07);
          --text:      #F0F2FF;
          --muted:     #6B7280;
          --subtle:    #374151;
        }

        /* ── Keyframes ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.45; transform: scale(0.75); }
        }
        @keyframes scrollLine {
          0%, 100% { transform: scaleY(0.3) translateY(-12px); opacity: 0.25; }
          50%      { transform: scaleY(1)   translateY(0);     opacity: 1;    }
        }
        /* Floating cards */
        @keyframes fcardFade  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes float1 {
          0%,100% { transform: translateY(0px); }
          33%     { transform: translateY(-18px); }
          66%     { transform: translateY(-8px); }
        }
        @keyframes float2 {
          0%,100% { transform: translateY(-10px); }
          40%     { transform: translateY(10px); }
          70%     { transform: translateY(-20px); }
        }
        /* Gradient orbs */
        @keyframes orbDrift {
          0%,100% { transform: translate(0,0)       scale(1);    opacity: 0.18; }
          33%     { transform: translate(50px,-40px) scale(1.12); opacity: 0.25; }
          66%     { transform: translate(-30px,30px) scale(0.9);  opacity: 0.14; }
        }
        @keyframes orbDrift2 {
          0%,100% { transform: translate(0,0)        scale(1);    opacity: 0.1; }
          50%     { transform: translate(-60px,40px)  scale(1.15); opacity: 0.18; }
        }
        /* Scan line on QR feature */
        @keyframes scanLine {
          0%,100% { transform: translateY(0);    opacity: 0.55; }
          50%     { transform: translateY(44px); opacity: 0.85; }
        }
        /* Gold shimmer on badge */
        @keyframes goldSweep {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%)  skewX(-15deg); }
        }
        /* CTA background shift */
        @keyframes ctaBg {
          0%,100% { background-position: 0% 50%; }
          50%     { background-position: 100% 50%; }
        }
        /* Blob morph */
        @keyframes blobMorph {
          0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25%     { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50%     { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
          75%     { border-radius: 60% 30% 60% 40% / 70% 40% 50% 60%; }
        }

        /* Respect reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }

        /* ── Nav ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px; height: 64px;
          transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
        }
        .nav.scrolled {
          background: rgba(8,10,16,0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px; text-decoration: none; cursor: pointer; flex: 1;
        }
        .nav-logo-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #2B6FFF, #1448CC);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(30,94,255,0.4);
        }
        .nav-logo-text {
          font-family: var(--font-display);
          font-size: 21px; font-weight: 700; color: var(--text);
          letter-spacing: -0.5px;
        }
        .nav-links { display: flex; align-items: center; gap: 36px; }
        .nav-link {
          font-size: 14px; color: var(--muted); text-decoration: none;
          font-weight: 500; transition: color 0.2s; cursor: pointer;
        }
        .nav-link:hover { color: var(--text); }
        .nav-actions { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: flex-end; }
        .btn-ghost {
          padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;
          color: var(--muted); text-decoration: none; transition: color 0.2s; cursor: pointer;
        }
        .btn-ghost:hover { color: var(--text); }
        .btn-nav {
          padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 700;
          background: var(--blue); color: white; text-decoration: none;
          transition: opacity 0.2s, box-shadow 0.2s, transform 0.2s;
          display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
          box-shadow: 0 0 24px rgba(30,94,255,0.35);
        }
        .btn-nav:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 0 36px rgba(30,94,255,0.5); }
        .nav-hamburger {
          display: none; background: none; border: none; color: var(--muted); cursor: pointer; padding: 4px;
        }

        /* ── Hero ── */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 120px 24px 80px; text-align: center; position: relative; overflow: hidden;
        }
        /* Background layers */
        .hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 85% 65% at 50% 20%, black 0%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 85% 65% at 50% 20%, black 0%, transparent 100%);
        }
        .hero-orb-1 {
          position: absolute; top: -15%; left: 50%; transform: translateX(-50%);
          width: 900px; height: 700px; pointer-events: none;
          background: radial-gradient(ellipse, rgba(30,94,255,0.2) 0%, transparent 68%);
          animation: orbDrift 18s ease-in-out infinite;
        }
        .hero-orb-2 {
          position: absolute; top: 30%; left: 5%;
          width: 500px; height: 500px; pointer-events: none;
          background: radial-gradient(ellipse, rgba(168,85,247,0.1) 0%, transparent 70%);
          border-radius: 50%;
          animation: blobMorph 14s ease-in-out infinite, orbDrift2 20s ease-in-out infinite;
        }
        .hero-orb-3 {
          position: absolute; top: 15%; right: 2%;
          width: 480px; height: 480px; pointer-events: none;
          background: radial-gradient(ellipse, rgba(34,197,94,0.07) 0%, transparent 70%);
          border-radius: 50%;
          animation: blobMorph 11s ease-in-out 4s infinite, orbDrift 16s ease-in-out 6s infinite;
        }
        /* Floating card positions */
        .fcard-wrap-1 {
          position: absolute; left: calc(50% - 490px); top: 50%;
          transform: translateY(-55%) rotate(-7deg);
          animation: fcardFade 1s ease 0.6s both;
        }
        .fcard-inner-1 { animation: float1 8s ease-in-out 1.6s infinite; }
        .fcard-wrap-2 {
          position: absolute; right: calc(50% - 490px); top: 43%;
          transform: translateY(-50%) rotate(6deg);
          animation: fcardFade 1s ease 0.8s both;
        }
        .fcard-inner-2 { animation: float2 10s ease-in-out 1.8s infinite; }
        .fcard {
          width: 238px;
          background: rgba(13,15,22,0.9);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset;
          pointer-events: none;
        }

        /* Hero content */
        .hero-content { position: relative; z-index: 2; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 6px 16px; border-radius: 100px;
          border: 1px solid rgba(255,199,69,0.25);
          background: rgba(255,199,69,0.07);
          font-size: 12px; font-weight: 700; color: #D4A017;
          letter-spacing: 0.07em; text-transform: uppercase;
          margin-bottom: 30px; position: relative; overflow: hidden;
          animation: fadeUp 0.7s ease both;
        }
        .hero-badge::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,199,69,0.25), transparent);
          animation: goldSweep 3.5s ease-in-out 1.5s infinite;
        }
        .badge-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--gold); box-shadow: 0 0 10px var(--gold);
          animation: pulseDot 2s infinite; flex-shrink: 0;
        }
        .hero-h1 {
          font-family: var(--font-display);
          font-size: clamp(44px, 7.5vw, 88px);
          font-weight: 700;
          line-height: 1.0;
          letter-spacing: -3px;
          color: var(--text);
          max-width: 840px;
          animation: fadeUp 0.7s ease 0.1s both;
        }
        .hero-h1 .accent {
          background: linear-gradient(135deg, #5B8AFF 0%, #1E5EFF 50%, #8B5CF6 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          margin-top: 26px;
          font-size: clamp(16px, 2.2vw, 20px);
          color: var(--muted); max-width: 560px;
          line-height: 1.75; margin-left: auto; margin-right: auto;
          animation: fadeUp 0.7s ease 0.2s both;
        }
        .hero-sub strong { color: #9CA3AF; font-weight: 500; }
        .hero-cta {
          display: flex; gap: 12px; margin-top: 44px;
          flex-wrap: wrap; justify-content: center;
          animation: fadeUp 0.7s ease 0.3s both;
        }
        .btn-primary-lg {
          padding: 15px 30px; border-radius: 12px; font-size: 15px; font-weight: 700;
          background: var(--blue); color: white; text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
          box-shadow: 0 0 40px var(--blue-glow);
          transition: opacity 0.2s, transform 0.25s, box-shadow 0.25s;
          font-family: var(--font-display);
        }
        .btn-primary-lg:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 0 60px var(--blue-glow); }
        .btn-outline-lg {
          padding: 15px 30px; border-radius: 12px; font-size: 15px; font-weight: 600;
          border: 1px solid rgba(255,255,255,0.1); color: var(--muted); text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
          transition: border-color 0.2s, color 0.2s, transform 0.2s;
          font-family: var(--font-display);
        }
        .btn-outline-lg:hover { border-color: rgba(255,255,255,0.22); color: var(--text); transform: translateY(-1px); }
        .btn-gold-lg {
          padding: 15px 30px; border-radius: 12px; font-size: 15px; font-weight: 700;
          border: 1px solid rgba(255,199,69,0.45); color: #FFC745; text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
          font-family: var(--font-display);
          background: rgba(255,199,69,0.07);
          box-shadow: 0 0 22px rgba(255,199,69,0.12), inset 0 1px 0 rgba(255,199,69,0.12);
          transition: all 0.22s ease;
        }
        .btn-gold-lg:hover {
          border-color: rgba(255,199,69,0.75);
          background: rgba(255,199,69,0.13);
          box-shadow: 0 0 36px rgba(255,199,69,0.28), inset 0 1px 0 rgba(255,199,69,0.2);
          transform: translateY(-1px);
          color: #FFD97A;
        }
        .hero-scroll {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          margin-top: 80px; color: var(--subtle); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          animation: fadeUp 0.7s ease 0.5s both;
        }
        .hero-scroll-line {
          width: 1px; height: 44px;
          background: linear-gradient(transparent, rgba(30,94,255,0.5));
          animation: scrollLine 2.2s ease-in-out infinite;
        }

        /* ── Ticker ── */
        @keyframes tickerGlow {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1;   }
        }
        .ticker-wrap {
          padding: 32px 0; overflow: hidden;
          border-top: 1px solid rgba(255,199,69,0.12);
          border-bottom: 1px solid rgba(255,199,69,0.12);
          background: linear-gradient(180deg, rgba(255,199,69,0.03) 0%, transparent 100%),
                      linear-gradient(to right, #080A10 0%, transparent 10%, transparent 90%, #080A10 100%);
          position: relative;
        }
        .ticker-wrap::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 100% at 50% 50%, rgba(255,199,69,0.04) 0%, transparent 70%);
          pointer-events: none;
        }
        .ticker-track {
          display: flex; gap: 12px; width: max-content;
          animation: ticker 32s linear infinite;
        }
        .ticker-track:hover { animation-play-state: paused; }
        .ticker-item {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 22px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.11);
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(30,94,255,0.04) 100%);
          font-size: 13px; font-weight: 600; color: #C4C8E0;
          white-space: nowrap; cursor: default;
          transition: border-color 0.25s, color 0.25s, box-shadow 0.25s, background 0.25s;
          font-family: var(--font-display);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .ticker-item:hover {
          border-color: rgba(255,199,69,0.4);
          color: #F0F2FF;
          background: linear-gradient(135deg, rgba(255,199,69,0.08) 0%, rgba(30,94,255,0.06) 100%);
          box-shadow: 0 0 18px rgba(255,199,69,0.14), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .ticker-dot {
          width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
          animation: tickerGlow 2.4s ease-in-out infinite;
        }

        /* ── Stats ── */
        .stats-band {
          padding: 72px 24px;
          background: linear-gradient(180deg, var(--surface) 0%, #080A10 100%);
          border-bottom: 1px solid var(--border);
          position: relative;
        }
        .stats-band::before {
          content: '';
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 600px; height: 1px;
          background: linear-gradient(to right, transparent, rgba(30,94,255,0.4), transparent);
        }
        .stats-inner {
          max-width: 900px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3,1fr); gap: 48px; text-align: center;
        }
        .stat-item { position: relative; }
        .stat-item:not(:last-child)::after {
          content: '';
          position: absolute; right: -24px; top: 20%; bottom: 20%;
          width: 1px; background: var(--border);
        }
        .stat-val {
          font-family: var(--font-display);
          font-size: clamp(42px, 5.5vw, 64px); font-weight: 700;
          color: var(--text); line-height: 1; letter-spacing: -2px;
        }
        .stat-unit { color: var(--blue); font-size: 0.55em; letter-spacing: 0; }
        .stat-label { font-size: 14px; color: var(--muted); margin-top: 10px; line-height: 1.5; max-width: 220px; margin-left: auto; margin-right: auto; }

        /* ── Sections ── */
        .section { padding: 100px 24px; max-width: 1200px; margin: 0 auto; }
        .sec-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--blue); margin-bottom: 16px;
          display: flex; align-items: center; gap: 10px;
        }
        .sec-label::before {
          content: ''; width: 20px; height: 2px;
          background: var(--blue); border-radius: 1px;
        }
        .sec-h2 {
          font-family: var(--font-display);
          font-size: clamp(30px, 4vw, 52px); font-weight: 700;
          letter-spacing: -1.5px; color: var(--text); line-height: 1.05; max-width: 640px;
        }
        .sec-sub {
          margin-top: 18px; font-size: 17px;
          color: var(--muted); max-width: 520px; line-height: 1.75;
        }

        /* ── Features ── */
        .feat-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; margin-top: 56px;
          background: var(--border); border-radius: 20px; overflow: hidden;
        }
        .feat-card {
          padding: 30px 26px; cursor: default;
          background: var(--card);
          transition: background 0.3s;
          position: relative;
        }
        .feat-card:hover { background: #131620; }
        .feat-card:hover .feat-icon { box-shadow: 0 0 28px var(--glow); }
        .feat-card::after {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 120%, var(--glow, transparent) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.4s;
        }
        .feat-card:hover::after { opacity: 1; }
        .feat-icon {
          width: 46px; height: 46px; border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          background: var(--glow); margin-bottom: 20px;
          transition: box-shadow 0.3s;
          position: relative; z-index: 1;
        }
        .feat-title {
          font-family: var(--font-display);
          font-size: 15px; font-weight: 700; color: var(--text);
          margin-bottom: 10px; position: relative; z-index: 1;
        }
        .feat-desc { font-size: 13.5px; color: var(--muted); line-height: 1.65; position: relative; z-index: 1; }

        /* ── Steps ── */
        .steps-grid {
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 0; margin-top: 56px;
          border: 1px solid var(--border); border-radius: 20px; overflow: hidden;
          position: relative;
        }
        .step-card {
          padding: 36px 28px;
          background: var(--card);
          border-right: 1px solid var(--border);
          position: relative; overflow: hidden;
          transition: background 0.3s;
        }
        .step-card:last-child { border-right: none; }
        .step-card:hover { background: #131620; }
        .step-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--blue), #8B5CF6);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.4s ease;
        }
        .step-card:hover::before { transform: scaleX(1); }
        .step-num {
          font-family: var(--font-display);
          font-size: 52px; font-weight: 700;
          color: rgba(30,94,255,0.1); line-height: 1;
          display: block; margin-bottom: 24px;
          transition: color 0.3s;
        }
        .step-card:hover .step-num { color: rgba(30,94,255,0.2); }
        .step-title {
          font-family: var(--font-display);
          font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 10px;
        }
        .step-desc { font-size: 13.5px; color: var(--muted); line-height: 1.65; }

        /* ── Why card ── */
        .why-card {
          padding: 64px; border-radius: 24px;
          background: linear-gradient(135deg, rgba(30,94,255,0.07) 0%, rgba(124,58,237,0.04) 100%);
          border: 1px solid rgba(30,94,255,0.14);
          display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
        }
        .why-h2 {
          font-family: var(--font-display);
          font-size: clamp(24px, 3vw, 38px); font-weight: 700;
          letter-spacing: -0.5px; color: var(--text); line-height: 1.15; margin-bottom: 18px;
        }
        .why-sub { color: var(--muted); line-height: 1.75; font-size: 16px; }
        .why-list { display: flex; flex-direction: column; gap: 14px; }
        .why-item { display: flex; align-items: center; gap: 12px; }
        .why-text { color: #D1D5DB; font-size: 15px; }

        /* ── CTA ── */
        .cta-section {
          padding: 130px 24px; text-align: center; position: relative; overflow: hidden;
        }
        .cta-bg {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30,94,255,0.12) 0%, transparent 70%);
          animation: orbDrift 20s ease-in-out infinite;
        }
        .cta-bg-2 {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 40% 40% at 70% 40%, rgba(139,92,246,0.07) 0%, transparent 70%);
        }
        .cta-inner { position: relative; z-index: 1; }
        .cta-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px; border-radius: 100px;
          border: 1px solid rgba(30,94,255,0.3); background: rgba(30,94,255,0.08);
          font-size: 12px; font-weight: 700; color: #7BA7FF;
          letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 28px;
        }
        .cta-h2 {
          font-family: var(--font-display);
          font-size: clamp(34px, 5.5vw, 66px); font-weight: 700;
          letter-spacing: -2px; color: var(--text); max-width: 720px;
          margin: 0 auto; line-height: 1.0;
        }
        .cta-h2 .gold { color: var(--gold); }
        .cta-sub {
          margin-top: 22px; font-size: 18px; color: var(--muted);
          max-width: 440px; margin-left: auto; margin-right: auto; margin-top: 22px;
        }
        .cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 44px; }
        .cta-note { margin-top: 18px; font-size: 13px; color: var(--gold); font-family: var(--font-display); font-weight: 700; letter-spacing: 0.1em; }

        /* ── Footer ── */
        .footer-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 40px 24px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
          border-top: 1px solid var(--border);
        }
        .footer-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .footer-icon {
          width: 28px; height: 28px; background: var(--blue); border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
        }
        .footer-name {
          font-family: var(--font-display);
          font-size: 16px; font-weight: 700; color: var(--text);
        }
        .footer-copy { font-size: 13px; color: var(--subtle); }
        .footer-links { display: flex; gap: 24px; }
        .footer-link { color: var(--subtle); font-size: 13px; text-decoration: none; transition: color 0.2s; cursor: pointer; }
        .footer-link:hover { color: var(--muted); }

        /* ── Mobile menu ── */
        .mmenu {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(8,10,16,0.97);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          display: flex; flex-direction: column; padding: 24px;
          transform: translateX(100%); transition: transform 0.32s cubic-bezier(0.4,0,0.2,1);
        }
        .mmenu.open { transform: translateX(0); }
        .mmenu-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 52px; }
        .mmenu-link {
          font-family: var(--font-display);
          font-size: 26px; font-weight: 700; color: var(--muted);
          text-decoration: none; padding: 14px 0;
          border-bottom: 1px solid var(--border); transition: color 0.2s; display: block; cursor: pointer;
        }
        .mmenu-link:hover { color: var(--text); }
        .mmenu-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 44px; }
        .btn-full-primary {
          padding: 15px; border-radius: 12px; font-size: 16px; font-weight: 700;
          font-family: var(--font-display);
          background: var(--blue); color: white; text-decoration: none;
          display: block; text-align: center;
          box-shadow: 0 0 32px var(--blue-glow); cursor: pointer;
        }
        .btn-full-outline {
          padding: 15px; border-radius: 12px; font-size: 16px; font-weight: 600;
          font-family: var(--font-display);
          border: 1px solid var(--border); color: var(--muted); text-decoration: none;
          display: block; text-align: center; cursor: pointer;
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .fcard-wrap-1, .fcard-wrap-2 { display: none; }
        }
        @media (max-width: 1024px) {
          .feat-grid { grid-template-columns: repeat(2,1fr); }
          .steps-grid { grid-template-columns: repeat(2,1fr); }
          .step-card:nth-child(2) { border-right: none; }
          .step-card:nth-child(3) { border-right: 1px solid var(--border); border-top: 1px solid var(--border); }
          .step-card:last-child { border-top: 1px solid var(--border); }
        }
        @media (max-width: 768px) {
          .nav-links, .nav-actions { display: none; }
          .nav-hamburger { display: block; }

          /* Hero */
          .hero { padding: 80px 16px 36px; min-height: auto; }
          .hero-h1 { letter-spacing: -1.5px; font-size: clamp(36px, 9vw, 56px); }
          .hero-sub { font-size: 15px; margin-top: 18px; }
          .hero-scroll { margin-top: 36px; }
          .hero-badge { font-size: 10px; gap: 8px; padding: 5px 12px; white-space: nowrap; }
          .hero-cta { flex-direction: column; align-items: stretch; margin-top: 32px; }
          .btn-primary-lg, .btn-gold-lg, .btn-outline-lg { justify-content: center; width: 100%; padding: 14px 24px; }

          /* Stats */
          .stats-band { padding: 36px 16px; }
          .stats-inner { gap: 0; }
          .stat-item::after { top: 10%; bottom: 10%; }
          .stat-val { font-size: clamp(26px, 7vw, 38px); letter-spacing: -1px; }
          .stat-label { font-size: 11px; margin-top: 5px; max-width: none; }

          /* Features — 2-column grid */
          .feat-grid { grid-template-columns: repeat(2, 1fr); }
          .feat-card { padding: 18px 14px; }
          .feat-icon { width: 36px; height: 36px; border-radius: 10px; margin-bottom: 12px; }
          .feat-title { font-size: 13px; margin-bottom: 6px; }
          .feat-desc { font-size: 12px; line-height: 1.55; }

          /* Steps — 2-column grid */
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
          .step-card { padding: 22px 16px; border-right: 1px solid var(--border) !important; border-top: 1px solid var(--border); }
          .step-card:first-child { border-top: none; }
          .step-card:nth-child(2) { border-top: none; border-right: none !important; }
          .step-card:last-child { border-right: none !important; }
          .step-num { font-size: 32px; margin-bottom: 12px; }
          .step-title { font-size: 13px; }
          .step-desc { font-size: 12px; line-height: 1.55; }

          /* Why card */
          .why-card { grid-template-columns: 1fr !important; gap: 24px !important; padding: 24px 20px !important; }
          .why-sub { font-size: 14px; }
          .why-text { font-size: 14px; }

          /* CTA */
          .cta-section { padding: 60px 16px; }
          .cta-h2 { font-size: clamp(28px, 7.5vw, 36px); line-height: 1.1; letter-spacing: -1px; }
          .cta-sub { font-size: 14px; margin-top: 14px; }
          .cta-actions { flex-direction: column; align-items: stretch; gap: 10px; }
          .cta-actions .btn-primary-lg, .cta-actions .btn-gold-lg { width: 100%; justify-content: center; }

          /* General */
          .section { padding: 48px 16px; }
          .sec-h2 { font-size: clamp(26px, 6.5vw, 40px); }
          .sec-sub { font-size: 14px; margin-top: 12px; }
          .footer-inner { flex-direction: column; text-align: center; padding: 28px 16px; }
          .footer-links { justify-content: center; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <Link href="/" className="nav-logo">
          <TikkitXLogo size="md" />
        </Link>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <Link href="/how-it-works" className="nav-link">How it works</Link>
          <Link href="/explore" className="nav-link">Explore</Link>
        </div>
        <div className="nav-actions">
          <Link href="/auth/login" className="btn-ghost">Log in</Link>
          <Link href="/auth/login" className="btn-nav">Get started <ArrowRight size={14} /></Link>
        </div>
        <button className="nav-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>
      </nav>

      {/* ── Mobile menu ── */}
      <div className={`mmenu ${menuOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="mmenu-header">
          <div className="nav-logo">
            <TikkitXLogo size="md" />
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
            onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>
        <a href="#features"     className="mmenu-link" onClick={() => setMenuOpen(false)}>Features</a>
        <Link href="/how-it-works" className="mmenu-link" onClick={() => setMenuOpen(false)}>How it works</Link>
        <Link href="/explore" className="mmenu-link" onClick={() => setMenuOpen(false)}>Explore</Link>
        <div className="mmenu-actions">
          <Link href="/auth/login" className="btn-full-primary">Get started free</Link>
          <Link href="/auth/login" className="btn-full-outline">Log in</Link>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="hero">
        {/* BG */}
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orb-1" aria-hidden="true" />
        <div className="hero-orb-2" aria-hidden="true" />
        <div className="hero-orb-3" aria-hidden="true" />

        {/* Floating event cards */}
        <FloatingCard card={heroCards[0]} wrapClass="fcard-wrap-1" innerClass="fcard-inner-1" />
        <FloatingCard card={heroCards[1]} wrapClass="fcard-wrap-2" innerClass="fcard-inner-2" />

        {/* Main copy */}
        <div className="hero-content">
          <div className="hero-badge" aria-label="New">
            <div className="badge-dot" aria-hidden="true" />
            Made for organizers who take it seriously
          </div>

          <h1 className="hero-h1">
            Run events like<br />
            <span className="accent">you mean it.</span>
          </h1>

          <p className="hero-sub">
            Stop juggling WhatsApp threads, spreadsheets, and bank screenshots.
            Tikkit handles <strong>guest lists, QR check-in, payments,</strong> and everything
            in between — so you can actually enjoy the night.
          </p>

          <div className="hero-cta">
            <Link href="/auth/login" className="btn-primary-lg">
              Start for free <ArrowRight size={16} />
            </Link>
            <Link href="/how-it-works" className="btn-gold-lg">
              See how it works
            </Link>
          </div>

          <div className="hero-scroll" aria-hidden="true">
            <div className="hero-scroll-line" />
            <span>scroll</span>
          </div>
        </div>
      </section>

      {/* ── Event types ticker ── */}
      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker-track">
          {[...eventTypes, ...eventTypes, ...eventTypes].map((label, i) => {
            const dotColors = ['#FFC745', '#1E5EFF', '#A855F7', '#00D4FF', '#22C55E', '#FF6B6B']
            const dotColor  = dotColors[i % dotColors.length]
            return (
              <div key={i} className="ticker-item">
                <div className="ticker-dot" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
                {label}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-band">
        <div className="stats-inner">
          <StatItem target={100} unit="%" label="Built for Pakistan — PKR, JazzCash, EasyPaisa, all native." />
          <StatItem target={2}   unit="min" label="Average time to create and publish your first event." />
          <StatItem target={0}   unit=" chaos" label="At the door. QR scanning means no lists, no confusion." />
        </div>
      </div>

      {/* ── Features ── */}
      <section className="section" id="features">
        <div className="sec-label">The full toolkit</div>
        <h2 className="sec-h2">One platform. Every part of your event.</h2>
        <p className="sec-sub">
          Stop stitching together WhatsApp groups, spreadsheets, and bank transfers.
          Tikkit covers it all.
        </p>
        <div className="feat-grid">
          {features.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section" id="how-it-works" style={{ paddingTop: 0 }}>
        <div className="sec-label">How it flows</div>
        <h2 className="sec-h2">Zero learning curve. Maximum control.</h2>
        <p className="sec-sub">From idea to check-in in four steps. No training, no manual.</p>
        <div className="steps-grid">
          {steps.map((s, i) => <StepCard key={s.n} step={s} index={i} />)}
        </div>
      </section>

      {/* ── Why Tikkit ── */}
      <section style={{ padding: '0 24px 100px', maxWidth: 1200, margin: '0 auto' }} id="why-tikkit">
        <div className="why-card">
          <div>
            <div className="sec-label">Why Tikkit</div>
            <h2 className="why-h2">
              Pakistan's event scene is booming. The tools haven't caught up.{' '}
              <span style={{ color: 'var(--blue)' }}>Until now.</span>
            </h2>
            <p className="why-sub">
              From rooftop nights in DHA to corporate galas in Karachi, organizers have been
              managing hundreds of guests over WhatsApp threads and Google Sheets. Tikkit ends that era.
            </p>
          </div>
          <div className="why-list">
            {whyList.map((text, i) => (
              <div key={i} className="why-item">
                <CheckCircle size={18} color="#22C55E" style={{ flexShrink: 0 }} />
                <span className="why-text">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-bg" aria-hidden="true" />
        <div className="cta-bg-2" aria-hidden="true" />
        <div className="cta-inner">
          <div className="cta-badge">
            <Zap size={12} color="#1E5EFF" aria-hidden="true" />
            Free to start — no credit card
          </div>
          <h2 className="cta-h2">
            Your next event deserves better than a{' '}
            <span className="gold">spreadsheet.</span>
          </h2>
          <p className="cta-sub">
            Create your first event in two minutes. It's free, and it actually works.
          </p>
          <div className="cta-actions">
            <Link href="/auth/login" className="btn-primary-lg">
              Create your first event <ArrowRight size={16} />
            </Link>
            <Link href="/explore" className="btn-gold-lg">
              Explore events →
            </Link>
          </div>
          <p className="cta-note">PLAN. PUBLISH. PARTY.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer>
        <div className="footer-inner">
          <Link href="/" className="footer-brand">
            <TikkitXLogo size="sm" />
          </Link>
          <p className="footer-copy">© {new Date().getFullYear()} Tikkit. Built in Pakistan 🇵🇰</p>
          <div className="footer-links">
            <Link href="/how-it-works" className="footer-link">How it works</Link>
            <Link href="/auth/login" className="footer-link">Log in</Link>
            <Link href="/auth/login" className="footer-link">Sign up</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
