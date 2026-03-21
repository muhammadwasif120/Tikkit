'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Eye, EyeOff, Lock, Check, AlertCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

function ResetPasswordForm() {
  const router   = useRouter()
  const supabase = createClient()

  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [done,            setDone]            = useState(false)
  const [sessionReady,    setSessionReady]    = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const strengthLevel = password.length === 0 ? 0
    : password.length < 6  ? 1
    : password.length < 10 ? 2
    : password.length < 14 ? 3 : 4

  const strengthColor = ['transparent', '#EF4444', '#F59E0B', '#FFC745', '#22C55E'][strengthLevel]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8)           { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword)  { setError('Passwords do not match.'); return }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) { setError(updateError.message) }
    else { setDone(true); setTimeout(() => router.push('/auth/login'), 3000) }
  }

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    display: 'block', width: '100%',
    padding: '14px 44px 14px 16px',
    background: focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${focused ? 'rgba(30,94,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 12, color: '#F0F2FF', fontSize: 'var(--fs-md)', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'var(--font-body)',
    transition: 'background .15s, border-color .15s',
  })

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; background: #080A10; }
        ::placeholder { color: #374151 !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0c0e16 inset !important;
          -webkit-text-fill-color: #F0F2FF !important;
        }
        @keyframes rsFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rsFadeUp  { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes orbDrift {
          0%,100% { transform: translate(0,0)       scale(1);    opacity: .18; }
          33%     { transform: translate(50px,-40px) scale(1.1);  opacity: .25; }
          66%     { transform: translate(-30px,30px) scale(0.9);  opacity: .12; }
        }
        @keyframes blobMorph {
          0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25%     { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50%     { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
          75%     { border-radius: 60% 30% 60% 40% / 70% 40% 50% 60%; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        .rs-page {
          min-height: 100svh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 40px 24px; font-family: var(--font-body);
          position: relative; overflow: hidden;
          animation: rsFadeIn .35s ease both;
        }
        .rs-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 90% 80% at 50% 10%, black 0%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 90% 80% at 50% 10%, black 0%, transparent 100%);
        }
        .rs-orb-1 {
          position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
          width: 700px; height: 550px; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse, rgba(30,94,255,.15) 0%, transparent 68%);
          animation: orbDrift 18s ease-in-out infinite;
        }
        .rs-orb-2 {
          position: fixed; bottom: 10%; right: 5%;
          width: 400px; height: 400px; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse, rgba(139,92,246,.07) 0%, transparent 70%);
          border-radius: 50%;
          animation: blobMorph 14s ease-in-out infinite;
        }
        .rs-card {
          background: rgba(13,15,22,0.92);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px; padding: 40px 36px;
          box-shadow: 0 24px 64px rgba(0,0,0,.5);
          animation: rsFadeUp .3s ease both;
        }
        @media (max-width: 480px) {
          .rs-card { padding: 28px 20px; }
          .rs-page { padding: 28px 16px; }
        }
      `}</style>

      <div className="rs-page">
        <div className="rs-grid"  aria-hidden="true" />
        <div className="rs-orb-1" aria-hidden="true" />
        <div className="rs-orb-2" aria-hidden="true" />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Link href="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              <TikkitXLogo size="lg" />
            </Link>
          </div>

          {/* Card */}
          <div className="rs-card">
            {done ? (
              /* ── Success ── */
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 60, height: 60,
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 0 24px rgba(34,197,94,0.15)',
                }}>
                  <Check size={26} color="#22C55E" />
                </div>
                <h2 style={{
                  color: '#F0F2FF', fontSize: 'var(--fs-2xl)', fontWeight: 700,
                  fontFamily: 'var(--font-display)', margin: '0 0 10px', letterSpacing: '-0.5px',
                }}>
                  Password updated
                </h2>
                <p style={{ color: '#6B7280', fontSize: 'var(--fs-md)', margin: '0 0 28px', lineHeight: 1.65 }}>
                  All done. Redirecting you to login in a moment…
                </p>
                <Link href="/auth/login" style={{
                  display: 'block', padding: '14px',
                  background: '#1E5EFF', color: 'white',
                  textDecoration: 'none', borderRadius: 12,
                  fontSize: 'var(--fs-md)', fontWeight: 700, textAlign: 'center',
                  fontFamily: 'var(--font-display)',
                  boxShadow: '0 0 32px rgba(30,94,255,0.45)',
                }}>
                  Go to Login
                </Link>
              </div>
            ) : (
              /* ── Form ── */
              <>
                {/* Icon + heading */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{
                    width: 46, height: 46,
                    background: 'rgba(30,94,255,0.12)',
                    border: '1px solid rgba(30,94,255,0.2)',
                    borderRadius: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 18,
                  }}>
                    <Lock size={20} color="#1E5EFF" />
                  </div>
                  <h2 style={{
                    color: '#F0F2FF', fontSize: 'var(--fs-2xl)', fontWeight: 700,
                    fontFamily: 'var(--font-display)', margin: '0 0 8px', letterSpacing: '-0.75px',
                  }}>
                    Set new password
                  </h2>
                  <p style={{ color: '#6B7280', fontSize: 'var(--fs-md)', margin: 0, lineHeight: 1.65 }}>
                    Choose a strong password for your Tikkit account.
                  </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* New password */}
                  <PasswordField
                    label="New Password"
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword(s => !s)}
                    placeholder="Min. 8 characters"
                  />

                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: -6 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: i <= strengthLevel ? strengthColor : 'rgba(255,255,255,0.08)',
                          transition: 'background .3s',
                        }} />
                      ))}
                    </div>
                  )}

                  {/* Confirm password */}
                  <PasswordField
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showConfirm}
                    onToggle={() => setShowConfirm(s => !s)}
                    placeholder="Repeat new password"
                  />

                  {/* Error */}
                  {error && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '11px 14px',
                      background: 'rgba(239,68,68,.08)',
                      border: '1px solid rgba(239,68,68,.15)',
                      borderRadius: 11,
                    }}>
                      <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ color: '#FCA5A5', fontSize: 'var(--fs-base)', lineHeight: 1.5 }}>{error}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                    style={{
                      marginTop: 4, width: '100%', padding: '15px',
                      background: loading || !password || !confirmPassword
                        ? 'rgba(255,255,255,0.05)'
                        : '#1E5EFF',
                      color: loading || !password || !confirmPassword ? '#374151' : 'white',
                      border: 'none', borderRadius: 12,
                      fontSize: 'var(--fs-md)', fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-display)',
                      transition: 'all .2s',
                      boxShadow: loading || !password || !confirmPassword
                        ? 'none'
                        : '0 0 32px rgba(30,94,255,0.45)',
                    }}
                  >
                    {loading ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Back to login */}
          <p style={{ textAlign: 'center', marginTop: 20, color: '#4B5563', fontSize: 'var(--fs-base)' }}>
            Remembered it?{' '}
            <Link href="/auth/login" style={{ color: '#1E5EFF', textDecoration: 'none', fontWeight: 600 }}>
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}

// ─── PasswordField ────────────────────────────────────────────────────────────

function PasswordField({ label, value, onChange, show, onToggle, placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  show: boolean; onToggle: () => void; placeholder: string
}) {
  const [focus, setFocus] = useState(false)
  return (
    <div>
      <label style={{
        display: 'block', color: '#6B7280', fontSize: 'var(--fs-xs)', fontWeight: 700,
        marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: '.08em',
        fontFamily: 'var(--font-display)',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            display: 'block', width: '100%',
            padding: '14px 44px 14px 16px',
            background: focus ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${focus ? 'rgba(30,94,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 12, color: '#F0F2FF', fontSize: 'var(--fs-md)', outline: 'none',
            boxSizing: 'border-box' as const, fontFamily: 'var(--font-body)',
            transition: 'background .15s, border-color .15s',
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', padding: 2,
            display: 'flex',
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#080A10' }} />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
