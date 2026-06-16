'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

const WA_NUMBER   = '13074434195'
const SESSION_KEY = 'wa-popup-shown'   // auto-pop shown this session
const DISMISS_KEY = 'wa-popup-closed'  // user explicitly closed — don't auto-pop on nav
const AUTO_CLOSE_MS = 10_000           // 10 s idle → minimize

function getContext(pathname: string) {
  if (pathname.startsWith('/dashboard'))
    return { heading: 'Need help with your event?',         sub: "We'll get you sorted in under 30 mins.",            cta: 'Chat with our team' }
  if (pathname.startsWith('/vendor/os'))
    return { heading: 'Questions about Vendor X?',          sub: 'Deals, invoices, cross-hires — we reply in 30 mins.', cta: 'Chat on WhatsApp' }
  if (pathname.startsWith('/venue/os'))
    return { heading: 'Questions about your venue?',        sub: 'Listings, bookings, spot maps — we reply in 30 mins.', cta: 'Chat on WhatsApp' }
  if (pathname.startsWith('/artist-mgmt/os'))
    return { heading: 'Questions about Artist Management?', sub: 'Rosters, enquiries, bookings — we reply in 30 mins.', cta: 'Chat on WhatsApp' }
  if (pathname.startsWith('/guest') || pathname.startsWith('/explore'))
    return { heading: 'Having trouble?',                    sub: "Can't find your ticket or pass? We reply in 30 mins.", cta: 'Get help now' }
  if (pathname.startsWith('/auth'))
    return { heading: "Can't log in?",                      sub: "We'll get you back in within 30 mins.",               cta: 'Message us now' }
  return   { heading: 'Need help?',                         sub: 'Chat with us on WhatsApp — we reply in under 30 mins.', cta: 'Chat on WhatsApp' }
}

const WA_SVG = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.549 4.104 1.508 5.836L.057 23.07a.75.75 0 0 0 .92.921l5.233-1.451A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.956 0-3.793-.497-5.388-1.371l-.371-.209-3.849 1.068 1.067-3.847-.217-.383A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
)

export default function WAHelpWidget() {
  const pathname              = usePathname()
  const [open, setOpen]       = useState(false)
  const [visible, setVisible] = useState(false)
  const [paused, setPaused]   = useState(false)  // hover pause
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animKeyRef            = useRef(0)         // bump to restart CSS animation

  const ctx = getContext(pathname)

  // On dashboard routes FloatingChat occupies bottom-right — sit above it
  const hasChatBubble = pathname.startsWith('/dashboard')
  const btnBottom = hasChatBubble ? 88 : 24
  const popupBottom = hasChatBubble ? 152 : 86

  // ── Auto-close timer ─────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setOpen(false), AUTO_CLOSE_MS)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => {
    if (open && !paused) {
      startTimer()
    } else {
      stopTimer()
    }
    return stopTimer
  }, [open, paused, startTimer, stopTimer])

  // ── Initial fade-in + one-time auto-pop ──────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 1000)
    const t2 = setTimeout(() => {
      // Only auto-pop if: not shown this session AND user hasn't manually dismissed before
      if (!sessionStorage.getItem(SESSION_KEY) && !sessionStorage.getItem(DISMISS_KEY)) {
        setOpen(true)
        animKeyRef.current++
        sessionStorage.setItem(SESSION_KEY, '1')
      }
    }, 5000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])  // runs once on mount — layout persists across nav so this is correct

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleOpen = () => {
    setOpen(o => {
      if (!o) animKeyRef.current++  // restart progress bar animation
      return !o
    })
  }

  const handleClose = () => {
    setOpen(false)
    sessionStorage.setItem(DISMISS_KEY, '1')  // remember manual close → no re-auto-pop
  }

  const handleMouseEnter = () => { setPaused(true);  stopTimer()  }
  const handleMouseLeave = () => { setPaused(false); startTimer() }

  return (
    <div style={{ '--wa-btn-bottom': `${btnBottom}px`, '--wa-popup-bottom': `${popupBottom}px` } as React.CSSProperties}>
      <style>{`
        @keyframes waSlideUp {
          from { opacity:0; transform:translateY(14px) scale(.97); }
          to   { opacity:1; transform:none; }
        }
        @keyframes waPulse {
          0%,100% { box-shadow:0 0 0 0 rgba(37,211,102,.5); }
          50%      { box-shadow:0 0 0 10px rgba(37,211,102,0); }
        }
        @keyframes waProgress {
          from { width:100%; }
          to   { width:0%; }
        }
        .wa-widget-btn {
          position:fixed; bottom:var(--wa-btn-bottom,24px); right:24px; z-index:9000;
          width:52px; height:52px; border-radius:50%;
          background:#25D366; color:#000; border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 20px rgba(37,211,102,.4);
          transition:transform .2s, box-shadow .2s, opacity .5s;
          animation:waPulse 3s ease-in-out 8s infinite;
        }
        .wa-widget-btn:hover { transform:scale(1.1); box-shadow:0 6px 28px rgba(37,211,102,.6); }
        .wa-widget-btn.wa-hidden { opacity:0; pointer-events:none; }

        .wa-popup {
          position:fixed; bottom:var(--wa-popup-bottom,86px); right:24px; z-index:9001;
          width:296px;
          background:#0D0D18;
          border:1px solid rgba(255,255,255,.1); border-radius:20px;
          box-shadow:0 24px 64px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.06) inset;
          overflow:hidden;
          animation:waSlideUp .28s cubic-bezier(.4,0,.2,1) both;
        }

        /* Progress bar — restarts via key trick */
        .wa-progress {
          height:2px; background:rgba(255,255,255,.06);
          position:relative; overflow:hidden;
        }
        .wa-progress-bar {
          position:absolute; left:0; top:0; height:100%;
          background:linear-gradient(90deg,#128C7E,#25D366);
          animation:waProgress ${AUTO_CLOSE_MS}ms linear forwards;
        }
        .wa-progress-bar.paused { animation-play-state:paused; }

        .wa-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 14px 10px;
          background:linear-gradient(135deg,#128C7E,#25D366);
        }
        .wa-header-left { display:flex; align-items:center; gap:9px; }
        .wa-avatar {
          width:36px; height:36px; border-radius:50%;
          background:rgba(255,255,255,.2);
          display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0;
        }
        .wa-team { font-size:13px; font-weight:800; color:#fff; line-height:1.2; }
        .wa-online { display:flex; align-items:center; gap:4px; font-size:11px; color:rgba(255,255,255,.85); }
        .wa-online-dot { width:5px; height:5px; border-radius:50%; background:#fff; box-shadow:0 0 5px rgba(255,255,255,.8); }
        .wa-x {
          width:26px; height:26px; border-radius:50%;
          background:rgba(255,255,255,.2); border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          color:#fff; transition:background .15s; flex-shrink:0;
        }
        .wa-x:hover { background:rgba(255,255,255,.35); }

        .wa-body { padding:16px 14px 18px; }
        .wa-bubble {
          background:rgba(255,255,255,.06); border-radius:14px 14px 14px 4px;
          padding:11px 13px; margin-bottom:12px;
        }
        .wa-bubble-h { font-size:13px; font-weight:800; color:#fff; margin-bottom:3px; font-family:var(--font-display,system-ui); }
        .wa-bubble-s { font-size:12px; color:rgba(240,242,255,.5); line-height:1.55; }
        .wa-bubble-t { font-size:10px; color:rgba(255,255,255,.2); margin-top:7px; text-align:right; }

        .wa-badge {
          display:flex; align-items:center; gap:6px; margin-bottom:12px;
          padding:7px 11px; border-radius:9px;
          background:rgba(37,211,102,.07); border:1px solid rgba(37,211,102,.18);
          font-size:11px; font-weight:700; color:#22C55E;
        }
        .wa-badge span { color:rgba(240,242,255,.4); font-weight:500; }

        .wa-cta {
          display:flex; align-items:center; justify-content:center; gap:7px;
          width:100%; padding:12px; border-radius:11px; border:none;
          background:#25D366; color:#000; cursor:pointer;
          font-size:13px; font-weight:800; font-family:inherit;
          text-decoration:none;
          box-shadow:0 3px 14px rgba(37,211,102,.28);
          transition:background .15s, transform .15s, box-shadow .15s;
        }
        .wa-cta:hover { background:#22c55e; transform:translateY(-1px); box-shadow:0 5px 20px rgba(37,211,102,.4); }
      `}</style>

      {/* Floating button */}
      <button
        className={`wa-widget-btn${visible ? '' : ' wa-hidden'}`}
        onClick={handleOpen}
        aria-label="Chat with TIKKIT X on WhatsApp"
      >
        {WA_SVG}
      </button>

      {/* Popup */}
      {open && (
        <div
          className="wa-popup"
          role="dialog"
          aria-label="TIKKIT X WhatsApp support"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseEnter}
        >
          {/* Auto-close countdown bar */}
          <div className="wa-progress">
            <div
              key={animKeyRef.current}
              className={`wa-progress-bar${paused ? ' paused' : ''}`}
            />
          </div>

          {/* Header */}
          <div className="wa-header">
            <div className="wa-header-left">
              <div className="wa-avatar">🎟</div>
              <div>
                <div className="wa-team">TIKKIT X Support</div>
                <div className="wa-online"><span className="wa-online-dot" />Online now</div>
              </div>
            </div>
            <button className="wa-x" onClick={handleClose} aria-label="Dismiss">
              <X size={13} />
            </button>
          </div>

          {/* Body */}
          <div className="wa-body">
            <div className="wa-bubble">
              <div className="wa-bubble-h">👋 {ctx.heading}</div>
              <div className="wa-bubble-s">{ctx.sub}</div>
              <div className="wa-bubble-t">Just now</div>
            </div>
            <div className="wa-badge">
              ⚡ <span>Typical response:</span> <strong>under 30 mins</strong>
            </div>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hi TIKKIT X — ${ctx.heading}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-cta"
              onClick={handleClose}
            >
              {WA_SVG}
              {ctx.cta}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
