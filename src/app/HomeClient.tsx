'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Zap, Menu, X, ChevronDown } from 'lucide-react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

// ─── Hooks ─────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCountUp(target: number, inView: boolean, duration = 1600) {
  const [count, setCount] = useState(target)
  useEffect(() => { setCount(0) }, [])
  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target, duration])
  return count
}

// ─── Data ──────────────────────────────────────────────────────────────────

const CITIES = ['KARACHI', 'LAHORE', 'ISLAMABAD', 'THE UNDERGROUND', 'YOUR CITY']

const TICKER_ITEMS = [
  'EVENTS', 'VENDOR X', 'VENUES & EXPERIENCES', 'ARTIST MANAGEMENT',
  'GUEST APP', 'X ANALYTICS', 'QR CHECK-IN', 'DEAL PIPELINE',
  'SPOT BOOKING', 'ROSTER MANAGEMENT', 'LIVE TRACKING', 'ZERO COMMISSION',
]

const MODULES = [
  {
    id: 'events', icon: '🎟', name: 'TIKKIT X Events',
    tagline: 'The organiser\'s command centre.',
    color: '#1E5EFF', glow: 'rgba(30,94,255,0.45)', border: 'rgba(30,94,255,0.2)', bg: 'rgba(30,94,255,0.05)',
    stat: { v: '2min', l: 'to go live' },
    features: ['Guest lists & curated RSVPs', 'QR check-in at the door', 'JazzCash & EasyPaisa payments'],
    href: '/auth/login?flow=organizer-signup', cta: 'Start for free',
  },
  {
    id: 'vendor', icon: '🎛', name: 'Vendor X',
    tagline: 'Win gigs. Get paid. Scale.',
    color: '#8B5CF6', glow: 'rgba(139,92,246,0.45)', border: 'rgba(139,92,246,0.2)', bg: 'rgba(139,92,246,0.05)',
    stat: { v: '0%', l: 'platform cut' },
    features: ['Deal pipeline & CRM', 'Professional invoicing', 'Cross-hire network'],
    href: '/vendor/home', cta: 'Get access',
  },
  {
    id: 'venues', icon: '🏛', name: 'Venues & Experiences',
    tagline: 'Fill every date. Zero commission.',
    color: '#D4AF37', glow: 'rgba(212,175,55,0.45)', border: 'rgba(212,175,55,0.2)', bg: 'rgba(212,175,55,0.05)',
    stat: { v: '48h', l: 'to go live' },
    features: ['Live availability calendar', 'Spot-map seat selection', 'Programme management'],
    href: '/venue/home', cta: 'List your venue',
  },
  {
    id: 'artists', icon: '🎤', name: 'Artist Management',
    tagline: 'Your roster. Bookings that find you.',
    color: '#00E5FF', glow: 'rgba(0,229,255,0.45)', border: 'rgba(0,229,255,0.2)', bg: 'rgba(0,229,255,0.05)',
    stat: { v: '✓', l: 'verified only' },
    features: ['Verified artist profiles', 'Structured booking enquiries', 'Management company portal'],
    href: '/artist-mgmt/home', cta: 'Get access',
  },
  {
    id: 'guest', icon: '📱', name: 'Guest App',
    tagline: 'Discover. Register. Show up.',
    color: '#22C55E', glow: 'rgba(34,197,94,0.45)', border: 'rgba(34,197,94,0.2)', bg: 'rgba(34,197,94,0.05)',
    stat: { v: '1 tap', l: 'check-in' },
    features: ['City event discovery', 'Digital QR passes', 'Personal event history'],
    href: '/explore', cta: 'Explore events',
  },
  {
    id: 'analytics', icon: '📊', name: 'X Analytics',
    tagline: 'Data from every corner of your night.',
    color: '#F97316', glow: 'rgba(249,115,22,0.45)', border: 'rgba(249,115,22,0.2)', bg: 'rgba(249,115,22,0.05)',
    stat: { v: '∞', l: 'data points' },
    features: ['Revenue & attendance tracking', 'Cross-module intelligence', 'Pipeline & conversion data'],
    href: '/dashboard', cta: 'View dashboard',
  },
]

const FLOW = [
  { label: 'Organiser', sub: 'posts the event',     color: '#1E5EFF', icon: '👤' },
  { label: 'Venue',     sub: 'confirms the space',   color: '#D4AF37', icon: '🏛' },
  { label: 'Artist',    sub: 'accepts the booking',  color: '#00E5FF', icon: '🎤' },
  { label: 'Vendor',    sub: 'wins the gig',          color: '#8B5CF6', icon: '🎛' },
  { label: 'Guests',    sub: 'scan in at the door',  color: '#22C55E', icon: '🎟' },
]

const ACTIVITY = [
  { icon: '🎤', text: 'New enquiry sent',         detail: 'DJ Camo · Karachi Rooftop Night · just now',       color: '#00E5FF' },
  { icon: '🎟', text: '87 tickets sold',           detail: 'Neon Night Lahore · 2 min ago',                   color: '#22C55E' },
  { icon: '🏛', text: 'Venue listed',              detail: 'Alhamra Arts Council · Lahore · 4 min ago',       color: '#D4AF37' },
  { icon: '💼', text: 'Deal confirmed',            detail: 'Sound & AV rig · Polo Club · 6 min ago',          color: '#8B5CF6' },
  { icon: '✅', text: '124 guests checked in',     detail: 'Brand Launch · DHA Phase 5 · 9 min ago',          color: '#1E5EFF' },
  { icon: '🎤', text: 'Booking confirmed',         detail: 'Echo Ensemble · Corporate gala · 11 min ago',     color: '#00E5FF' },
  { icon: '🏛', text: 'Spot reserved',             detail: 'Studio A · Recording session · 14 min ago',       color: '#D4AF37' },
  { icon: '🎟', text: 'Waitlist opened',           detail: 'Underground Night · Islamabad · 16 min ago',      color: '#F97316' },
  { icon: '💼', text: 'Invoice paid',              detail: 'Lighting rig hire · Gulberg · 19 min ago',        color: '#8B5CF6' },
  { icon: '🎟', text: '212 registrations',         detail: 'Art Week Karachi · today',                        color: '#22C55E' },
]

const TESTIMONIALS = [
  { quote: "We've been running private events for years. The door is everything — who gets in, who doesn't. Tikkit was the first tool that actually understood that.", handle: 'Organiser · Berlin' },
  { quote: 'Three invite-only sessions in one weekend. Sixty guests, zero chaos, zero screenshots at the door. It just worked.', handle: 'Event curator · Toronto' },
  { quote: "The guest list curation is what got me. Not everyone gets in. That's the whole point. Finally something built around that logic.", handle: 'Private events · Tokyo' },
  { quote: "We don't publicise our events and we don't want to. Tikkit lets us run tight, keep it quiet, and still have everything organised from one place.", handle: 'Underground collective · London' },
  { quote: 'First time using it in Karachi. Fifty people, rooftop, no issues at the door. Every scan went through cleanly. No one got in who wasn\'t supposed to.', handle: 'Organiser · Karachi' },
  { quote: 'We were in a basement with no signal. The offline QR check-in still worked. That was the moment I knew this was built by people who actually run events.', handle: 'Event host · Amsterdam' },
]

// ─── Sub-components ─────────────────────────────────────────────────────────

function ModuleCard({ mod, index }: { mod: typeof MODULES[0]; index: number }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className="mod-card"
      style={{
        '--mc': mod.color, '--mg': mod.glow, '--mb': mod.border, '--mbg': mod.bg,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
        transition: `opacity 0.7s ease ${index * 0.09}s, transform 0.7s ease ${index * 0.09}s`,
      } as React.CSSProperties}
    >
      <div className="mod-header">
        <span className="mod-emoji">{mod.icon}</span>
        <div className="mod-stat-chip">
          <span className="mod-stat-v">{mod.stat.v}</span>
          <span className="mod-stat-l">{mod.stat.l}</span>
        </div>
      </div>
      <h3 className="mod-name">{mod.name}</h3>
      <p className="mod-tagline">{mod.tagline}</p>
      <ul className="mod-features">
        {mod.features.map(f => <li key={f}><span className="mod-check">✓</span>{f}</li>)}
      </ul>
      <Link href={mod.href} className="mod-cta">{mod.cta} →</Link>
    </div>
  )
}

function TestimonialCard({ quote, handle, index }: { quote: string; handle: string; index: number }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className="t-card" style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : 'translateY(28px)',
      transition: `opacity 0.65s ease ${index * 0.08}s, transform 0.65s ease ${index * 0.08}s`,
    }}>
      <p className="t-quote">{quote}</p>
      <span className="t-handle">{handle}</span>
    </div>
  )
}

function StatItem({ target, unit, label }: { target: number; unit: string; label: string }) {
  const { ref, inView } = useInView(0.3)
  const count = useCountUp(target, inView)
  return (
    <div ref={ref} className="stat-item">
      <div className="stat-val">{count}<span className="stat-unit">{unit}</span></div>
      <p className="stat-label">{label}</p>
    </div>
  )
}

function LiveFeed() {
  const [items, setItems] = useState(ACTIVITY.slice(0, 5))
  const idxRef = useRef(5)
  useEffect(() => {
    const t = setInterval(() => {
      const next = ACTIVITY[idxRef.current % ACTIVITY.length]
      idxRef.current++
      setItems(prev => [...prev.slice(1), next])
    }, 2400)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="feed">
      {items.map((item, i) => (
        <div key={item.detail} className="feed-item" style={{ '--fc': item.color } as React.CSSProperties}>
          <div className="feed-icon-wrap">{item.icon}</div>
          <div className="feed-body">
            <span className="feed-text">{item.text}</span>
            <span className="feed-detail">{item.detail}</span>
          </div>
          <div className="feed-dot" />
        </div>
      ))}
    </div>
  )
}

// ─── CSS ───────────────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #050508 !important; color: #F0F2FF !important; font-family: var(--font-body); -webkit-font-smoothing: antialiased; overflow-x: hidden; }

  :root {
    --blue: #1E5EFF; --blue-glow: rgba(30,94,255,0.5);
    --bg: #050508; --surface: #09090F; --card: #0C0C14;
    --border: rgba(255,255,255,0.07);
    --text: #F0F2FF; --muted: rgba(240,242,255,0.45); --subtle: rgba(240,242,255,0.2);
  }

  /* ── Keyframes ── */
  @keyframes fadeUp   { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:none } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes ticker   { from { transform:translateX(0) } to { transform:translateX(-50%) } }
  @keyframes pulseDot { 0%,100% { opacity:1;transform:scale(1) } 50% { opacity:.4;transform:scale(.7) } }
  @keyframes scrollLn { 0%,100% { transform:scaleY(.3) translateY(-10px);opacity:.25 } 50% { transform:scaleY(1) translateY(0);opacity:1 } }
  @keyframes orbDrift { 0%,100% { transform:translate(0,0) scale(1);opacity:.18 } 33% { transform:translate(60px,-50px) scale(1.12);opacity:.28 } 66% { transform:translate(-40px,40px) scale(.9);opacity:.12 } }
  @keyframes orbDrift2{ 0%,100% { transform:translate(0,0) scale(1);opacity:.12 } 50% { transform:translate(-80px,60px) scale(1.18);opacity:.22 } }
  @keyframes orbDrift3{ 0%,100% { transform:translate(0,0) scale(1);opacity:.08 } 40% { transform:translate(50px,-30px) scale(1.1);opacity:.15 } }
  @keyframes blobMorph{ 0%,100% { border-radius:60% 40% 30% 70%/60% 30% 70% 40% } 33% { border-radius:30% 60% 70% 40%/50% 60% 30% 60% } 66% { border-radius:50% 60% 30% 60%/30% 60% 70% 40% } }
  @keyframes grainShift { 0%,100% { transform:translate(0,0) } 25% { transform:translate(-4%,4%) } 50% { transform:translate(4%,-4%) } 75% { transform:translate(-4%,-4%) } }
  @keyframes scanPulse { 0% { top:-10% } 100% { top:110% } }
  @keyframes cityFade  { 0% { opacity:0;transform:translateY(8px) } 100% { opacity:1;transform:none } }
  @keyframes glowPulse { 0%,100% { box-shadow:0 0 18px var(--mg,rgba(30,94,255,.4)) } 50% { box-shadow:0 0 40px var(--mg,rgba(30,94,255,.4)), 0 0 80px var(--mg,rgba(30,94,255,.2)) } }
  @keyframes flowPulse { 0% { left:-20%;opacity:0 } 20% { opacity:1 } 80% { opacity:1 } 100% { left:120%;opacity:0 } }
  @keyframes feedIn    { from { opacity:0;transform:translateX(16px) } to { opacity:1;transform:none } }
  @keyframes ctaBg     { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
  @keyframes goldSweep { 0% { transform:translateX(-100%) skewX(-15deg) } 100% { transform:translateX(300%) skewX(-15deg) } }
  @keyframes tileGlow  { 0%,100% { opacity:.7 } 50% { opacity:1 } }
  @keyframes osBlip    { 0%,90%,100% { opacity:1 } 95% { opacity:.3 } }
  @property --angle { syntax:'<angle>'; initial-value:0deg; inherits:false; }
  @keyframes spinBorder { to { --angle:360deg } }

  @media (prefers-reduced-motion:reduce) {
    *,*::before,*::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; }
  }

  /* ── Grain ── */
  .grain {
    position:fixed; inset:-50%; width:200%; height:200%; pointer-events:none; z-index:9999;
    opacity:.028;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    animation: grainShift .4s steps(2) infinite;
  }

  /* ── Nav ── */
  .nav {
    position:fixed; top:0; left:0; right:0; z-index:100;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 32px; height:64px;
    transition:background .3s, border-color .3s, backdrop-filter .3s;
  }
  .nav.scrolled {
    background:rgba(5,5,8,.9); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
    border-bottom:1px solid var(--border);
  }
  .nav-logo { display:flex; align-items:center; text-decoration:none; flex:1; }
  .nav-links { display:flex; align-items:center; gap:32px; }
  .nav-link { font-size:14px; color:var(--muted); text-decoration:none; font-weight:500; transition:color .2s; }
  .nav-link:hover { color:var(--text); }
  .nav-link-btn { background:none; border:none; cursor:pointer; display:flex; align-items:center; font-family:inherit; }
  .nav-dropdown-wrap { position:relative; }
  .nav-dropdown {
    position:absolute; top:calc(100% + 12px); left:-8px; min-width:220px;
    background:rgba(9,9,15,.96); border:1px solid var(--border); border-radius:14px;
    padding:8px; backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
    box-shadow:0 24px 64px rgba(0,0,0,.6);
    animation:fadeIn .15s ease;
  }
  .nav-drop-item {
    display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:9px;
    color:var(--muted); font-size:13px; font-weight:500; text-decoration:none;
    transition:background .15s, color .15s;
  }
  .nav-drop-item:hover { background:rgba(255,255,255,.05); color:var(--di-color,var(--text)); }
  .nav-drop-icon { font-size:16px; width:22px; text-align:center; }
  .nav-actions { display:flex; align-items:center; gap:8px; flex:1; justify-content:flex-end; }
  .btn-ghost-nav { padding:8px 18px; font-size:14px; font-weight:600; color:var(--muted); text-decoration:none; transition:color .2s; }
  .btn-ghost-nav:hover { color:var(--text); }
  .btn-nav-cta {
    padding:9px 20px; border-radius:9px; font-size:14px; font-weight:700;
    background:var(--blue); color:#fff; text-decoration:none;
    display:inline-flex; align-items:center; gap:6px;
    box-shadow:0 0 24px var(--blue-glow); transition:opacity .2s, transform .2s, box-shadow .2s;
  }
  .btn-nav-cta:hover { opacity:.9; transform:translateY(-1px); box-shadow:0 0 40px var(--blue-glow); }
  .nav-hamburger { display:none; background:none; border:none; color:var(--muted); cursor:pointer; }

  /* ── Mobile menu ── */
  .mmenu {
    position:fixed; inset:0; z-index:200;
    background:rgba(5,5,8,.98); backdrop-filter:blur(24px);
    display:flex; flex-direction:column; padding:24px;
    transform:translateX(100%); transition:transform .32s cubic-bezier(.4,0,.2,1);
  }
  .mmenu.open { transform:none; }
  .mmenu-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:40px; }
  .mmenu-link {
    font-family:var(--font-display); font-size:20px; font-weight:700;
    color:var(--muted); text-decoration:none; padding:12px 0;
    border-bottom:1px solid var(--border); transition:color .2s; display:block;
  }
  .mmenu-link:hover { color:var(--ml-color,var(--text)); }
  .mmenu-actions { display:flex; flex-direction:column; gap:12px; margin-top:32px; }
  .btn-full-primary {
    padding:14px; border-radius:12px; font-size:15px; font-weight:700;
    font-family:var(--font-display); background:var(--blue); color:#fff;
    text-decoration:none; display:block; text-align:center;
    box-shadow:0 0 32px var(--blue-glow);
  }
  .btn-full-outline {
    padding:14px; border-radius:12px; font-size:15px; font-weight:600;
    font-family:var(--font-display); border:1px solid var(--border); color:var(--muted);
    text-decoration:none; display:block; text-align:center;
  }

  /* ── Hero ── */
  .hero {
    min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:120px 24px 80px; text-align:center; position:relative; overflow:hidden;
  }
  .hero-grid {
    position:absolute; inset:0; pointer-events:none;
    background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);
    background-size:72px 72px;
    mask-image:radial-gradient(ellipse 80% 60% at 50% 20%, black 0%, transparent 100%);
    -webkit-mask-image:radial-gradient(ellipse 80% 60% at 50% 20%, black 0%, transparent 100%);
  }
  .hero-orb { position:absolute; pointer-events:none; border-radius:50%; filter:blur(1px); }
  .hero-orb-1 { top:-20%; left:50%; transform:translateX(-50%); width:1000px; height:800px;
    background:radial-gradient(ellipse, rgba(30,94,255,.22) 0%,transparent 65%); animation:orbDrift 20s ease-in-out infinite; }
  .hero-orb-2 { top:25%; left:-5%; width:600px; height:600px;
    background:radial-gradient(ellipse,rgba(139,92,246,.14) 0%,transparent 70%);
    animation:blobMorph 14s ease-in-out infinite,orbDrift2 22s ease-in-out infinite; }
  .hero-orb-3 { top:10%; right:-2%; width:520px; height:520px;
    background:radial-gradient(ellipse,rgba(0,229,255,.1) 0%,transparent 70%);
    animation:blobMorph 11s ease-in-out 4s infinite,orbDrift3 18s ease-in-out 6s infinite; }
  .hero-orb-4 { bottom:-10%; right:20%; width:400px; height:400px;
    background:radial-gradient(ellipse,rgba(212,175,55,.07) 0%,transparent 70%);
    animation:orbDrift2 26s ease-in-out 3s infinite; }
  .hero-scanline {
    position:absolute; left:0; right:0; height:1px; pointer-events:none;
    background:linear-gradient(90deg, transparent, rgba(30,94,255,.3), rgba(0,229,255,.2), transparent);
    animation:scanPulse 8s linear infinite;
  }

  .hero-inner { position:relative; z-index:2; max-width:880px; }

  .hero-badge {
    display:inline-flex; align-items:center; gap:10px;
    padding:6px 18px 6px 10px; border-radius:100px;
    border:1px solid rgba(30,94,255,.28); background:rgba(30,94,255,.07);
    font-size:12px; font-weight:700; color:rgba(100,160,255,.9);
    letter-spacing:.07em; text-transform:uppercase; margin-bottom:36px;
    position:relative; overflow:hidden;
    animation:fadeUp .7s ease both;
  }
  .hero-badge::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(30,94,255,.2),transparent);
    animation:goldSweep 4s ease-in-out 2s infinite;
  }
  .badge-pulse {
    width:7px; height:7px; border-radius:50%; background:#1E5EFF;
    box-shadow:0 0 12px #1E5EFF; animation:pulseDot 1.8s infinite; flex-shrink:0;
  }

  .hero-h1 {
    font-family:var(--font-display);
    font-size:clamp(52px,9vw,108px); font-weight:900;
    line-height:.95; letter-spacing:-4px; color:var(--text);
    animation:fadeUp .7s ease .08s both;
  }
  .h1-os {
    display:block;
    background:linear-gradient(135deg,#5B8AFF 0%,#1E5EFF 40%,#8B5CF6 70%,#00E5FF 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    background-size:200% 200%;
    animation:ctaBg 6s ease infinite;
  }
  .h1-running { font-size:.38em; font-weight:500; letter-spacing:-.5px; color:var(--muted); display:block; margin-top:8px; }
  .h1-city {
    font-size:.38em; font-weight:900; letter-spacing:0; color:#00E5FF;
    display:inline-block;
    transition:opacity .35s ease, transform .35s ease;
    text-shadow:0 0 40px rgba(0,229,255,.5);
  }

  .hero-sub {
    margin-top:28px; font-size:clamp(16px,2.2vw,20px);
    color:var(--muted); max-width:580px; margin-left:auto; margin-right:auto;
    line-height:1.75;
    animation:fadeUp .7s ease .18s both;
  }

  .hero-cta {
    display:flex; gap:12px; margin-top:44px; justify-content:center; flex-wrap:wrap;
    animation:fadeUp .7s ease .28s both;
  }
  .btn-hero-primary {
    padding:16px 34px; border-radius:13px; font-size:16px; font-weight:800;
    font-family:var(--font-display);
    background:linear-gradient(135deg,#2B6FFF,#1E5EFF,#7C3AED);
    background-size:200% 200%; animation:ctaBg 4s ease infinite;
    color:#fff; text-decoration:none;
    display:inline-flex; align-items:center; gap:9px;
    box-shadow:0 0 48px rgba(30,94,255,.5), 0 0 96px rgba(30,94,255,.15);
    transition:transform .25s, box-shadow .25s;
  }
  .btn-hero-primary:hover { transform:translateY(-3px) scale(1.02); box-shadow:0 0 72px rgba(30,94,255,.65), 0 0 120px rgba(30,94,255,.2); }
  .btn-hero-ghost {
    padding:16px 32px; border-radius:13px; font-size:16px; font-weight:600;
    font-family:var(--font-display);
    border:1px solid rgba(255,255,255,.1); color:var(--muted);
    text-decoration:none; display:inline-flex; align-items:center;
    transition:border-color .2s, color .2s, transform .2s;
  }
  .btn-hero-ghost:hover { border-color:rgba(255,255,255,.25); color:var(--text); transform:translateY(-2px); }

  /* ── OS Preview ── */
  .hero-os-preview {
    margin-top:56px; border-radius:20px; overflow:hidden;
    border:1px solid rgba(255,255,255,.1);
    background:rgba(9,9,15,.85); backdrop-filter:blur(32px);
    box-shadow:0 32px 96px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.05) inset;
    animation:fadeUp .9s ease .4s both;
    max-width:820px; margin-left:auto; margin-right:auto;
  }
  .os-bar {
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 20px; border-bottom:1px solid rgba(255,255,255,.07);
    background:rgba(255,255,255,.03);
  }
  .os-dots { display:flex; gap:6px; }
  .os-dots span { width:10px; height:10px; border-radius:50%; display:block; }
  .os-title { font-size:12px; font-weight:600; color:var(--muted); letter-spacing:.04em; }
  .os-live { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:800; color:#22C55E; letter-spacing:.1em; }
  .os-live-dot { width:5px; height:5px; border-radius:50%; background:#22C55E; box-shadow:0 0 8px #22C55E; animation:pulseDot 1.4s infinite; }
  .os-grid {
    display:grid; grid-template-columns:repeat(3,1fr);
    gap:1px; background:rgba(255,255,255,.06);
  }
  .os-tile {
    padding:18px 20px; background:var(--card);
    display:flex; align-items:center; gap:14px;
    cursor:default; transition:background .2s;
    position:relative; overflow:hidden;
  }
  .os-tile:hover { background:#10101C; }
  .os-tile::before {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background:var(--ot-color,#1E5EFF); opacity:.6;
  }
  .os-tile-icon { font-size:22px; flex-shrink:0; }
  .os-tile-body { flex:1; min-width:0; }
  .os-tile-name { font-size:11px; font-weight:700; color:var(--muted); letter-spacing:.03em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .os-tile-stat { font-size:16px; font-weight:900; color:var(--ot-color,#1E5EFF); margin-top:2px; font-family:var(--font-display); }

  /* scroll line */
  .hero-scroll { display:flex; flex-direction:column; align-items:center; gap:10px; margin-top:60px; color:var(--subtle); font-size:10px; letter-spacing:.12em; text-transform:uppercase; animation:fadeUp .7s ease .5s both; }
  .hero-scroll-line { width:1px; height:44px; background:linear-gradient(transparent, rgba(30,94,255,.5)); animation:scrollLn 2.4s ease-in-out infinite; }

  /* ── Ticker ── */
  .ticker-wrap {
    padding:28px 0; overflow:hidden;
    border-top:1px solid rgba(0,229,255,.08); border-bottom:1px solid rgba(0,229,255,.08);
    background:linear-gradient(180deg,rgba(0,229,255,.03) 0%,transparent);
    position:relative;
  }
  .ticker-wrap::before, .ticker-wrap::after {
    content:''; position:absolute; top:0; bottom:0; width:120px; z-index:2; pointer-events:none;
  }
  .ticker-wrap::before { left:0; background:linear-gradient(to right,#050508,transparent); }
  .ticker-wrap::after  { right:0; background:linear-gradient(to left,#050508,transparent); }
  .ticker-track { display:flex; gap:10px; width:max-content; animation:ticker 36s linear infinite; }
  .ticker-track:hover { animation-play-state:paused; }
  .ticker-item {
    display:flex; align-items:center; gap:8px; padding:8px 20px; border-radius:100px;
    border:1px solid rgba(255,255,255,.09);
    background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(30,94,255,.03));
    font-size:12px; font-weight:700; color:rgba(240,242,255,.6);
    white-space:nowrap; font-family:var(--font-display); letter-spacing:.05em;
    transition:border-color .25s, color .25s;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.05);
  }
  .ticker-item:hover { border-color:rgba(0,229,255,.35); color:var(--text); }
  .ticker-dot { width:4px; height:4px; border-radius:50%; flex-shrink:0; }

  /* ── Section shell ── */
  .section { padding:100px 24px; max-width:1200px; margin:0 auto; }
  .sec-eyebrow {
    font-size:11px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#1E5EFF;
    display:flex; align-items:center; gap:10px; margin-bottom:20px;
  }
  .sec-eyebrow::before { content:''; width:20px; height:2px; background:#1E5EFF; border-radius:1px; }
  .sec-h2 { font-family:var(--font-display); font-size:clamp(32px,4.5vw,58px); font-weight:900; letter-spacing:-2px; color:var(--text); line-height:1.0; max-width:700px; }
  .sec-h2-accent {
    background:linear-gradient(135deg,#5B8AFF,#1E5EFF,#8B5CF6);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .sec-sub { margin-top:20px; font-size:17px; color:var(--muted); max-width:560px; line-height:1.75; }

  /* ── Module cards ── */
  .mod-grid {
    display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:60px;
  }
  .mod-card {
    background:var(--card); border:1px solid var(--mb,rgba(255,255,255,.07));
    border-radius:20px; padding:28px; position:relative; overflow:hidden;
    cursor:default; transition:border-color .3s, transform .3s, box-shadow .3s;
    will-change:transform;
  }
  .mod-card::before {
    content:''; position:absolute; inset:-1px; border-radius:21px; z-index:-1;
    background:conic-gradient(from var(--angle), var(--mc), transparent 40%, transparent 60%, var(--mc));
    opacity:0; transition:opacity .4s;
    animation:spinBorder 3s linear infinite;
  }
  .mod-card:hover { transform:translateY(-4px); box-shadow:0 0 0 1px var(--mb), 0 20px 60px rgba(0,0,0,.4), 0 0 40px var(--mg); border-color:var(--mc); }
  .mod-card:hover::before { opacity:.25; }
  .mod-card::after {
    content:''; position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(ellipse 80% 50% at 50% 120%, var(--mbg,transparent) 0%, transparent 60%);
    opacity:0; transition:opacity .4s;
  }
  .mod-card:hover::after { opacity:1; }

  .mod-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
  .mod-emoji { font-size:32px; line-height:1; }
  .mod-stat-chip { text-align:right; }
  .mod-stat-v { display:block; font-family:var(--font-display); font-size:18px; font-weight:900; color:var(--mc); }
  .mod-stat-l { display:block; font-size:10px; color:var(--muted); font-weight:600; letter-spacing:.04em; }

  .mod-name { font-family:var(--font-display); font-size:16px; font-weight:900; color:var(--text); margin-bottom:6px; }
  .mod-tagline { font-size:13px; color:var(--muted); margin-bottom:20px; line-height:1.55; }
  .mod-features { list-style:none; display:flex; flex-direction:column; gap:8px; margin-bottom:24px; }
  .mod-features li { display:flex; align-items:center; gap:8px; font-size:13px; color:rgba(240,242,255,.65); }
  .mod-check { color:var(--mc); font-size:12px; flex-shrink:0; }
  .mod-cta {
    display:inline-flex; align-items:center; font-size:13px; font-weight:700;
    color:var(--mc); text-decoration:none; transition:gap .2s;
  }
  .mod-cta:hover { gap:4px; }

  /* ── Flow / Connection ── */
  .flow-section { padding:80px 24px 100px; position:relative; overflow:hidden; }
  .flow-section .sec-eyebrow, .flow-section .sec-h2, .flow-section .sec-sub { display:block; text-align:center; margin-left:auto; margin-right:auto; }
  .flow-track {
    display:flex; align-items:flex-start; justify-content:center;
    gap:0; margin:0 auto; max-width:960px; position:relative; flex-wrap:wrap;
  }
  .flow-node-wrap { display:flex; flex-direction:column; align-items:center; position:relative; gap:10px; }
  .flow-node {
    width:64px; height:64px; border-radius:18px;
    border:1px solid var(--fn-color,#1E5EFF); background:rgba(5,5,8,.8);
    display:flex; align-items:center; justify-content:center; font-size:26px;
    transition:box-shadow .4s, transform .4s, border-color .4s;
    cursor:default; position:relative;
  }
  .flow-node-active {
    box-shadow:0 0 0 3px var(--fn-color), 0 0 40px var(--fn-glow);
    transform:scale(1.12);
    background:rgba(5,5,8,.95);
  }
  .flow-node-icon { font-size:26px; }
  .flow-node-label { font-size:13px; font-weight:800; color:var(--muted); transition:color .4s; white-space:nowrap; }
  .flow-node-sub { font-size:11px; color:var(--subtle); white-space:nowrap; }
  .flow-connector { position:absolute; top:32px; left:64px; right:auto; width:72px; height:1px; }
  .flow-line { position:absolute; inset:0; background:rgba(255,255,255,.12); }
  .flow-pulse {
    position:absolute; top:-2px; width:16px; height:5px; border-radius:3px;
    background:var(--fp-color,#1E5EFF); box-shadow:0 0 8px var(--fp-color,#1E5EFF);
    animation:flowPulse 1.4s ease-in-out infinite;
  }
  .flow-caption { text-align:center; margin-top:40px; font-size:14px; color:var(--subtle); }
  .flow-caption strong { color:#1E5EFF; }

  /* ── Activity feed ── */
  .activity-section { padding:80px 24px; background:linear-gradient(180deg,var(--surface) 0%,var(--bg) 100%); }
  .activity-inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; }
  .activity-left .sec-h2 { max-width:none; }
  .activity-left .sec-sub { max-width:none; }
  .btn-activity-cta {
    display:inline-flex; align-items:center; gap:8px; margin-top:32px;
    padding:12px 24px; border-radius:10px; font-size:14px; font-weight:700;
    border:1px solid rgba(30,94,255,.3); color:#1E5EFF; text-decoration:none;
    transition:background .2s, box-shadow .2s;
  }
  .btn-activity-cta:hover { background:rgba(30,94,255,.08); box-shadow:0 0 24px rgba(30,94,255,.15); }

  .feed { display:flex; flex-direction:column; gap:8px; }
  .feed-item {
    display:flex; align-items:center; gap:14px;
    background:var(--card); border:1px solid rgba(255,255,255,.06);
    border-left:2px solid var(--fc,#1E5EFF);
    border-radius:12px; padding:14px 16px;
    animation:feedIn .4s ease both;
    transition:border-color .3s;
  }
  .feed-item:hover { border-color:rgba(255,255,255,.12); border-left-color:var(--fc,#1E5EFF); }
  .feed-icon-wrap { font-size:20px; flex-shrink:0; }
  .feed-body { flex:1; min-width:0; }
  .feed-text { display:block; font-size:13px; font-weight:700; color:var(--text); margin-bottom:2px; }
  .feed-detail { display:block; font-size:11px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .feed-dot { width:5px; height:5px; border-radius:50%; background:var(--fc,#1E5EFF); box-shadow:0 0 6px var(--fc,#1E5EFF); flex-shrink:0; animation:pulseDot 2s infinite; }

  /* ── Stats ── */
  .stats-band {
    padding:80px 24px; background:var(--surface);
    border-top:1px solid var(--border); border-bottom:1px solid var(--border);
    position:relative; overflow:hidden;
  }
  .stats-band::before {
    content:''; position:absolute; top:0; left:50%; transform:translateX(-50%);
    width:600px; height:1px;
    background:linear-gradient(to right,transparent,rgba(30,94,255,.5),transparent);
  }
  .stats-inner { max-width:960px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); gap:40px; text-align:center; }
  .stat-item { position:relative; }
  .stat-item:not(:last-child)::after { content:''; position:absolute; right:-20px; top:20%; bottom:20%; width:1px; background:var(--border); }
  .stat-val { font-family:var(--font-display); font-size:clamp(40px,5vw,60px); font-weight:900; color:var(--text); letter-spacing:-2px; line-height:1; }
  .stat-unit { color:#1E5EFF; font-size:.5em; letter-spacing:0; }
  .stat-label { font-size:13px; color:var(--muted); margin-top:10px; line-height:1.5; max-width:180px; margin-left:auto; margin-right:auto; }

  /* ── Testimonials ── */
  .testimonials-section { padding-bottom:100px; }
  .testimonials-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:48px; }
  .t-card {
    background:rgba(255,255,255,.028); border:1px solid rgba(255,255,255,.07); border-radius:16px;
    padding:28px 24px; display:flex; flex-direction:column; gap:20px;
  }
  .t-quote { font-size:14px; line-height:1.8; color:rgba(240,242,255,.55); font-style:italic; }
  .t-quote::before { content:'"'; color:#1E5EFF; font-size:22px; font-style:normal; line-height:1; display:block; margin-bottom:8px; }
  .t-handle { font-size:11px; font-weight:800; color:rgba(240,242,255,.25); letter-spacing:.08em; text-transform:uppercase; }
  .t-anon-note { text-align:center; font-size:12px; color:rgba(240,242,255,.18); margin-top:28px; }

  /* ── CTA ── */
  .cta-section { padding:130px 24px; text-align:center; position:relative; overflow:hidden; }
  .cta-orb { position:absolute; pointer-events:none; border-radius:50%; filter:blur(1px); }
  .cta-orb-1 { top:-20%; left:50%; transform:translateX(-50%); width:900px; height:700px; background:radial-gradient(ellipse,rgba(30,94,255,.12) 0%,transparent 65%); animation:orbDrift 22s ease-in-out infinite; }
  .cta-orb-2 { top:30%; right:-10%; width:500px; height:500px; background:radial-gradient(ellipse,rgba(139,92,246,.08) 0%,transparent 70%); animation:orbDrift2 18s ease-in-out 3s infinite; }
  .cta-orb-3 { bottom:-10%; left:-5%; width:400px; height:400px; background:radial-gradient(ellipse,rgba(0,229,255,.07) 0%,transparent 70%); animation:orbDrift3 24s ease-in-out 6s infinite; }
  .cta-inner { position:relative; z-index:1; }
  .cta-badge {
    display:inline-flex; align-items:center; gap:8px; margin-bottom:32px;
    padding:6px 18px; border-radius:100px;
    border:1px solid rgba(255,199,69,.28); background:rgba(255,199,69,.07);
    font-size:11px; font-weight:800; color:#D4A017; letter-spacing:.1em; text-transform:uppercase;
  }
  .cta-h2 {
    font-family:var(--font-display); font-size:clamp(52px,8vw,100px); font-weight:900;
    letter-spacing:-3px; color:var(--text); line-height:.95; margin-bottom:24px;
  }
  .cta-h2-accent {
    background:linear-gradient(135deg,#FFC745,#FF9500,#FF5F00);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .cta-sub { font-size:18px; color:var(--muted); max-width:480px; margin:0 auto 48px; line-height:1.7; }
  .cta-modules { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-bottom:48px; }
  .cta-module-pill {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 18px; border-radius:100px; font-size:13px; font-weight:700;
    border:1px solid var(--cp-color); color:var(--cp-color);
    background:rgba(5,5,8,.5); text-decoration:none;
    transition:background .2s, box-shadow .2s, transform .2s;
  }
  .cta-module-pill:hover { background:rgba(255,255,255,.05); box-shadow:0 0 20px var(--cp-glow); transform:translateY(-2px); }
  .btn-cta-main {
    display:inline-flex; align-items:center; gap:10px;
    padding:18px 44px; border-radius:14px; font-size:17px; font-weight:900;
    font-family:var(--font-display);
    background:linear-gradient(135deg,#2B6FFF,#1E5EFF,#7C3AED);
    background-size:200% 200%; animation:ctaBg 4s ease infinite;
    color:#fff; text-decoration:none;
    box-shadow:0 0 60px rgba(30,94,255,.5), 0 0 120px rgba(30,94,255,.15);
    transition:transform .25s, box-shadow .25s;
  }
  .btn-cta-main:hover { transform:translateY(-4px) scale(1.02); box-shadow:0 0 80px rgba(30,94,255,.65), 0 0 160px rgba(30,94,255,.2); }
  .cta-tagline { margin-top:28px; font-size:12px; font-weight:900; letter-spacing:.25em; color:rgba(30,94,255,.5); font-family:var(--font-display); }

  /* ── WA button ── */
  .wa-btn {
    position:fixed; bottom:24px; right:24px; z-index:50;
    display:flex; align-items:center; gap:10px;
    background:#25D366; color:#000; border-radius:50px; padding:12px 20px 12px 14px;
    text-decoration:none; font-family:var(--font-display); font-weight:700; font-size:14px;
    box-shadow:0 4px 24px rgba(37,211,102,.4);
    transition:transform .2s, box-shadow .2s;
  }
  .wa-btn:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(37,211,102,.5); }

  /* ── Footer ── */
  .footer { border-top:1px solid var(--border); }
  .footer-inner {
    max-width:1200px; margin:0 auto; padding:40px 24px;
    display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;
  }
  .footer-brand { display:flex; align-items:center; text-decoration:none; }
  .footer-copy { font-size:13px; color:var(--subtle); }
  .footer-links { display:flex; gap:20px; flex-wrap:wrap; }
  .footer-link { color:var(--subtle); font-size:13px; text-decoration:none; transition:color .2s; }
  .footer-link:hover { color:var(--muted); }

  /* ── Responsive ── */
  @media (max-width:1100px) { .stats-inner { grid-template-columns:repeat(2,1fr); } .stat-item:nth-child(2)::after { display:none; } }
  @media (max-width:960px) {
    .mod-grid { grid-template-columns:repeat(2,1fr); }
    .activity-inner { grid-template-columns:1fr; gap:40px; }
    .flow-track { gap:4px; }
    .flow-connector { width:40px; }
  }
  @media (max-width:768px) {
    .nav-links, .nav-actions { display:none; }
    .nav-hamburger { display:block; }
    .hero { padding:80px 16px 48px; }
    .hero-h1 { font-size:clamp(44px,12vw,64px); letter-spacing:-2px; }
    .hero-sub { font-size:15px; }
    .hero-cta { flex-direction:column; align-items:stretch; }
    .btn-hero-primary, .btn-hero-ghost { justify-content:center; }
    .hero-os-preview { display:none; }
    .hero-scroll { display:none; }
    .os-grid { grid-template-columns:repeat(2,1fr); }
    .mod-grid { grid-template-columns:1fr; }
    .testimonials-grid { grid-template-columns:1fr; }
    .stats-inner { grid-template-columns:repeat(2,1fr); }
    .section { padding:60px 16px; }
    .flow-track { flex-wrap:wrap; justify-content:center; gap:8px; }
    .flow-connector { display:none; }
    .cta-h2 { font-size:clamp(42px,10vw,64px); }
    .footer-inner { flex-direction:column; text-align:center; }
    .footer-links { justify-content:center; }
  }
  @media (max-width:480px) {
    .stats-inner { grid-template-columns:1fr 1fr; gap:20px; }
    .stat-item::after { display:none; }
  }
`

// ─── Main ──────────────────────────────────────────────────────────────────

export default function HomeClient() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cityIdx, setCityIdx] = useState(0)
  const [cityVisible, setCityVisible] = useState(true)
  const [flowActive, setFlowActive] = useState(0)
  const [productsOpen, setProductsOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setCityVisible(false)
      setTimeout(() => { setCityIdx(i => (i + 1) % CITIES.length); setCityVisible(true) }, 350)
    }, 2000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setFlowActive(i => (i + 1) % FLOW.length), 1200)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <style>{CSS}</style>
      <div className="grain" aria-hidden="true" />

      {/* ── Nav ── */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <Link href="/" className="nav-logo"><TikkitXLogo size="md" /></Link>
        <div className="nav-links">
          <div
            className="nav-dropdown-wrap"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <span className="nav-link nav-link-btn" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Platform <ChevronDown size={12} style={{ opacity: 0.5 }} />
            </span>
            {productsOpen && (
              <div className="nav-dropdown">
                {MODULES.map(m => (
                  <Link key={m.id} href={m.href} className="nav-drop-item" style={{ '--di-color': m.color } as React.CSSProperties}>
                    <span className="nav-drop-icon">{m.icon}</span>
                    <span>{m.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/explore"       className="nav-link">Explore Events</Link>
          <Link href="/how-it-works"  className="nav-link">How it works</Link>
        </div>
        <div className="nav-actions">
          <Link href="/auth/login" className="btn-ghost-nav">Log in</Link>
          <Link href="/auth/login?flow=organizer-signup" className="btn-nav-cta">Get started <ArrowRight size={14} /></Link>
        </div>
        <button className="nav-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>
      </nav>

      {/* ── Mobile menu ── */}
      <div className={`mmenu ${menuOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="mmenu-header">
          <TikkitXLogo size="md" />
          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }} onClick={() => setMenuOpen(false)} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        {MODULES.map(m => (
          <Link key={m.id} href={m.href} className="mmenu-link" onClick={() => setMenuOpen(false)}
            style={{ '--ml-color': m.color } as React.CSSProperties}>
            {m.icon} {m.name}
          </Link>
        ))}
        <Link href="/explore"      className="mmenu-link" onClick={() => setMenuOpen(false)}>🔍 Explore Events</Link>
        <Link href="/how-it-works" className="mmenu-link" onClick={() => setMenuOpen(false)}>⚡ How it works</Link>
        <div className="mmenu-actions">
          <Link href="/auth/login?flow=organizer-signup" className="btn-full-primary" onClick={() => setMenuOpen(false)}>Get started free</Link>
          <Link href="/auth/login" className="btn-full-outline" onClick={() => setMenuOpen(false)}>Log in</Link>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orb hero-orb-1" aria-hidden="true" />
        <div className="hero-orb hero-orb-2" aria-hidden="true" />
        <div className="hero-orb hero-orb-3" aria-hidden="true" />
        <div className="hero-orb hero-orb-4" aria-hidden="true" />
        <div className="hero-scanline" aria-hidden="true" />

        <div className="hero-inner">
          <div className="hero-badge">
            <span className="badge-pulse" />
            The Complete Event Operating System
          </div>

          <h1 className="hero-h1">
            <span className="h1-os">Event OS</span>
            <span className="h1-running">Running in </span>
            <span className="h1-city" style={{ opacity: cityVisible ? 1 : 0, transform: cityVisible ? 'none' : 'translateY(8px)' }}>
              {CITIES[cityIdx]}
            </span>
          </h1>

          <p className="hero-sub">
            Six modules. One platform. Every organiser, vendor, venue, artist, and guest — connected through TIKKIT X.
          </p>

          <div className="hero-cta">
            <Link href="/auth/login?flow=organizer-signup" className="btn-hero-primary">
              Start for free <ArrowRight size={17} />
            </Link>
            <a href="#platform" className="btn-hero-ghost">See all modules ↓</a>
          </div>

          {/* OS Dashboard Preview */}
          <div className="hero-os-preview">
            <div className="os-bar">
              <div className="os-dots">
                <span style={{ background: '#FF5F57' }} />
                <span style={{ background: '#FFBD2E' }} />
                <span style={{ background: '#28C840' }} />
              </div>
              <span className="os-title">TIKKIT X — Platform Dashboard</span>
              <div className="os-live"><span className="os-live-dot" />LIVE</div>
            </div>
            <div className="os-grid">
              {MODULES.map(m => (
                <div key={m.id} className="os-tile" style={{ '--ot-color': m.color } as React.CSSProperties}>
                  <span className="os-tile-icon">{m.icon}</span>
                  <div className="os-tile-body">
                    <div className="os-tile-name">{m.name.replace('TIKKIT X ', '').replace(' Management', ' Mgmt').replace(' & Experiences', '')}</div>
                    <div className="os-tile-stat">{m.stat.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-scroll" aria-hidden="true">
          <div className="hero-scroll-line" />
          <span>scroll</span>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((label, i) => {
            const colors = ['#1E5EFF', '#8B5CF6', '#D4AF37', '#00E5FF', '#22C55E', '#F97316']
            const c = colors[i % colors.length]
            return (
              <div key={i} className="ticker-item">
                <span className="ticker-dot" style={{ background: c, boxShadow: `0 0 5px ${c}` }} />
                {label}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Platform modules ── */}
      <section className="section" id="platform">
        <div className="sec-eyebrow">The Platform</div>
        <h2 className="sec-h2">Six modules.<br /><span className="sec-h2-accent">One operating system.</span></h2>
        <p className="sec-sub">
          Every piece of the live events industry — events, vendors, venues, artists, guests, analytics.
          No integrations. No duct tape. No group chats.
        </p>
        <div className="mod-grid">
          {MODULES.map((m, i) => <ModuleCard key={m.id} mod={m} index={i} />)}
        </div>
      </section>

      {/* ── How it connects ── */}
      <section className="flow-section">
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="sec-eyebrow" style={{ justifyContent: 'center' }}>How it connects</div>
          <h2 className="sec-h2" style={{ textAlign: 'center', margin: '0 auto 16px', maxWidth: 600 }}>Every night has five moving parts.</h2>
          <p className="sec-sub" style={{ textAlign: 'center', margin: '0 auto 64px', maxWidth: 480 }}>
            TIKKIT X is the thread that runs through all of them.
          </p>
          <div className="flow-track">
            {FLOW.map((node, i) => (
              <div key={node.label} className="flow-node-wrap">
                <div
                  className={`flow-node ${flowActive === i ? 'flow-node-active' : ''}`}
                  style={{ '--fn-color': node.color, '--fn-glow': `${node.color}50` } as React.CSSProperties}
                >
                  {node.icon}
                </div>
                <span className="flow-node-label" style={{ color: flowActive === i ? node.color : undefined }}>{node.label}</span>
                <span className="flow-node-sub">{node.sub}</span>
                {i < FLOW.length - 1 && (
                  <div className="flow-connector">
                    <div className="flow-line" />
                    <div className="flow-pulse" style={{ '--fp-color': node.color, animationDelay: `${i * 0.24}s` } as React.CSSProperties} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="flow-caption">orchestrated via <strong>TIKKIT X</strong></p>
        </div>
      </section>

      {/* ── Live activity ── */}
      <section className="activity-section">
        <div className="activity-inner">
          <div className="activity-left">
            <div className="sec-eyebrow">Live Platform</div>
            <h2 className="sec-h2">It&apos;s already running.</h2>
            <p className="sec-sub">
              Enquiries being sent. Tickets being sold. Venues being booked.
              Artists being confirmed. All right now.
            </p>
            <Link href="/explore" className="btn-activity-cta">
              Explore live events <ArrowRight size={15} />
            </Link>
          </div>
          <div className="activity-right">
            <LiveFeed />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-band">
        <div className="stats-inner">
          <StatItem target={6}  unit=""    label="Platform modules. One login, one platform." />
          <StatItem target={2}  unit="min" label="From blank page to your event going live." />
          <StatItem target={0}  unit="%"   label="Commission on venue and artist bookings." />
          <StatItem target={48} unit="h"   label="To onboard your venue or vendor business." />
        </div>
      </div>

      {/* ── Testimonials ── */}
      <section className="section testimonials-section">
        <div className="sec-eyebrow">From the scene</div>
        <h2 className="sec-h2">Off the record.<br />On the night.</h2>
        <p className="sec-sub">
          TIKKIT X was built in underground rooms before it ever touched a mainstream venue.
          The people who tested it prefer to stay anonymous — that&apos;s the nature of the scene.
        </p>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => <TestimonialCard key={i} quote={t.quote} handle={t.handle} index={i} />)}
        </div>
        <p className="t-anon-note">Names withheld by request. Quotes shared with permission.</p>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-orb cta-orb-1" aria-hidden="true" />
        <div className="cta-orb cta-orb-2" aria-hidden="true" />
        <div className="cta-orb cta-orb-3" aria-hidden="true" />
        <div className="cta-inner">
          <div className="cta-badge"><Zap size={12} color="#FFC745" style={{ flexShrink: 0 }} /> Free to start. Always.</div>
          <h2 className="cta-h2">
            The night<br />
            <span className="cta-h2-accent">starts here.</span>
          </h2>
          <p className="cta-sub">
            Whether you&apos;re an organiser, vendor, venue, or artist —
            TIKKIT X is how the scene runs itself.
          </p>
          <div className="cta-modules">
            {MODULES.map(m => (
              <Link key={m.id} href={m.href} className="cta-module-pill"
                style={{ '--cp-color': m.color, '--cp-glow': m.glow } as React.CSSProperties}>
                {m.icon} {m.name}
              </Link>
            ))}
          </div>
          <Link href="/auth/login?flow=organizer-signup" className="btn-cta-main">
            Get started — it&apos;s free <ArrowRight size={18} />
          </Link>
          <p className="cta-tagline">PLAN. PUSH. PARTY.</p>
        </div>
      </section>

      {/* ── WhatsApp ── */}
      <a
        href="https://wa.me/923322028451?text=Hi%20TIKKIT%20X%20%E2%80%94%20I%20want%20to%20run%20an%20event"
        target="_blank" rel="noopener noreferrer"
        aria-label="Chat with TIKKIT X on WhatsApp"
        className="wa-btn"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.549 4.104 1.508 5.836L.057 23.07a.75.75 0 0 0 .92.921l5.233-1.451A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.956 0-3.793-.497-5.388-1.371l-.371-.209-3.849 1.068 1.067-3.847-.217-.383A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
        Chat with us
      </a>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <Link href="/" className="footer-brand"><TikkitXLogo size="sm" /></Link>
          <p className="footer-copy">© {new Date().getFullYear()} TIKKIT X — The Complete Event OS · Built in Pakistan 🇵🇰</p>
          <div className="footer-links">
            <Link href="/how-it-works" className="footer-link">How it works</Link>
            <Link href="/explore"      className="footer-link">Explore</Link>
            <Link href="/about"        className="footer-link">About</Link>
            <Link href="/pricing"      className="footer-link">Pricing</Link>
            <Link href="/contact"      className="footer-link">Contact</Link>
            <Link href="/terms"        className="footer-link">Terms</Link>
            <Link href="/privacy"      className="footer-link">Privacy</Link>
            <Link href="/auth/login"   className="footer-link">Log in</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
