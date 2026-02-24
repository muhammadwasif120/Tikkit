'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Eye, EyeOff, Lock, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Supabase sends the user to this page with a hash fragment containing
    // the access_token. The client SDK picks it up automatically on mount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/auth/login'), 3000)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0C12',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(30,94,255,0.12) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '36px', height: '36px', background: '#1E5EFF', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ticket size={18} color="white" />
            </div>
            <span style={{ color: 'white', fontSize: '22px', fontWeight: 800, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px' }}>
              Tikkit
            </span>
          </Link>
        </div>

        {/* Card */}
        <div style={{
          background: '#13151E',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '36px',
        }}>
          {done ? (
            /* Success state */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', background: 'rgba(34,197,94,0.15)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Check size={24} color="#22C55E" />
              </div>
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', margin: '0 0 8px' }}>
                Password updated!
              </h2>
              <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.6 }}>
                Your password has been changed successfully. Redirecting you to login...
              </p>
              <Link href="/auth/login" style={{
                display: 'block', padding: '12px', background: '#1E5EFF', color: 'white',
                textDecoration: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, textAlign: 'center',
              }}>
                Go to Login
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div style={{ marginBottom: '28px' }}>
                <div style={{
                  width: '44px', height: '44px', background: 'rgba(30,94,255,0.15)',
                  borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  <Lock size={20} color="#1E5EFF" />
                </div>
                <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 800, fontFamily: 'Poppins, sans-serif', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
                  Set new password
                </h2>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
                  Choose a strong password for your Tikkit account.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* New password */}
                <div>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      style={{
                        width: '100%', padding: '11px 42px 11px 14px',
                        background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px', color: 'white', fontSize: '14px',
                        outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      style={{
                        width: '100%', padding: '11px 42px 11px 14px',
                        background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px', color: 'white', fontSize: '14px',
                        outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 0,
                      }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password strength hint */}
                {password.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '3px', borderRadius: '2px',
                        background: password.length >= i * 3
                          ? (password.length >= 10 ? '#22C55E' : password.length >= 6 ? '#FFC745' : '#EF4444')
                          : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 14px', background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                  }}>
                    <AlertCircle size={14} color="#EF4444" style={{ shrink: 0 }} />
                    <span style={{ color: '#FCA5A5', fontSize: '13px' }}>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  style={{
                    width: '100%', padding: '13px',
                    background: loading ? 'rgba(30,94,255,0.5)' : '#1E5EFF',
                    color: 'white', border: 'none', borderRadius: '10px',
                    fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '4px', transition: 'opacity 0.2s',
                    boxShadow: '0 0 30px rgba(30,94,255,0.3)',
                  }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#4B5563', fontSize: '13px' }}>
          Remembered it?{' '}
          <Link href="/auth/login" style={{ color: '#6B8FFF', textDecoration: 'none', fontWeight: 600 }}>
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0A0C12' }} />}>
      <ResetPasswordForm />
    </Suspense>
  )
}