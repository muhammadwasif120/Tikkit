'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

const TOUR_KEY = 'tikkit_tour_v1'

type Step = {
  target: string | null
  title: string
  description: string
  emoji: string
}

const STEPS: Step[] = [
  { target: null, emoji: '👋', title: 'Welcome to Tikkit', description: "Let's take a quick tour so you know where everything is. It takes about a minute." },
  { target: '[data-tour="nav-dashboard"]', emoji: '📊', title: 'Dashboard', description: 'Your command centre — live stats, upcoming events, and recent activity at a glance.' },
  { target: '[data-tour="nav-events"]', emoji: '🎟️', title: 'Events', description: 'Create and manage all your events. Set capacity, pricing, registration mode, then go live.' },
  { target: '[data-tour="nav-guests"]', emoji: '👥', title: 'Guests', description: 'Everyone who registered across your events. Search, filter, and manage guest details.' },
  { target: '[data-tour="nav-approvals"]', emoji: '✅', title: 'Approvals', description: 'Review and approve guest registrations for events that require manual vetting.' },
  { target: '[data-tour="nav-command"]', emoji: '🤖', title: 'Command Centre', description: 'Your central hub for sending messages and communicating across your events and team.' },
  { target: '[data-tour="floating-chat"]', emoji: '💬', title: 'Live Event Chat', description: 'This button opens real-time chat for your live events. Message your guests directly from any page in the dashboard.' },
  { target: '[data-tour="nav-scan"]', emoji: '📱', title: 'QR Scanner', description: 'Scan QR tickets at the door with signed codes. Works fully offline — no internet needed at your venue.' },
  { target: '[data-tour="nav-vendors"]', emoji: '🏢', title: 'Vendors', description: 'Manage vendors and invoices across your events. Track payment status and due dates.' },
  { target: '[data-tour="nav-analytics"]', emoji: '📈', title: 'Analytics', description: 'Deep insights into attendance, revenue, and guest behaviour across all your events.' },
  { target: '[data-tour="profile-footer"]', emoji: '🪪', title: 'Your Profile', description: 'Complete your organizer profile so guests can discover you, follow your page, and register for your events.' },
  { target: null, emoji: '🎉', title: "You're all set!", description: "Explore at your own pace. You can restart this tour anytime from Settings." },
]

type HighlightRect = { top: number; left: number; width: number; height: number }

const PAD = 6
const TOOLTIP_W = 272

export default function GuidedTour() {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [highlight, setHighlight] = useState<HighlightRect | null>(null)

  useEffect(() => {
    const start = () => {
      localStorage.setItem(TOUR_KEY, '1') // mark seen immediately so it never re-triggers
      setStep(0)
      setActive(true)
    }

    if (!localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(start, 1400)
      return () => clearTimeout(t)
    }

    window.addEventListener('tikkit:start-tour', start)
    return () => window.removeEventListener('tikkit:start-tour', start)
  }, [])

  useEffect(() => {
    const current = STEPS[step]
    if (!active || !current.target) { setHighlight(null); return }
    const el = document.querySelector(current.target)
    if (!el) { setHighlight(null); return }
    const r = el.getBoundingClientRect()
    setHighlight({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step, active])

  const dismiss = useCallback(() => {
    setActive(false)
  }, [])

  const next = useCallback(() => {
    if (step === STEPS.length - 1) { dismiss(); return }
    setStep(s => s + 1)
  }, [step, dismiss])

  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!active) return
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [active, next, prev, dismiss])

  if (!active) return null

  const current = STEPS[step]
  const isCenter = !current.target
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1
  const progress = (step / (STEPS.length - 1)) * 100

  // Clamp tooltip so it never goes off-screen
  let tooltipStyle: React.CSSProperties = {}
  if (highlight) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const MARGIN = 12

    // Prefer right of highlight; if no room, go left
    let left = highlight.left + highlight.width + 16
    if (left + TOOLTIP_W > vw - MARGIN) {
      left = highlight.left - TOOLTIP_W - 16
    }
    left = Math.max(MARGIN, Math.min(left, vw - TOOLTIP_W - MARGIN))

    const cardH = 200 // approx
    let top = highlight.top + highlight.height / 2 - cardH / 2
    top = Math.max(MARGIN, Math.min(top, vh - cardH - MARGIN))

    tooltipStyle = { position: 'fixed', top, left, width: TOOLTIP_W, zIndex: 10001 }
  }

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: isCenter ? 'rgba(0,0,0,0.78)' : 'rgba(0,0,0,0.62)',
          backdropFilter: isCenter ? 'blur(3px)' : 'none',
          transition: 'background 0.3s ease',
        }}
        onClick={dismiss}
      />

      {/* Spotlight */}
      {highlight && (
        <div style={{
          position: 'fixed',
          top: highlight.top - PAD,
          left: highlight.left - PAD,
          width: highlight.width + PAD * 2,
          height: highlight.height + PAD * 2,
          zIndex: 9999,
          borderRadius: 12,
          boxShadow: '0 0 0 3px #1E5EFF, 0 0 0 7px rgba(30,94,255,0.22), 0 0 32px rgba(30,94,255,0.15)',
          background: 'rgba(30,94,255,0.04)',
          pointerEvents: 'none',
          transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
        }} />
      )}

      {/* Center modal */}
      {isCenter && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
          width: 'min(360px, calc(100vw - 32px))',
        }}>
          <TourCard step={current} stepIndex={step} total={STEPS.length}
            isFirst={isFirst} isLast={isLast} progress={progress}
            onNext={next} onPrev={prev} onDismiss={dismiss} center />
        </div>
      )}

      {/* Sidebar tooltip */}
      {!isCenter && highlight && (
        <div style={tooltipStyle}>
          <TourCard step={current} stepIndex={step} total={STEPS.length}
            isFirst={isFirst} isLast={isLast} progress={progress}
            onNext={next} onPrev={prev} onDismiss={dismiss} />
        </div>
      )}
    </>
  )
}

function TourCard({ step, stepIndex, total, isFirst, isLast, progress, onNext, onPrev, onDismiss, center }: {
  step: Step; stepIndex: number; total: number
  isFirst: boolean; isLast: boolean; progress: number
  onNext: () => void; onPrev: () => void; onDismiss: () => void
  center?: boolean
}) {
  const px = center ? 24 : 18
  const py = center ? 24 : 16

  return (
    <div style={{
      background: 'rgba(12,14,22,0.97)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 14,
      padding: `${py}px ${px}px`,
      boxShadow: '0 20px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <span style={{ fontSize: center ? 26 : 20, flexShrink: 0 }}>{step.emoji}</span>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: center ? 16 : 13, fontWeight: 700, color: '#fff',
              fontFamily: 'var(--font-display)', lineHeight: 1.2, margin: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {step.title}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: '2px 0 0', fontFamily: 'var(--font-body)' }}>
              {stepIndex + 1} / {total}
            </p>
          </div>
        </div>
        <button onClick={onDismiss} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
          flexShrink: 0, transition: 'all 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          title="Skip tour"
        >
          <X size={12} />
        </button>
      </div>

      {/* Description */}
      <p style={{
        fontSize: center ? 13.5 : 12, color: 'rgba(255,255,255,0.58)',
        lineHeight: 1.6, margin: '0 0 14px', fontFamily: 'var(--font-body)',
      }}>
        {step.description}
      </p>

      {/* Progress bar */}
      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)', marginBottom: 14, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, width: `${progress}%`,
          background: 'linear-gradient(90deg, #1E5EFF, #3b82f6)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <button onClick={onPrev} disabled={isFirst} style={{
          display: 'flex', alignItems: 'center', gap: 3,
          padding: '6px 10px', fontSize: 11, fontWeight: 600, borderRadius: 7,
          border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)',
          color: isFirst ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.55)',
          cursor: isFirst ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)',
          whiteSpace: 'nowrap' as const, flexShrink: 0,
        }}>
          <ChevronLeft size={12} />Back
        </button>

        {/* Condensed dot indicators — max 7 visible, rest collapsed */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', overflow: 'hidden', flex: 1, justifyContent: 'center' }}>
          {STEPS.map((_, i) => {
            // Show current ±2, first, last; collapse middle as single dim dot
            const show = i === stepIndex || i === 0 || i === total - 1 || Math.abs(i - stepIndex) <= 1
            if (!show) {
              if (i === 1 && stepIndex > 2) return <div key={i} style={{ width: 3, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
              if (i === total - 2 && stepIndex < total - 3) return <div key={i} style={{ width: 3, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
              return null
            }
            return (
              <div key={i} style={{
                width: i === stepIndex ? 14 : 5, height: 5, borderRadius: 99,
                background: i === stepIndex ? '#1E5EFF' : i < stepIndex ? 'rgba(30,94,255,0.4)' : 'rgba(255,255,255,0.12)',
                transition: 'all 0.25s ease', flexShrink: 0,
              }} />
            )
          })}
        </div>

        <button onClick={onNext} style={{
          display: 'flex', alignItems: 'center', gap: 3,
          padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 7,
          border: 'none', background: 'linear-gradient(135deg, #1E5EFF, #3b82f6)',
          color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)',
          boxShadow: '0 3px 10px rgba(30,94,255,0.3)', whiteSpace: 'nowrap' as const,
          flexShrink: 0,
        }}>
          {isLast ? <><Sparkles size={11} />Done</> : <>Next<ChevronRight size={12} /></>}
        </button>
      </div>
    </div>
  )
}
