'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

const WA_NUMBER = '13074434195'
const SESSION_KEY = 'wa-popup-shown'

function getContext(pathname: string): { heading: string; sub: string; ctaText: string } {
  if (pathname.startsWith('/dashboard'))
    return { heading: 'Need help with your event?', sub: "We'll get you sorted in under 30 mins.", ctaText: 'Chat with our team' }
  if (pathname.startsWith('/vendor/os'))
    return { heading: 'Questions about Vendor X?', sub: 'From deals to invoices — we reply in 30 mins.', ctaText: 'Chat on WhatsApp' }
  if (pathname.startsWith('/venue/os'))
    return { heading: 'Questions about your venue?', sub: 'Listings, bookings, spot maps — we reply in 30 mins.', ctaText: 'Chat on WhatsApp' }
  if (pathname.startsWith('/artist-mgmt/os'))
    return { heading: 'Questions about Artist Management?', sub: 'Rosters, enquiries, bookings — we reply in 30 mins.', ctaText: 'Chat on WhatsApp' }
  if (pathname.startsWith('/guest') || pathname.startsWith('/explore'))
    return { heading: 'Having trouble?', sub: "Can't find your ticket or pass? We reply in 30 mins.", ctaText: 'Get help now' }
  if (pathname.startsWith('/auth'))
    return { heading: "Can't log in?", sub: "We'll get you back in within 30 mins.", ctaText: 'Message us now' }
  return { heading: 'Need help?', sub: 'Chat with us on WhatsApp — we reply in under 30 mins.', ctaText: 'Chat on WhatsApp' }
}

function getWALink(heading: string) {
  const text = encodeURIComponent(`Hi TIKKIT X — ${heading}`)
  return `https://wa.me/${WA_NUMBER}?text=${text}`
}

const WA_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.549 4.104 1.508 5.836L.057 23.07a.75.75 0 0 0 .92.921l5.233-1.451A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.956 0-3.793-.497-5.388-1.371l-.371-.209-3.849 1.068 1.067-3.847-.217-.383A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
)

export default function WAHelpWidget() {
  const pathname = usePathname()
  const [open, setOpen]       = useState(false)
  const [visible, setVisible] = useState(false)

  const ctx = getContext(pathname)

  // Fade in the button after 1s, auto-open popup after 5s (once per session)
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 1000)
    const t2 = setTimeout(() => {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        setOpen(true)
        sessionStorage.setItem(SESSION_KEY, '1')
      }
    }, 5000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Re-evaluate context message when route changes (but don't re-auto-open)
  // Nothing needed — ctx is re-computed from pathname each render

  return (
    <>
      <style>{`
        @keyframes waSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(.96); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes waFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes waPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(37,211,102,.5); }
          50%      { box-shadow: 0 0 0 10px rgba(37,211,102,0); }
        }
        .wa-widget-btn {
          position: fixed; bottom: 24px; right: 24px; z-index: 9000;
          width: 56px; height: 56px; border-radius: 50%;
          background: #25D366; color: #000; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(37,211,102,.45);
          transition: transform .2s, box-shadow .2s, opacity .4s;
          animation: waPulse 2.8s ease-in-out 6s infinite;
        }
        .wa-widget-btn:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(37,211,102,.6); }
        .wa-widget-btn.hidden { opacity: 0; pointer-events: none; }

        .wa-popup {
          position: fixed; bottom: 92px; right: 24px; z-index: 9001;
          width: 300px; background: #0D0D18;
          border: 1px solid rgba(255,255,255,.1); border-radius: 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.06) inset;
          overflow: hidden;
          animation: waSlideUp .32s cubic-bezier(.4,0,.2,1) both;
        }

        .wa-popup-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px 12px;
          background: linear-gradient(135deg, #128C7E, #25D366);
        }
        .wa-popup-header-left {
          display: flex; align-items: center; gap: 10px;
        }
        .wa-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(255,255,255,.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .wa-team-name { font-size: 13px; font-weight: 800; color: #fff; line-height: 1.2; }
        .wa-online {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: rgba(255,255,255,.85); font-weight: 500;
        }
        .wa-online-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #fff;
          box-shadow: 0 0 6px rgba(255,255,255,.8);
        }
        .wa-close-btn {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,.2); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #fff; transition: background .15s; flex-shrink: 0;
        }
        .wa-close-btn:hover { background: rgba(255,255,255,.35); }

        .wa-popup-body { padding: 18px 16px 20px; }

        .wa-bubble {
          background: rgba(255,255,255,.06); border-radius: 14px 14px 14px 4px;
          padding: 12px 14px; margin-bottom: 14px; position: relative;
        }
        .wa-bubble-heading {
          font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 4px;
          font-family: var(--font-display, system-ui);
        }
        .wa-bubble-sub {
          font-size: 13px; color: rgba(240,242,255,.55); line-height: 1.55;
        }
        .wa-bubble-time {
          font-size: 10px; color: rgba(255,255,255,.25); margin-top: 8px;
          text-align: right;
        }

        .wa-response-badge {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 12px; border-radius: 10px; margin-bottom: 14px;
          background: rgba(37,211,102,.08); border: 1px solid rgba(37,211,102,.2);
          font-size: 12px; font-weight: 700; color: #22C55E;
        }
        .wa-response-badge span { color: rgba(240,242,255,.45); font-weight: 500; }

        .wa-cta {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 13px; border-radius: 12px; border: none;
          background: #25D366; color: #000; cursor: pointer;
          font-size: 14px; font-weight: 800; font-family: inherit;
          text-decoration: none;
          transition: background .15s, transform .15s, box-shadow .15s;
          box-shadow: 0 4px 16px rgba(37,211,102,.3);
        }
        .wa-cta:hover { background: #22c55e; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(37,211,102,.4); }
      `}</style>

      {/* Floating button */}
      <button
        className={`wa-widget-btn${visible ? '' : ' hidden'}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Chat with TIKKIT X on WhatsApp"
      >
        {WA_ICON}
      </button>

      {/* Popup card */}
      {open && (
        <div className="wa-popup" role="dialog" aria-label="WhatsApp support">
          {/* Header — looks like WA app */}
          <div className="wa-popup-header">
            <div className="wa-popup-header-left">
              <div className="wa-avatar">🎟</div>
              <div>
                <div className="wa-team-name">TIKKIT X Support</div>
                <div className="wa-online"><span className="wa-online-dot" />Online now</div>
              </div>
            </div>
            <button className="wa-close-btn" onClick={() => setOpen(false)} aria-label="Close">
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="wa-popup-body">
            {/* Message bubble */}
            <div className="wa-bubble">
              <div className="wa-bubble-heading">👋 {ctx.heading}</div>
              <div className="wa-bubble-sub">{ctx.sub}</div>
              <div className="wa-bubble-time">Just now</div>
            </div>

            {/* Response time badge */}
            <div className="wa-response-badge">
              ⚡ <span>Typical response time:</span> <strong>under 30 mins</strong>
            </div>

            {/* CTA */}
            <a
              href={getWALink(ctx.heading)}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-cta"
              onClick={() => setOpen(false)}
            >
              {WA_ICON}
              {ctx.ctaText}
            </a>
          </div>
        </div>
      )}
    </>
  )
}
