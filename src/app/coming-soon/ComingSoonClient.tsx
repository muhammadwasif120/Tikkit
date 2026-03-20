'use client'

import { useState, useEffect, useRef } from 'react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'
import { joinPlatformWaitlist } from '@/app/actions/waitlistActions'
import {
  Zap, Users, QrCode, BarChart3, CheckCircle,
  ArrowRight, Sparkles, Star,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'organizer' | 'guest' | 'both'

interface Props {
  initialCount: number
}

// ─── Particle canvas background ───────────────────────────────────────────────

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let w = 0, h = 0

    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string }[] = []
    const colors = ['rgba(30,94,255,', 'rgba(0,229,255,', 'rgba(136,0,204,']

    function resize() {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }

    function init() {
      particles.length = 0
      const count = Math.floor((w * h) / 14000)
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.6 + 0.4,
          alpha: Math.random() * 0.5 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + p.alpha + ')'
        ctx.fill()
      }

      // Draw faint connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(30,94,255,${0.06 * (1 - dist / 110)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    init()
    draw()

    const ro = new ResizeObserver(() => { resize(); init() })
    ro.observe(document.body)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  )
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now())
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      mins:    Math.floor((diff % 3600000) / 60000),
      secs:    Math.floor((diff % 60000) / 1000),
    }
  }
  const [time, setTime] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  })
  return time
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 60 }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '14px 20px',
        fontFamily: "'Clash Display', sans-serif",
        fontSize: 'clamp(26px, 5vw, 40px)',
        fontWeight: 700,
        color: '#F0F2FF',
        lineHeight: 1,
        minWidth: 72,
        textAlign: 'center',
        letterSpacing: '-1px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(30,94,255,0.08) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        {String(value).padStart(2, '0')}
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#4B5563', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  { icon: QrCode,    color: '#00E5FF', glow: 'rgba(0,229,255,0.25)',   title: 'QR Check-In',        desc: 'Scan at the door. Zero chaos.' },
  { icon: Users,     color: '#1E5EFF', glow: 'rgba(30,94,255,0.25)',   title: 'Smart Guest Lists',  desc: 'Approvals, payments, RSVPs.' },
  { icon: BarChart3, color: '#8B5CF6', glow: 'rgba(139,92,246,0.25)', title: 'Live Analytics',     desc: 'Revenue, attendance, insights.' },
]

// ─── Main component ───────────────────────────────────────────────────────────

export function ComingSoonClient({ initialCount }: Props) {
  const launchDate = new Date('2026-05-01T00:00:00')
  const countdown  = useCountdown(launchDate)

  const [role, setRole]       = useState<Role>('organizer')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')
  const [count, setCount]     = useState(initialCount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setError('')

    const res = await joinPlatformWaitlist({ full_name: name, email, phone, role })

    setLoading(false)
    if ('error' in res && res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      setCount(c => c + 1)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080A10',
      color: '#F0F2FF',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* Particle background */}
      <ParticleCanvas />

      {/* Ambient glow orbs */}
      <div style={{
        position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 800,
        background: 'radial-gradient(circle, rgba(30,94,255,0.10) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-10%',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(136,0,204,0.08) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '20%', left: '-5%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Grid lines overlay */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(30,94,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30,94,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Top nav */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '28px 24px',
        }}>
          <TikkitXLogo size="lg" />
        </nav>

        {/* Hero section */}
        <section style={{
          textAlign: 'center',
          padding: 'clamp(32px, 6vw, 80px) 24px 48px',
          maxWidth: 800,
          margin: '0 auto',
        }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 18px', borderRadius: 100,
            border: '1px solid rgba(0,229,255,0.22)',
            background: 'rgba(0,229,255,0.06)',
            marginBottom: 32,
            animation: 'fadeUp 0.6s ease both',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#00E5FF',
              boxShadow: '0 0 12px #00E5FF',
              animation: 'pulseDot 2s infinite',
            }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#00E5FF',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: "'Clash Display', sans-serif",
            }}>
              Launching Soon
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Clash Display', 'Poppins', sans-serif",
            fontSize: 'clamp(40px, 8vw, 84px)',
            fontWeight: 700,
            lineHeight: 1.0,
            letterSpacing: '-3px',
            color: '#F0F2FF',
            marginBottom: 24,
            animation: 'fadeUp 0.6s ease 0.1s both',
          }}>
            Run your events.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #00E5FF 0%, #1E5EFF 50%, #8800CC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Like a pro.
            </span>
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: 'clamp(16px, 2.2vw, 20px)',
            color: '#6B7280',
            lineHeight: 1.75,
            maxWidth: 520,
            margin: '0 auto 40px',
            animation: 'fadeUp 0.6s ease 0.2s both',
          }}>
            Pakistan's first all-in-one event management platform.
            Guest lists, QR check-in, payments, vendors — all in one place.
          </p>

          {/* Waitlist count */}
          {count > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              marginBottom: 40,
              animation: 'fadeUp 0.6s ease 0.25s both',
            }}>
              {/* Avatar stack */}
              <div style={{ display: 'flex' }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: `linear-gradient(135deg, hsl(${210 + i*40},70%,55%), hsl(${230 + i*40},70%,40%))`,
                    border: '2px solid #080A10',
                    marginLeft: i > 0 ? -8 : 0,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>
                <strong style={{ color: '#F0F2FF' }}>{count.toLocaleString()}</strong> people already on the list
              </span>
            </div>
          )}

          {/* Countdown */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            gap: 12, marginBottom: 56,
            animation: 'fadeUp 0.6s ease 0.3s both',
          }}>
            <CountdownBlock value={countdown.days}  label="Days"    />
            <div style={{ paddingTop: 12, fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.15)', lineHeight: 1 }}>:</div>
            <CountdownBlock value={countdown.hours} label="Hours"   />
            <div style={{ paddingTop: 12, fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.15)', lineHeight: 1 }}>:</div>
            <CountdownBlock value={countdown.mins}  label="Minutes" />
            <div style={{ paddingTop: 12, fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.15)', lineHeight: 1 }}>:</div>
            <CountdownBlock value={countdown.secs}  label="Seconds" />
          </div>

          {/* ─── FORM CARD ─────────────────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20,
            padding: 'clamp(24px, 4vw, 40px)',
            maxWidth: 520,
            margin: '0 auto',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 0 80px rgba(30,94,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)',
            animation: 'fadeUp 0.6s ease 0.35s both',
            position: 'relative',
            overflow: 'hidden',
          }}>

            {/* Card glow top edge */}
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '60%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.4), transparent)',
              pointerEvents: 'none',
            }} />

            {success ? (
              /* ─── Success state ─────────────────────── */
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(0,229,255,0.08)',
                  border: '1px solid rgba(0,229,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 0 40px rgba(0,229,255,0.15)',
                  animation: 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
                }}>
                  <CheckCircle size={32} color="#00E5FF" />
                </div>
                <div style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: 22, fontWeight: 700,
                  color: '#F0F2FF', marginBottom: 10,
                }}>
                  You're on the list!
                </div>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, maxWidth: 340, margin: '0 auto 20px' }}>
                  We'll send you early access when we launch.
                  Tell a friend — the more the merrier.
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 100,
                  background: 'rgba(0,229,255,0.06)',
                  border: '1px solid rgba(0,229,255,0.15)',
                  fontSize: 12, color: '#00E5FF', fontWeight: 600,
                }}>
                  <Star size={12} fill="#00E5FF" />
                  #{count.toLocaleString()} on the waitlist
                </div>
              </div>
            ) : (
              /* ─── Form state ────────────────────────── */
              <form onSubmit={handleSubmit} noValidate>
                <div style={{
                  fontSize: 17, fontWeight: 700,
                  fontFamily: "'Clash Display', sans-serif",
                  color: '#F0F2FF', marginBottom: 4, textAlign: 'left',
                }}>
                  Get early access
                </div>
                <p style={{ fontSize: 13, color: '#4B5563', marginBottom: 24, textAlign: 'left' }}>
                  Be the first to know when we go live.
                </p>

                {/* Role toggle */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    I am a...
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['organizer', 'guest', 'both'] as Role[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        style={{
                          flex: 1, padding: '10px 8px', borderRadius: 10,
                          border: role === r
                            ? '1px solid rgba(0,229,255,0.5)'
                            : '1px solid rgba(255,255,255,0.07)',
                          background: role === r
                            ? 'rgba(0,229,255,0.08)'
                            : 'rgba(255,255,255,0.03)',
                          color: role === r ? '#00E5FF' : '#6B7280',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.2s',
                          textTransform: 'capitalize',
                          boxShadow: role === r ? '0 0 16px rgba(0,229,255,0.1)' : 'none',
                        }}
                      >
                        {r === 'both' ? 'Organizer & Guest' : r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: 14 }}>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '13px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12, color: '#F0F2FF', fontSize: 14,
                      outline: 'none', fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,229,255,0.35)')}
                    onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: 14 }}>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '13px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12, color: '#F0F2FF', fontSize: 14,
                      outline: 'none', fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,229,255,0.35)')}
                    onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>

                {/* Phone (optional) */}
                <div style={{ marginBottom: 20 }}>
                  <input
                    type="tel"
                    placeholder="Phone number (optional)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{
                      width: '100%', padding: '13px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12, color: '#F0F2FF', fontSize: 14,
                      outline: 'none', fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,229,255,0.35)')}
                    onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    fontSize: 13, color: '#FCA5A5',
                  }}>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !name.trim() || !email.trim()}
                  style={{
                    width: '100%', padding: '14px 24px',
                    background: loading || !name.trim() || !email.trim()
                      ? 'rgba(0,229,255,0.15)'
                      : 'linear-gradient(135deg, #00E5FF 0%, #1E5EFF 100%)',
                    border: 'none', borderRadius: 12,
                    color: loading || !name.trim() || !email.trim() ? 'rgba(255,255,255,0.3)' : '#080A10',
                    fontSize: 14, fontWeight: 700, cursor: loading || !name.trim() || !email.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: "'Clash Display', sans-serif",
                    transition: 'all 0.2s',
                    boxShadow: !loading && name.trim() && email.trim()
                      ? '0 0 30px rgba(0,229,255,0.25)'
                      : 'none',
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderTopColor: '#080A10',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Join the Waitlist
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Feature preview strip */}
        <section style={{
          padding: '0 24px 80px',
          maxWidth: 700,
          margin: '0 auto',
        }}>
          <p style={{
            textAlign: 'center',
            fontSize: 12, fontWeight: 600, color: '#374151',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            What's coming
          </p>
          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 18px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `rgba(${f.color === '#00E5FF' ? '0,229,255' : f.color === '#1E5EFF' ? '30,94,255' : '139,92,246'},0.1)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={15} color={f.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#D1D5DB', fontFamily: "'Clash Display', sans-serif" }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#4B5563' }}>{f.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '24px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          fontSize: 12, color: '#374151',
        }}>
          © {new Date().getFullYear()} Tikkit X — built in Pakistan, for Pakistan.
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { box-shadow: 0 0 6px currentColor; }
          50%       { box-shadow: 0 0 14px currentColor; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        input::placeholder { color: #374151; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0d0f18 inset;
          -webkit-text-fill-color: #F0F2FF;
        }

        @media (max-width: 480px) {
          nav { padding: 20px 16px; }
        }
      `}</style>
    </div>
  )
}
