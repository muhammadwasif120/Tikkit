'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin, Clock, Users, Zap, QrCode, CreditCard,
  ArrowRight, ChevronRight, Sparkles, Star,
} from 'lucide-react'
import PublicNav from '@/components/layout/PublicNav'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

/* ─── Types ──────────────────────────────────────────────────────── */
type Category = { id: string; name: string; icon: string; color: string }
type Organizer = { full_name: string | null; company_name: string | null; username: string | null; logo_url: string | null }
type Event = {
  id: string; slug?: string | null; title: string; date_start: string
  cover_image_url: string | null; venue_name: string | null
  ticket_price: number | null; registration_mode: string
  category_id: string | null; registered_count: number; capacity: number | null
  organizer: Organizer | null
}

/* ─── Helpers ────────────────────────────────────────────────────── */
const GRADIENTS = [
  'linear-gradient(135deg,#0F2027,#203A43,#2C5364)',
  'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
  'linear-gradient(135deg,#200122,#6f0000)',
  'linear-gradient(135deg,#0d0d0d,#1a3a1a)',
  'linear-gradient(135deg,#1f0033,#2d0050)',
  'linear-gradient(135deg,#001233,#023e8a)',
]
const grad = (id: string) => GRADIENTS[id.charCodeAt(0) % GRADIENTS.length]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}

/* ─── Responsive CSS ─────────────────────────────────────────────── */
const CSS = `
  @keyframes fadeUp      { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulseDot    { 0%,100% { box-shadow:0 0 6px #1E5EFF; opacity:1; } 50% { box-shadow:0 0 14px #1E5EFF; opacity:0.6; } }
  @keyframes orbDrift    { 0%,100% { transform:translateX(-50%) translateY(0); } 50% { transform:translateX(-50%) translateY(-28px); } }
  @keyframes tickerCats  { from { transform:translateX(0); } to { transform:translateX(-50%); } }

  .pe-wrap { background:#080A10; min-height:100vh; padding-top:64px; font-family:var(--font-body); }

  /* Container */
  .pe-container { max-width:1200px; margin:0 auto; padding:0 16px; }

  /* ── Hero ── */
  .pe-hero {
    position:relative; overflow:hidden;
    display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
    text-align:center; padding:48px 24px 64px;
  }
  .pe-hero-grid {
    position:absolute; inset:0; pointer-events:none;
    background-image:
      linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
      linear-gradient(90deg,rgba(255,255,255,0.022) 1px, transparent 1px);
    background-size:64px 64px;
    mask-image:radial-gradient(ellipse 85% 65% at 50% 20%, black 0%, transparent 100%);
    -webkit-mask-image:radial-gradient(ellipse 85% 65% at 50% 20%, black 0%, transparent 100%);
  }
  .pe-hero-orb-1 {
    position:absolute; top:-15%; left:50%; transform:translateX(-50%);
    width:900px; height:700px; pointer-events:none;
    background:radial-gradient(ellipse, rgba(30,94,255,0.2) 0%, transparent 68%);
    animation:orbDrift 18s ease-in-out infinite;
  }
  .pe-hero-orb-2 {
    position:absolute; top:30%; left:5%;
    width:500px; height:500px; pointer-events:none; border-radius:50%;
    background:radial-gradient(ellipse, rgba(168,85,247,0.1) 0%, transparent 70%);
  }
  .pe-hero-orb-3 {
    position:absolute; top:15%; right:2%;
    width:480px; height:480px; pointer-events:none; border-radius:50%;
    background:radial-gradient(ellipse, rgba(34,197,94,0.07) 0%, transparent 70%);
  }
  .pe-hero-content { position:relative; z-index:2; }
  .pe-hero-badge {
    display:inline-flex; align-items:center; gap:10px;
    padding:6px 16px; border-radius:100px;
    border:1px solid rgba(30,94,255,0.3); background:rgba(30,94,255,0.08);
    font-size:12px; font-weight:700; color:#6B9FFF;
    letter-spacing:0.07em; text-transform:uppercase;
    margin-bottom:28px; animation:fadeUp 0.7s ease both;
  }
  .pe-badge-dot {
    width:7px; height:7px; border-radius:50%;
    background:#1E5EFF; box-shadow:0 0 10px #1E5EFF;
    animation:pulseDot 2s infinite; flex-shrink:0;
  }
  .pe-hero-h1 {
    font-family:var(--font-display);
    font-size:clamp(40px,7.5vw,82px);
    font-weight:700; line-height:1.0; letter-spacing:-3px;
    color:white; margin:0; animation:fadeUp 0.7s ease 0.1s both;
  }
  .pe-hero-h1 .pe-accent {
    background:linear-gradient(135deg,#5B8AFF 0%,#1E5EFF 50%,#8B5CF6 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .pe-hero-sub {
    margin:22px auto 0; font-size:clamp(15px,2.2vw,19px);
    color:#9CA3AF; max-width:540px; line-height:1.75;
    animation:fadeUp 0.7s ease 0.2s both;
  }
  .pe-hero-cta {
    display:flex; gap:12px; margin-top:40px;
    flex-wrap:wrap; justify-content:center;
    animation:fadeUp 0.7s ease 0.3s both;
  }
  .pe-btn-primary {
    padding:15px 30px; border-radius:12px; font-size:15px; font-weight:700;
    background:#1E5EFF; color:white; text-decoration:none;
    display:inline-flex; align-items:center; gap:8px;
    box-shadow:0 0 40px rgba(30,94,255,0.45);
    transition:opacity 0.2s, transform 0.25s, box-shadow 0.25s;
    font-family:var(--font-display);
  }
  .pe-btn-primary:hover { opacity:0.9; transform:translateY(-2px); box-shadow:0 0 60px rgba(30,94,255,0.6); }
  .pe-btn-outline {
    padding:15px 30px; border-radius:12px; font-size:15px; font-weight:600;
    border:1px solid rgba(255,255,255,0.1); color:#9CA3AF; text-decoration:none;
    display:inline-flex; align-items:center; gap:8px;
    transition:border-color 0.2s, color 0.2s, transform 0.2s;
    font-family:var(--font-display);
  }
  .pe-btn-outline:hover { border-color:rgba(255,255,255,0.22); color:#F0F2FF; transform:translateY(-1px); }
  .pe-hero-stats {
    display:flex; gap:36px; margin-top:44px; justify-content:center;
    animation:fadeUp 0.7s ease 0.4s both;
  }
  .pe-stat-n { color:white; font-size:26px; font-weight:900; margin:0 0 3px; font-family:var(--font-display); }
  .pe-stat-l { color:#4B5563; font-size:11px; margin:0; font-weight:600; letter-spacing:0.5px; }

  /* Category ribbon — auto-cycling ticker */
  .pe-cats-wrap {
    position:relative; overflow:hidden; margin-bottom:24px;
  }
  .pe-cats-wrap::before, .pe-cats-wrap::after {
    content:''; position:absolute; top:0; bottom:0; width:56px; z-index:2; pointer-events:none;
  }
  .pe-cats-wrap::before { left:0;  background:linear-gradient(to right, #080A10 0%, transparent 100%); }
  .pe-cats-wrap::after  { right:0; background:linear-gradient(to left,  #080A10 0%, transparent 100%); }
  .pe-cats-track {
    display:flex; gap:8px; width:max-content;
    animation:tickerCats 28s linear infinite;
    padding:4px 0;
  }
  .pe-cats-track:hover { animation-play-state:paused; }

  /* Events grid — mobile: single column */
  .pe-featured-grid { display:grid; grid-template-columns:1fr; gap:14px; margin-bottom:14px; }
  .pe-events-grid   { display:grid; grid-template-columns:1fr; gap:12px; margin-bottom:14px; }

  /* Nudge — mobile: stack vertically */
  .pe-nudge { display:flex; flex-direction:column; gap:16px; border-radius:18px; padding:20px 18px; }
  .pe-nudge-row { display:flex; align-items:flex-start; gap:14px; }
  .pe-nudge-btn { width:100%; justify-content:center !important; }

  /* Why grid — mobile: 2 columns */
  .pe-why-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }

  /* CTA */
  .pe-cta-btns { display:flex; flex-direction:column; align-items:stretch; gap:12px; }
  .pe-cta-primary { width:100%; justify-content:center !important; }

  /* Mobile */
  @media (max-width:599px) {
    .pe-hero { min-height:auto; padding:48px 20px 40px; }
    .pe-hero-badge { font-size:10px; padding:5px 14px; margin-bottom:22px; }
    .pe-hero-h1 { font-size:clamp(34px,10vw,46px); letter-spacing:-1.5px; }
    .pe-hero-sub { margin-top:16px; font-size:15px; max-width:90%; }
    .pe-hero-cta { margin-top:28px; gap:10px; }
    .pe-btn-primary { padding:13px 24px; font-size:14px; }
    .pe-btn-outline { padding:13px 24px; font-size:14px; }
    .pe-hero-stats { margin-top:32px; gap:28px; }
    .pe-stat-n { font-size:24px; }
    .pe-stat-l { font-size:11px; }
  }

  /* Tablet+ */
  @media (min-width:600px) {
    .pe-container { padding:0 24px; }
    .pe-featured-grid { grid-template-columns:repeat(2,1fr); }
    .pe-events-grid   { grid-template-columns:repeat(2,1fr); }
    .pe-nudge { flex-direction:row; align-items:center; justify-content:space-between; padding:24px 28px; }
    .pe-nudge-row { align-items:center; }
    .pe-nudge-btn { width:auto !important; }
    .pe-cta-btns { flex-direction:row; justify-content:center; align-items:center; }
    .pe-cta-primary { width:auto !important; }
  }

  /* Desktop */
  @media (min-width:900px) {
    .pe-featured-grid { grid-template-columns:repeat(2,1fr); gap:16px; }
    .pe-events-grid   { grid-template-columns:repeat(3,1fr); gap:14px; }
    .pe-why-grid      { grid-template-columns:repeat(4,1fr); gap:12px; }
    .pe-nudge { padding:28px 32px; }
  }
`

/* ─── Hero visual (desktop) ──────────────────────────────────────── */
function HeroVisual({ events, catMap }: { events: Event[]; catMap: Record<string, Category> }) {
  const preview = events.slice(0, 3)
  return (
    <div style={{ position: 'relative', height: 360 }}>
      {/* Glow blob */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,94,255,0.18), transparent 70%)', pointerEvents: 'none' }} />

      {preview.map((ev, i) => {
        const cat = ev.category_id ? catMap[ev.category_id] ?? null : null
        const isFree = !ev.ticket_price || ev.ticket_price === 0
        const offsets = [
          { top: 0,    left: 40,  rotate: -4, zIndex: 1, scale: 0.88 },
          { top: 30,   left: 0,   rotate: 2,  zIndex: 3, scale: 1    },
          { top: 10,   left: 120, rotate: 5,  zIndex: 2, scale: 0.92 },
        ]
        const o = offsets[i]
        return (
          <div key={ev.id} style={{
            position: 'absolute',
            top: o.top,
            left: o.left,
            width: 260,
            borderRadius: 16,
            overflow: 'hidden',
            background: '#0C0E16',
            border: i === 1 ? '1px solid rgba(30,94,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
            boxShadow: i === 1 ? '0 8px 40px rgba(30,94,255,0.2)' : '0 4px 20px rgba(0,0,0,0.4)',
            transform: `rotate(${o.rotate}deg) scale(${o.scale})`,
            transformOrigin: 'center center',
            zIndex: o.zIndex,
          }}>
            <div style={{ height: 110, background: ev.cover_image_url ? `url(${ev.cover_image_url}) center/cover` : grad(ev.id), position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(12,14,22,0.9) 0%, transparent 60%)' }} />
              <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5 }}>
                {cat && <span style={{ background: `${cat.color}22`, border: `1px solid ${cat.color}40`, color: cat.color, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>{cat.icon} {cat.name}</span>}
                <span style={{ background: isFree ? 'rgba(34,197,94,0.85)' : 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20 }}>
                  {isFree ? 'FREE' : `PKR ${ev.ticket_price!.toLocaleString('en-PK')}`}
                </span>
              </div>
            </div>
            <div style={{ padding: '10px 12px 12px' }}>
              <p style={{ color: 'white', fontSize: 12, fontWeight: 800, margin: '0 0 6px', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</p>
              <p style={{ color: '#6B7280', fontSize: 10, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={9} color="#818CF8" /> {fmtDate(ev.date_start)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Event Card ─────────────────────────────────────────────────── */
function EventCard({ event, category, featured = false }: { event: Event; category: Category | null; featured?: boolean }) {
  const orgName = event.organizer?.company_name ?? event.organizer?.full_name ?? null
  const isFree = !event.ticket_price || event.ticket_price === 0
  const spotsLeft = event.capacity ? event.capacity - event.registered_count : null
  const almostFull = spotsLeft !== null && spotsLeft <= 10 && spotsLeft > 0

  return (
    <Link href={`/guest/explore/${event.slug || event.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div style={{
        background: '#0C0E16', borderRadius: 18,
        border: `1px solid ${featured ? 'rgba(30,94,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
        overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column',
        transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
        boxShadow: featured ? '0 0 30px rgba(30,94,255,0.08)' : 'none',
      }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(-4px)'
          el.style.boxShadow = featured ? '0 12px 40px rgba(30,94,255,0.22)' : '0 8px 32px rgba(0,0,0,0.5)'
          el.style.borderColor = featured ? 'rgba(30,94,255,0.55)' : 'rgba(255,255,255,0.15)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = featured ? '0 0 30px rgba(30,94,255,0.08)' : 'none'
          el.style.borderColor = featured ? 'rgba(30,94,255,0.3)' : 'rgba(255,255,255,0.07)'
        }}
      >
        {/* Cover */}
        <div style={{ height: featured ? 170 : 130, position: 'relative', flexShrink: 0, background: event.cover_image_url ? `url(${event.cover_image_url}) center/cover` : grad(event.id) }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(12,14,22,0.95) 0%, transparent 55%)' }} />
          <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {featured && (
                <span style={{ background: 'rgba(255,199,69,0.2)', border: '1px solid rgba(255,199,69,0.4)', color: '#FFC745', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 3, backdropFilter: 'blur(8px)' }}>
                  <Star size={8} fill="#FFC745" /> FEATURED
                </span>
              )}
              {category && (
                <span style={{ background: `${category.color}22`, border: `1px solid ${category.color}40`, color: category.color, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
                  {category.icon} {category.name}
                </span>
              )}
            </div>
            <span style={{ background: isFree ? 'rgba(34,197,94,0.85)' : 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, backdropFilter: 'blur(8px)', flexShrink: 0 }}>
              {isFree ? 'FREE' : `PKR ${event.ticket_price!.toLocaleString('en-PK')}`}
            </span>
          </div>
          {almostFull && (
            <div style={{ position: 'absolute', bottom: 8, left: 10, background: 'rgba(239,68,68,0.85)', borderRadius: 12, padding: '2px 8px', fontSize: 9, fontWeight: 800, color: 'white' }}>
              Only {spotsLeft} spots left!
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: 'white', fontSize: featured ? 16 : 14, fontWeight: 800, margin: '0 0 8px', fontFamily: 'var(--font-display)', letterSpacing: '-0.3px', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, flex: 1 }}>
            <span style={{ color: '#6B7280', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={10} color="#818CF8" /> {fmtDate(event.date_start)} · {fmtTime(event.date_start)}
            </span>
            {event.venue_name && (
              <span style={{ color: '#6B7280', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={10} color="#818CF8" /> {event.venue_name}
              </span>
            )}
            {event.capacity && (
              <span style={{ color: '#6B7280', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={10} color="#818CF8" /> {event.registered_count} / {event.capacity} registered
              </span>
            )}
            {orgName && <span style={{ color: '#4B5563', fontSize: 11, fontStyle: 'italic' }}>by {orgName}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', color: event.registration_mode === 'expression_of_interest' ? '#A855F7' : event.registration_mode === 'invite_only' ? '#4B5563' : '#1E5EFF' }}>
              {event.registration_mode === 'expression_of_interest' ? 'APPLY TO ATTEND' : event.registration_mode === 'invite_only' ? 'INVITE ONLY' : 'REGISTER FREE'}
            </span>
            <span style={{ color: '#818CF8', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>View <ChevronRight size={11} /></span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ─── Sign-up nudge ──────────────────────────────────────────────── */
function SignupNudge({ variant = 'default' }: { variant?: 'default' | 'gold' }) {
  const isGold = variant === 'gold'
  return (
    <div className="pe-nudge" style={{
      background: isGold
        ? 'linear-gradient(135deg, rgba(255,199,69,0.1), rgba(249,115,22,0.06))'
        : 'linear-gradient(135deg, rgba(30,94,255,0.12), rgba(168,85,247,0.07))',
      border: `1px solid ${isGold ? 'rgba(255,199,69,0.25)' : 'rgba(30,94,255,0.25)'}`,
    }}>
      <div className="pe-nudge-row">
        <div style={{ width: 42, height: 42, borderRadius: 13, background: isGold ? 'rgba(255,199,69,0.15)' : 'rgba(30,94,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={18} color={isGold ? '#FFC745' : '#1E5EFF'} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: 'white', fontSize: 15, fontWeight: 800, margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>
            {isGold ? 'Get personalised event picks' : 'Ready to RSVP?'}
          </p>
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {isGold
              ? 'Sign up once and Tikkit learns what events you love — automatically surfacing the best ones for you.'
              : 'Create a free account, RSVP in 30 seconds, and get your QR ticket instantly.'}
          </p>
        </div>
      </div>
      <Link href="/auth/login" className="pe-nudge-btn" style={{
        background: isGold ? '#FFC745' : '#1E5EFF', color: isGold ? '#0D0F18' : 'white',
        fontSize: 14, fontWeight: 700, textDecoration: 'none',
        padding: '11px 24px', borderRadius: 24,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        {isGold ? 'Get personalised feed' : 'Join free & RSVP'}
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}

/* ─── Why join strip ─────────────────────────────────────────────── */
const WHY = [
  { icon: Zap,        color: '#FFC745', title: 'RSVP in 30 seconds',  desc: 'Fill your name, hit confirm. QR ticket ready instantly.' },
  { icon: QrCode,     color: '#A855F7', title: 'One QR, one scan',    desc: 'Show your ticket at the door. No screenshots, no confusion.' },
  { icon: CreditCard, color: '#22C55E', title: 'Safe payments',       desc: 'JazzCash, EasyPaisa or bank transfer — all verified in-app.' },
  { icon: Sparkles,   color: '#1E5EFF', title: 'Your event feed',     desc: 'The more you explore, the smarter your recommendations get.' },
]

function WhyStrip() {
  return (
    <section style={{ padding: '64px 0 48px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ color: '#1E5EFF', fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', margin: '0 0 10px' }}>WHY TIKKIT</p>
        <h2 style={{ color: 'white', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, margin: '0 0 10px', fontFamily: 'var(--font-display)', letterSpacing: '-0.6px' }}>
          Your ticket to the scene.
        </h2>
        <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Free forever for guests. No credit card needed.</p>
      </div>
      <div className="pe-why-grid">
        {WHY.map(({ icon: Icon, color, title, desc }) => (
          <div key={title} style={{ background: '#0C0E16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '20px 18px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon size={18} color={color} />
            </div>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>{title}</p>
            <p style={{ color: '#6B7280', fontSize: 12, margin: 0, lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── Final CTA ──────────────────────────────────────────────────── */
function FinalCTA({ totalEvents }: { totalEvents: number }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(30,94,255,0.14), rgba(139,92,246,0.1))', border: '1px solid rgba(30,94,255,0.2)', borderRadius: 28, padding: 'clamp(40px,5vw,72px) clamp(24px,5vw,80px)', textAlign: 'center', marginBottom: 48 }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,94,255,0.2), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.15), transparent 70%)', pointerEvents: 'none' }} />
      <p style={{ color: '#818CF8', fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', margin: '0 0 16px' }}>JOIN THE SCENE</p>
      <h2 style={{ color: 'white', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, margin: '0 0 12px', fontFamily: 'var(--font-display)', letterSpacing: '-1px', lineHeight: 1.1 }}>
        {totalEvents}+ events. One free account.
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: 15, margin: '0 0 32px', lineHeight: 1.7 }}>
        RSVP instantly. Get your QR ticket.<br />Your personalised event feed awaits.
      </p>
      <div className="pe-cta-btns">
        <Link href="/auth/login" className="pe-cta-primary" style={{ background: '#1E5EFF', color: 'white', fontSize: 15, fontWeight: 700, textDecoration: 'none', padding: '14px 40px', borderRadius: 30, display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 0 32px rgba(30,94,255,0.4)' }}>
          Create free account <ArrowRight size={16} />
        </Link>
        <Link href="/auth/login" style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
          Already on Tikkit? <span style={{ color: '#818CF8', marginLeft: 4 }}>Sign in →</span>
        </Link>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function PublicExploreClient({ events, categories }: { events: Event[]; categories: Category[] }) {
  const [activeCat, setActiveCat] = useState<string | null>(null)

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const filtered = activeCat ? events.filter(e => e.category_id === activeCat) : events

  const featured = filtered.slice(0, 2)
  const rest     = filtered.slice(2)
  const restA    = rest.slice(0, 6)
  const restB    = rest.slice(6)

  return (
    <>
      <style>{CSS}</style>

      <PublicNav activePage="explore" />

      <div className="pe-wrap">

        {/* ── Hero ── */}
        <div className="pe-hero">
          <div className="pe-hero-grid" />
          <div className="pe-hero-orb-1" />
          <div className="pe-hero-orb-2" />
          <div className="pe-hero-orb-3" />

          <div className="pe-hero-content">
            <div className="pe-hero-badge">
              <span className="pe-badge-dot" />
              Upcoming events across Pakistan
            </div>

            <h1 className="pe-hero-h1">
              What's happening<br />
              <span className="pe-accent">near you</span>
            </h1>

            <p className="pe-hero-sub">
              Browse top events — from underground nights to massive concerts.
              RSVP free in 30 seconds.
            </p>

            <div className="pe-hero-cta">
              <Link href="/auth/login" className="pe-btn-primary">
                Join free <ArrowRight size={16} />
              </Link>
              <Link href="/auth/login" className="pe-btn-outline">
                Sign in
              </Link>
            </div>

            <div className="pe-hero-stats">
              {[
                { n: `${events.length}+`, label: 'live events' },
                { n: 'Free',              label: 'to sign up'  },
                { n: '30s',              label: 'to RSVP'     },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p className="pe-stat-n">{s.n}</p>
                  <p className="pe-stat-l">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="pe-container">

          {/* ── Category ribbon — auto-cycling ticker ── */}
          {categories.length > 0 && (
            <div className="pe-cats-wrap">
              <div className="pe-cats-track">
                {/* First set */}
                <button onClick={() => setActiveCat(null)} style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 22, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: !activeCat ? '#1E5EFF' : 'rgba(255,255,255,0.05)', border: `1px solid ${!activeCat ? '#1E5EFF' : 'rgba(255,255,255,0.08)'}`, color: !activeCat ? 'white' : '#9CA3AF', transition: 'all 0.15s' }}>
                  All events
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)} style={{ flexShrink: 0, padding: '7px 15px', borderRadius: 22, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: activeCat === cat.id ? `${cat.color}22` : 'rgba(255,255,255,0.05)', border: `1px solid ${activeCat === cat.id ? cat.color : 'rgba(255,255,255,0.08)'}`, color: activeCat === cat.id ? cat.color : '#9CA3AF', transition: 'all 0.15s' }}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
                {/* Duplicate set — seamless loop */}
                <button onClick={() => setActiveCat(null)} aria-hidden="true" style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 22, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: !activeCat ? '#1E5EFF' : 'rgba(255,255,255,0.05)', border: `1px solid ${!activeCat ? '#1E5EFF' : 'rgba(255,255,255,0.08)'}`, color: !activeCat ? 'white' : '#9CA3AF', transition: 'all 0.15s' }}>
                  All events
                </button>
                {categories.map(cat => (
                  <button key={`dup-${cat.id}`} onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)} aria-hidden="true" style={{ flexShrink: 0, padding: '7px 15px', borderRadius: 22, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: activeCat === cat.id ? `${cat.color}22` : 'rgba(255,255,255,0.05)', border: `1px solid ${activeCat === cat.id ? cat.color : 'rgba(255,255,255,0.08)'}`, color: activeCat === cat.id ? cat.color : '#9CA3AF', transition: 'all 0.15s' }}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#4B5563' }}>
              <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px', color: '#6B7280' }}>No events in this category yet</p>
              <p style={{ fontSize: 13, margin: 0 }}>Check back soon or browse all events above</p>
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured.length > 0 && (
                <div className="pe-featured-grid">
                  {featured.map(e => (
                    <EventCard key={e.id} event={e} category={e.category_id ? catMap[e.category_id] ?? null : null} featured />
                  ))}
                </div>
              )}

              {/* Nudge 1 */}
              <div style={{ marginBottom: 20 }}>
                <SignupNudge variant="default" />
              </div>

              {/* Rest A */}
              {restA.length > 0 && (
                <div className="pe-events-grid">
                  {restA.map(e => (
                    <EventCard key={e.id} event={e} category={e.category_id ? catMap[e.category_id] ?? null : null} />
                  ))}
                </div>
              )}

              {/* Nudge 2 */}
              {restA.length >= 3 && (
                <div style={{ marginBottom: 20 }}>
                  <SignupNudge variant="gold" />
                </div>
              )}

              {/* Rest B */}
              {restB.length > 0 && (
                <div className="pe-events-grid" style={{ marginBottom: 20 }}>
                  {restB.map(e => (
                    <EventCard key={e.id} event={e} category={e.category_id ? catMap[e.category_id] ?? null : null} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Why */}
          <WhyStrip />

          {/* CTA */}
          <FinalCTA totalEvents={events.length} />
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 0 48px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <TikkitXLogo size="sm" />
            <p style={{ color: '#4B5563', fontSize: 12, margin: 0 }}>© 2026 Tikkit. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 20 }}>
              <Link href="/auth/login" style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none' }}>Sign in</Link>
              <Link href="/auth/login" style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none' }}>Join free</Link>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
