'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Mail, ArrowRight, Check, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function GuestLoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/guest-callback`,
        data: { role: 'guest' },
      },
    })

    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div style={{
      minHeight: '100svh', background: '#0A0C12',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Inter', sans-serif",
    }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(30,94,255,0.1) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 38, height: 38, background: '#1E5EFF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ticket size={19} color="white" />
            </div>
            <span style={{ color: 'white', fontSize: 22, fontWeight: 800, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px' }}>Tikkit</span>
          </Link>
        </div>

        {sent ? (
          /* ── Sent state ── */
          <div style={{
            background: '#13151E', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '40px 32px', textAlign: 'center',
          }}>
            <div style={{
              width: 60, height: 60, background: 'rgba(34,197,94,0.12)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Check size={26} color="#22C55E" />
            </div>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, fontFamily: 'Poppins, sans-serif', margin: '0 0 8px', letterSpacing: '-0.4px' }}>
              Check your email
            </h2>
            <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7, margin: '0 0 6px' }}>
              We sent a magic link to
            </p>
            <p style={{ color: '#E5E7EB', fontSize: 14, fontWeight: 600, margin: '0 0 24px' }}>{email}</p>
            <p style={{ color: '#4B5563', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Click the link in your email to sign in. No password needed.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              style={{
                marginTop: 24, background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: '#9CA3AF', fontSize: 13, padding: '9px 20px',
                cursor: 'pointer',
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <div style={{
            background: '#13151E', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '40px 32px',
          }}>
            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ padding: '4px 10px', background: 'rgba(30,94,255,0.12)', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Sparkles size={11} color="#4F8AFF" />
                  <span style={{ fontSize: 11, color: '#4F8AFF', fontWeight: 700, letterSpacing: '0.05em' }}>GUEST PASS</span>
                </div>
              </div>
              <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, fontFamily: 'Poppins, sans-serif', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
                Join the scene
              </h2>
              <p style={{ color: '#6B7280', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                Enter your email to get a magic link — no password, no hassle.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#4B5563" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    width: '100%', padding: '13px 14px 13px 42px',
                    background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: 'white', fontSize: 15,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#FCA5A5', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width: '100%', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: loading ? 'rgba(30,94,255,0.4)' : '#1E5EFF',
                  color: 'white', border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 0 30px rgba(30,94,255,0.25)',
                }}
              >
                {loading ? 'Sending...' : <><span>Send magic link</span> <ArrowRight size={16} /></>}
              </button>
            </form>

            {/* Perks teaser */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: '#4B5563', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>What you get</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {['Discover & register for events', 'Earn Social Credits at every event', 'Collect digital souvenir passes'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 5, height: 5, background: '#1E5EFF', borderRadius: '50%', flexShrink: 0 }} />
                    <span style={{ color: '#6B7280', fontSize: 13 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, color: '#4B5563', fontSize: 13 }}>
          Organising events?{' '}
          <Link href="/auth/login" style={{ color: '#4F8AFF', textDecoration: 'none', fontWeight: 600 }}>
            Organizer login →
          </Link>
        </p>
      </div>
    </div>
  )
}